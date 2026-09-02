import { Request, Response } from 'express';
import { ChallanStatus, MovementType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { generateChallanNumber } from '../utils/challanNumber';
import { sendSuccess, sendError } from '../utils/response';

export const getChallans = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as ChallanStatus | undefined;
    const customerId = req.query.customerId as string | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where }),
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, mobile: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          items: true,
        },
      }),
    ]);

    sendSuccess(
      res,
      {
        challans,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Sales challans retrieved successfully'
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch challans', 500);
  }
};

export const getChallanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, role: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, currentStock: true },
            },
          },
        },
      },
    });

    if (!challan) {
      sendError(res, 'Sales Challan not found', 404);
      return;
    }

    sendSuccess(res, challan, 'Challan details retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch challan', 500);
  }
};

export const createChallan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, status = 'DRAFT', notes, items } = req.body;

    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      sendError(res, 'Selected customer does not exist', 404);
      return;
    }

    const challanNumber = await generateChallanNumber();

    // Fetch product details for snapshotting and stock validation
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate that all products exist
    for (const item of items) {
      if (!productMap.has(item.productId)) {
        sendError(res, `Product with ID ${item.productId} not found`, 404);
        return;
      }
    }

    // Prepare line items snapshot data
    let totalQuantity = 0;
    let totalAmount = 0;
    const preparedItems = items.map((item: any) => {
      const prod = productMap.get(item.productId)!;
      const itemTotalPrice = item.quantity * prod.unitPrice;
      totalQuantity += item.quantity;
      totalAmount += itemTotalPrice;

      return {
        productId: prod.id,
        productNameSnapshot: prod.name,
        skuSnapshot: prod.sku,
        unitPriceSnapshot: prod.unitPrice,
        quantity: item.quantity,
        totalPrice: itemTotalPrice,
      };
    });

    // Execute within transaction
    const newChallan = await prisma.$transaction(async (tx) => {
      // If status is CONFIRMED, check stock and deduct
      if (status === ChallanStatus.CONFIRMED) {
        for (const item of items) {
          const currentProd = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!currentProd) {
            throw new Error(`Product not found during transaction: ${item.productId}`);
          }

          if (currentProd.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${currentProd.name}" (${currentProd.sku}). Available: ${currentProd.currentStock}, Requested: ${item.quantity}`
            );
          }

          // Decrement stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: currentProd.currentStock - item.quantity,
            },
          });

          // Create stock movement log
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: MovementType.OUT,
              reason: `Sales Challan #${challanNumber}`,
              referenceId: challanNumber,
              createdById: req.user!.id,
            },
          });
        }
      }

      // Create Sales Challan with Snapshots
      const created = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          status: status as ChallanStatus,
          totalQuantity,
          totalAmount,
          notes: notes || null,
          createdById: req.user!.id,
          items: {
            create: preparedItems,
          },
        },
        include: {
          customer: true,
          items: true,
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return created;
    });

    sendSuccess(res, newChallan, 'Sales Challan created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create sales challan', 400);
  }
};

export const confirmChallan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      sendError(res, 'Sales Challan not found', 404);
      return;
    }

    if (challan.status === ChallanStatus.CONFIRMED) {
      sendError(res, 'Challan is already confirmed', 400);
      return;
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      sendError(res, 'Cannot confirm a cancelled challan', 400);
      return;
    }

    // Execute confirmation transaction
    const updatedChallan = await prisma.$transaction(async (tx) => {
      // Validate and deduct stock for each item
      for (const item of challan.items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!prod) {
          throw new Error(`Product ${item.productNameSnapshot} no longer exists`);
        }

        if (prod.currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${prod.name}" (${prod.sku}). Available: ${prod.currentStock}, Requested: ${item.quantity}`
          );
        }

        // Deduct inventory
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: prod.currentStock - item.quantity,
          },
        });

        // Record stock movement log
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: MovementType.OUT,
            reason: `Sales Challan #${challan.challanNumber}`,
            referenceId: challan.challanNumber,
            createdById: req.user!.id,
          },
        });
      }

      // Update status to CONFIRMED
      const confirmed = await tx.salesChallan.update({
        where: { id },
        data: {
          status: ChallanStatus.CONFIRMED,
        },
        include: {
          customer: true,
          items: true,
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return confirmed;
    });

    sendSuccess(res, updatedChallan, 'Sales Challan confirmed and stock updated');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to confirm challan', 400);
  }
};

export const cancelChallan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      sendError(res, 'Sales Challan not found', 404);
      return;
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      sendError(res, 'Challan is already cancelled', 400);
      return;
    }

    const cancelledChallan = await prisma.$transaction(async (tx) => {
      // If was confirmed, restore stock back into warehouse
      if (challan.status === ChallanStatus.CONFIRMED) {
        for (const item of challan.items) {
          const prod = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (prod) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                currentStock: prod.currentStock + item.quantity,
              },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                movementType: MovementType.IN,
                reason: `Cancelled Sales Challan #${challan.challanNumber}`,
                referenceId: challan.challanNumber,
                createdById: req.user!.id,
              },
            });
          }
        }
      }

      return await tx.salesChallan.update({
        where: { id },
        data: { status: ChallanStatus.CANCELLED },
        include: { customer: true, items: true },
      });
    });

    sendSuccess(res, cancelledChallan, 'Sales Challan cancelled successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to cancel challan', 400);
  }
};
