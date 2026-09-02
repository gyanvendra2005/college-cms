import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  movementType: z.enum(['IN', 'OUT'], {
    errorMap: () => ({ message: 'Movement type must be IN or OUT' }),
  }),
  reason: z.string().min(3, 'A clear reason for stock adjustment is required'),
  referenceId: z.string().optional().or(z.literal('')),
});
