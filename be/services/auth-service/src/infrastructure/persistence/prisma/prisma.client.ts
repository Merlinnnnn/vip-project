import { PrismaClient } from '@prisma/client';

// Shared Prisma instance for the service
export const prisma = new PrismaClient();
