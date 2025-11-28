"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const library_1 = require("@prisma/client/runtime/library");
const prisma_2 = require("../config/prisma");
class InvoiceRepository {
    async create(data, userId, totalAmount) {
        const { items, ...invoiceData } = data;
        return await prisma_2.prisma.$transaction(async (tx) => {
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
                price: new library_1.Decimal(item.price),
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
    async findAllByUser(userId, filters, pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const whereCondition = { userId };
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
        const data = await prisma_2.prisma.invoice.findMany({
            where: whereCondition,
            include: {
                client: true,
            },
            orderBy: { createdAt: "desc" },
            skip: skip,
            take: limit,
        });
        const total = await prisma_2.prisma.invoice.count({
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
    async findByIdAndUser(id, userId) {
        return await prisma_2.prisma.invoice.findFirst({
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
    async findLastInvoiceByDate(userId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return await prisma_2.prisma.invoice.findFirst({
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
    async getDashboardStats(userId) {
        const now = new Date();
        const [totalInvoices, paidInvoices, pendingInvoices, overdueInvoices, totalRevenueResult,] = await prisma_2.prisma.$transaction([
            prisma_2.prisma.invoice.count({ where: { userId } }),
            prisma_2.prisma.invoice.count({
                where: { userId, status: prisma_1.InvoiceStatus.PAID },
            }),
            prisma_2.prisma.invoice.count({
                where: {
                    userId,
                    status: { in: [prisma_1.InvoiceStatus.SENT, prisma_1.InvoiceStatus.PENDING] },
                },
            }),
            prisma_2.prisma.invoice.count({
                where: {
                    userId,
                    status: prisma_1.InvoiceStatus.OVERDUE,
                    OR: [
                        { status: prisma_1.InvoiceStatus.OVERDUE },
                        {
                            status: { in: [prisma_1.InvoiceStatus.SENT, prisma_1.InvoiceStatus.PENDING] },
                            dueDate: { lt: now },
                        },
                    ],
                },
            }),
            prisma_2.prisma.invoice.aggregate({
                _sum: { totalAmount: true },
                where: { userId, status: prisma_1.InvoiceStatus.PAID },
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
    async updateStatus(id, data) {
        return await prisma_2.prisma.invoice.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return await prisma_2.prisma.invoice.delete({
            where: { id },
        });
    }
}
exports.default = new InvoiceRepository();
