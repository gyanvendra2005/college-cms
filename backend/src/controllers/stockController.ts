import { Request, Response } from 'express';
import { MovementType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantity, movementType, reason, referenceId } = req.body;

    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      sendError(res, 'Quantity must be a positive integer', 400);
      return;
    }

    // Perform atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      let newStock = product.currentStock;

      if (movementType === MovementType.IN) {
        newStock += qty;
      } else if (movementType === MovementType.OUT) {
        if (product.currentStock < qty) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${qty}`
          );
        }
        newStock -= qty;
      } else {
        throw new Error('Invalid movement type');
      }

      // Update product current stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // Create immutable audit log
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantity: qty,
          movementType: movementType as MovementType,
          reason,
          referenceId: referenceId || null,
          createdById: req.user!.id,
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return { product: updatedProduct, movement };
    });

    sendSuccess(res, result, 'Stock adjusted successfully', 200);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to adjust stock', 400);
  }
};

export const getStockMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const productId = req.query.productId as string | undefined;
    const movementType = req.query.movementType as MovementType | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (movementType) where.movementType = movementType;

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
    ]);

    sendSuccess(
      res,
      {
        movements,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Stock movements retrieved successfully'
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch stock movements', 500);
  }
};
