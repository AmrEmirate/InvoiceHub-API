import { PrismaClient, Invoice, InvoiceStatus } from "../generated/prisma";
import { TCreateInvoiceInput } from "../types/invoice.types";
import { Decimal } from "@prisma/client/runtime/library";
import { PaginatedResponse, PaginationParams } from "../types/pagination.types";
import { prisma } from "../config/prisma";

class InvoiceRepository {
  public async create(
    data: TCreateInvoiceInput & { invoiceNumber: string },
    userId: string,
    totalAmount: Decimal
  ): Promise<Invoice> {
    const { items, ...invoiceData } = data;

    return await prisma.$transaction(async (tx) => {
      const newInvoice = await tx.invoice.create({
        data: {
          ...invoiceData,
          dueDate: new Date(invoiceData.dueDate),
          totalAmount: totalAmount,
          userId: userId,
        },
      });

      const itemsData = items.map((item) => ({
        ...item,
        price: new Decimal(item.price),
        invoiceId: newInvoice.id,
        productId: item.productId || null,
      }));

      await tx.invoiceItem.createMany({
        data: itemsData,
      });

      const createdInvoiceWithItems = await tx.invoice.findUniqueOrThrow({
        where: { id: newInvoice.id },
        include: {
          items: true,
          client: true,
          user: true,
        },
      });

      return createdInvoiceWithItems;
    });
  }

  public async findAllByUser(
    userId: string,
    filters: {
      search?: string;
      status?: InvoiceStatus;
      clientId?: string;
    },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Invoice>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const whereCondition: any = { userId };

    if (filters.search) {
      whereCondition.invoiceNumber = {
        contains: filters.search,
        mode: "insensitive",
      };
    }
    if (filters.status) {
      whereCondition.status = filters.status;
    }
    if (filters.clientId) {
      whereCondition.clientId = filters.clientId;
    }

    const data = await prisma.invoice.findMany({
      where: whereCondition,
      include: {
        client: true,
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    const total = await prisma.invoice.count({
      where: whereCondition,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<(Invoice & { user: any; client: any; items: any[] }) | null> {
    return await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        user: true,
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  public async findLastInvoiceByDate(
    userId: string,
    date: Date
  ): Promise<Invoice | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.invoice.findFirst({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  public async getDashboardStats(userId: string) {
    const now = new Date();

    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenueResult,
    ] = await prisma.$transaction([
      prisma.invoice.count({ where: { userId } }),

      prisma.invoice.count({
        where: { userId, status: InvoiceStatus.PAID },
      }),

      prisma.invoice.count({
        where: {
          userId,
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.PENDING] },
        },
      }),

      prisma.invoice.count({
        where: {
          userId,
          status: InvoiceStatus.OVERDUE,
          OR: [
            { status: InvoiceStatus.OVERDUE },
            {
              status: { in: [InvoiceStatus.SENT, InvoiceStatus.PENDING] },
              dueDate: { lt: now },
            },
          ],
        },
      }),

      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { userId, status: InvoiceStatus.PAID },
      }),
    ]);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue: totalRevenueResult._sum.totalAmount || 0,
    };
  }

  public async updateStatus(
    id: string,
    data: { status?: InvoiceStatus; emailSentAt?: Date }
  ): Promise<Invoice> {
    return await prisma.invoice.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<Invoice> {
    return await prisma.invoice.delete({
      where: { id },
    });
  }

  public async markOverdueInvoices(): Promise<number> {
    const now = new Date();

    const result = await prisma.invoice.updateMany({
      where: {
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.PENDING],
        },
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: InvoiceStatus.OVERDUE,
      },
    });

    return result.count;
  }
}

export default new InvoiceRepository();
