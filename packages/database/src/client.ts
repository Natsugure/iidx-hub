import dotenv from 'dotenv'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

dotenv.config();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!
  })

  console.log("connectionString: " + process.env.DATABASE_URL)
  
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] 
      : ['error']
  })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
