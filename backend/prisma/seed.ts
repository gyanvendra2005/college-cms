import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  await prisma.challanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const passwordAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordSales = await bcrypt.hash('Sales@123', 10);
  const passwordWarehouse = await bcrypt.hash('Warehouse@123', 10);
  const passwordAccounts = await bcrypt.hash('Accounts@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@erp.com',
      password: passwordAdmin,
      role: Role.ADMIN,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sarah Sales',
      email: 'sales@erp.com',
      password: passwordSales,
      role: Role.SALES,
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Warren Warehouse',
      email: 'warehouse@erp.com',
      password: passwordWarehouse,
      role: Role.WAREHOUSE,
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Alex Accounts',
      email: 'accounts@erp.com',
      password: passwordAccounts,
      role: Role.ACCOUNTS,
    },
  });

  const productsData = [
    {
      name: 'Premium Leather Ankle Boots (Brown)',
      sku: 'SH-BT-L-BRN-42',
      category: 'Boots',
      unitPrice: 3500.00,
      currentStock: 150,
      minStockAlert: 30,
      location: 'Warehouse-A / Rack-01',
    },
    {
      name: 'Pro Runner Sports Shoes (Neon Green)',
      sku: 'SH-SP-RN-GRN-40',
      category: 'Sports',
      unitPrice: 2800.00,
      currentStock: 300,
      minStockAlert: 50,
      location: 'Warehouse-A / Rack-04',
    },
    {
      name: 'Classic Canvas Sneakers (White)',
      sku: 'SH-SN-CV-WHT-41',
      category: 'Sneakers',
      unitPrice: 1500.00,
      currentStock: 25,
      minStockAlert: 40,
      location: 'Warehouse-B / Bin-12',
    },
    {
      name: 'Trekking Heavy-Duty Boots (Black)',
      sku: 'SH-TR-HD-BLK-44',
      category: 'Boots',
      unitPrice: 4500.00,
      currentStock: 8,
      minStockAlert: 15,
      location: 'Warehouse-B / Rack-08',
    },
    {
      name: 'Casual Loafers (Navy Blue)',
      sku: 'SH-LF-CS-NVY-42',
      category: 'Casual',
      unitPrice: 2100.00,
      currentStock: 85,
      minStockAlert: 20,
      location: 'Warehouse-A / Rack-02',
    },
  ];

  const createdProducts: any[] = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    createdProducts.push(prod);

    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        quantity: prod.currentStock,
        movementType: MovementType.IN,
        reason: 'Initial Opening Stock Entry',
        createdById: warehouseUser.id,
      },
    });
  }

  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rahul Sharma',
      mobile: '6396491411',
      email: 'rahul.sharma@sharmafootwear.in',
      businessName: 'Sharma Footwear Retail',
      gstNumber: '07AABCS1429B1Z',
      type: CustomerType.RETAIL,
      status: CustomerStatus.ACTIVE,
      address: 'Shop No. 4, Main Market, Chandni Chowk, Delhi - 110006',
      nextFollowUp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Key retail client in Delhi. Prefers premium leather boots.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Vikram Singh',
      mobile: '+91 9876543210',
      email: 'purchase@vikramenterprises.com',
      businessName: 'Vikram Enterprises',
      gstNumber: '27AADCV5582Q1ZN',
      type: CustomerType.WHOLESALE,
      status: CustomerStatus.ACTIVE,
      address: 'Gala No. 12, Andheri East, Mumbai - 400093',
      nextFollowUp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Wholesale buyer for sports shoes and canvas sneakers.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Anita Desai',
      mobile: '+91 8765432109',
      email: 'anita.desai@soletraders.co.in',
      businessName: 'Sole Traders',
      gstNumber: null,
      type: CustomerType.DISTRIBUTOR,
      status: CustomerStatus.LEAD,
      address: 'Koramangala 4th Block, Bangalore - 560034',
      nextFollowUp: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      notes: 'New prospective distributor for South India region.',
    },
  });

  await prisma.customerNote.createMany({
    data: [
      {
        customerId: customer1.id,
        createdById: salesUser.id,
        note: 'Visited store in Chandni Chowk. Client requested bulk discount on Ankle Boots.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customer1.id,
        createdById: salesUser.id,
        note: 'Sent updated catalog for winter boots.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        customerId: customer3.id,
        createdById: salesUser.id,
        note: 'Introduced distributor pricing tier. Waiting for confirmation on first sample order.',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    ],
  });

  const challanNumber1 = 'CH-202609-0001';
  const item1 = createdProducts[0];
  const item2 = createdProducts[1];

  const qty1 = 20;
  const qty2 = 50;
  const totalAmount = qty1 * item1.unitPrice + qty2 * item2.unitPrice;

  await prisma.salesChallan.create({
    data: {
      challanNumber: challanNumber1,
      customerId: customer1.id,
      status: ChallanStatus.CONFIRMED,
      totalQuantity: qty1 + qty2,
      totalAmount: totalAmount,
      notes: 'Urgent delivery for upcoming festive season.',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: item1.id,
            productNameSnapshot: item1.name,
            skuSnapshot: item1.sku,
            unitPriceSnapshot: item1.unitPrice,
            quantity: qty1,
            totalPrice: qty1 * item1.unitPrice,
          },
          {
            productId: item2.id,
            productNameSnapshot: item2.name,
            skuSnapshot: item2.sku,
            unitPriceSnapshot: item2.unitPrice,
            quantity: qty2,
            totalPrice: qty2 * item2.unitPrice,
          },
        ],
      },
    },
  });

  await prisma.stockMovement.createMany({
    data: [
      {
        productId: item1.id,
        quantity: qty1,
        movementType: MovementType.OUT,
        reason: `Sales Challan #${challanNumber1}`,
        referenceId: challanNumber1,
        createdById: salesUser.id,
      },
      {
        productId: item2.id,
        quantity: qty2,
        movementType: MovementType.OUT,
        reason: `Sales Challan #${challanNumber1}`,
        referenceId: challanNumber1,
        createdById: salesUser.id,
      },
    ],
  });

  const challanNumber2 = 'CH-202609-0002';
  const item3 = createdProducts[2];
  const qty3 = 10;

  await prisma.salesChallan.create({
    data: {
      challanNumber: challanNumber2,
      customerId: customer2.id,
      status: ChallanStatus.DRAFT,
      totalQuantity: qty3,
      totalAmount: qty3 * item3.unitPrice,
      notes: 'Draft awaiting customer PO confirmation.',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: item3.id,
            productNameSnapshot: item3.name,
            skuSnapshot: item3.sku,
            unitPriceSnapshot: item3.unitPrice,
            quantity: qty3,
            totalPrice: qty3 * item3.unitPrice,
          },
        ],
      },
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
