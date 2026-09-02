import { Request, Response } from 'express';
import { ChallanStatus, CustomerStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      leadCustomers,
      totalProducts,
      allProducts,
      totalChallans,
      confirmedChallans,
      draftChallans,
      recentChallans,
      recentMovements,
      recentNotes,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: CustomerStatus.ACTIVE } }),
      prisma.customer.count({ where: { status: CustomerStatus.LEAD } }),
      prisma.product.count(),
      prisma.product.findMany({
        select: { id: true, name: true, sku: true, currentStock: true, minStockAlert: true },
      }),
      prisma.salesChallan.count(),
      prisma.salesChallan.findMany({
        where: { status: ChallanStatus.CONFIRMED },
        select: { totalAmount: true },
      }),
      prisma.salesChallan.count({ where: { status: ChallanStatus.DRAFT } }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.customerNote.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } },
        },
      }),
    ]);

    const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlert);

    const totalRevenue = confirmedChallans.reduce((acc, curr) => acc + curr.totalAmount, 0);

    sendSuccess(
      res,
      {
        metrics: {
          totalCustomers,
          activeCustomers,
          leadCustomers,
          totalProducts,
          lowStockCount: lowStockProducts.length,
          totalChallans,
          draftChallans,
          confirmedChallansCount: confirmedChallans.length,
          totalRevenue,
        },
        lowStockAlerts: lowStockProducts,
        recentChallans,
        recentMovements,
        recentNotes,
      },
      'Dashboard metrics retrieved successfully'
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch dashboard metrics', 500);
  }
};
