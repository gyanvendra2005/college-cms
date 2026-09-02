import { Request, Response } from 'express';
import { CustomerStatus, CustomerType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as CustomerStatus | undefined;
    const type = req.query.type as CustomerType | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              customerNotes: true,
              salesChallans: true,
            },
          },
        },
      }),
    ]);

    sendSuccess(
      res,
      {
        customers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Customers retrieved successfully'
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch customers', 500);
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        customerNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true, email: true },
            },
          },
        },
        salesChallans: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            createdBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!customer) {
      sendError(res, 'Customer not found', 404);
      return;
    }

    sendSuccess(res, customer, 'Customer details retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch customer', 500);
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      type,
      status,
      address,
      nextFollowUp,
      notes,
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email: email || null,
        businessName,
        gstNumber: gstNumber || null,
        type: type || CustomerType.RETAIL,
        status: status || CustomerStatus.LEAD,
        address: address || null,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        notes: notes || null,
      },
    });

    // If an initial note is provided, log it into CustomerNote table as well
    if (notes && req.user) {
      await prisma.customerNote.create({
        data: {
          customerId: customer.id,
          createdById: req.user.id,
          note: `Initial Note: ${notes}`,
        },
      });
    }

    sendSuccess(res, customer, 'Customer created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create customer', 500);
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.nextFollowUp) {
      updateData.nextFollowUp = new Date(updateData.nextFollowUp);
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    sendSuccess(res, updated, 'Customer updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update customer', 500);
  }
};

export const addCustomerNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      sendError(res, 'Customer not found', 404);
      return;
    }

    const newNote = await prisma.customerNote.create({
      data: {
        customerId: id,
        createdById: req.user.id,
        note,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    sendSuccess(res, newNote, 'Follow-up note added successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to add note', 500);
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if customer has confirmed challans
    const challanCount = await prisma.salesChallan.count({
      where: { customerId: id },
    });

    if (challanCount > 0) {
      sendError(
        res,
        'Cannot delete customer with existing sales challans. Consider setting status to Inactive.',
        400
      );
      return;
    }

    await prisma.customer.delete({ where: { id } });
    sendSuccess(res, { id }, 'Customer deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete customer', 500);
  }
};
