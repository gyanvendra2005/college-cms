import { prisma } from '../config/prisma';

export const generateChallanNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `CH-${year}${month}-`;

  // Find the highest sequence number for current month
  const latestChallan = await prisma.salesChallan.findFirst({
    where: {
      challanNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      challanNumber: 'desc',
    },
    select: {
      challanNumber: true,
    },
  });

  if (!latestChallan) {
    return `${prefix}0001`;
  }

  const parts = latestChallan.challanNumber.split('-');
  const sequenceStr = parts[parts.length - 1];
  const nextSeq = parseInt(sequenceStr, 10) + 1;

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
};
