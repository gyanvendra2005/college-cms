import { z } from 'zod';

export const challanItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
  notes: z.string().optional().or(z.literal('')),
  items: z
    .array(challanItemInputSchema)
    .min(1, 'Challan must contain at least one line item'),
});

export const updateChallanStatusSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']),
});
