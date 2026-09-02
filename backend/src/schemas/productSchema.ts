import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU must be at least 2 characters').toUpperCase(),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be greater than zero'),
  currentStock: z.number().int().min(0, 'Initial stock cannot be negative').default(0),
  minStockAlert: z.number().int().min(0, 'Minimum stock alert must be at least 0').default(5),
  location: z.string().optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial();
