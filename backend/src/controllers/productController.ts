import { Request, Response } from 'express';
import { MovementType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const isLowStock = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    let products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (isLowStock) {
      products = products.filter((p) => p.currentStock <= p.minStockAlert);
    }

    const total = products.length;
    const paginatedProducts = products.slice(skip, skip + limit);

    sendSuccess(
      res,
      {
        products: paginatedProducts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Products retrieved successfully'
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch products', 500);
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!product) {
      sendError(res, 'Product not found', 404);
      return;
    }

    sendSuccess(res, product, 'Product retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch product', 500);
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;

    const existing = await prisma.product.findUnique({
      where: { sku: sku.toUpperCase().trim() },
    });

    if (existing) {
      sendError(res, `Product with SKU "${sku}" already exists`, 400);
      return;
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          sku: sku.toUpperCase().trim(),
          category,
          unitPrice: Number(unitPrice),
          currentStock: Number(currentStock) || 0,
          minStockAlert: Number(minStockAlert) || 5,
          location: location || null,
        },
      });

      // If initial stock > 0, log opening stock entry
      if (created.currentStock > 0 && req.user) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            quantity: created.currentStock,
            movementType: MovementType.IN,
            reason: 'Initial Opening Stock Entry',
            createdById: req.user.id,
          },
        });
      }

      return created;
    });

    sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create product', 500);
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, category, unitPrice, minStockAlert, location } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(unitPrice !== undefined && { unitPrice: Number(unitPrice) }),
        ...(minStockAlert !== undefined && { minStockAlert: Number(minStockAlert) }),
        ...(location !== undefined && { location }),
      },
    });

    sendSuccess(res, updated, 'Product updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update product', 500);
  }
};

export const getLowStockAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { currentStock: 'asc' },
    });

    const lowStockItems = products.filter((p) => p.currentStock <= p.minStockAlert);

    sendSuccess(res, lowStockItems, 'Low stock items retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve low stock alerts', 500);
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    sendSuccess(
      res,
      categories.map((c) => c.category),
      'Categories retrieved'
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve categories', 500);
  }
};
