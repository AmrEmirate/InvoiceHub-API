"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
class ClientRepository {
    async create(data) {
        return await prisma.client.create({ data });
    }
    async findByEmailAndUser(email, userId) {
        return await prisma.client.findFirst({
            where: { email, userId },
        });
    }
    async findAllByUser(userId, filters, pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const whereCondition = { userId };
        if (filters.search) {
            whereCondition.OR = [
                { name: { contains: filters.search, mode: "insensitive" } },
                { email: { contains: filters.search, mode: "insensitive" } },
                { phone: { contains: filters.search, mode: "insensitive" } },
                { address: { contains: filters.search, mode: "insensitive" } },
            ];
        }
        const clients = await prisma.client.findMany({
            where: whereCondition,
            include: {
                _count: {
                    select: { invoices: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: skip,
            take: limit,
        });
        const data = clients.map((client) => ({
            ...client,
            _count: {
                invoices: client._count?.invoices || 0,
            },
        }));
        const total = await prisma.client.count({
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
        const client = await prisma.client.findFirst({
            where: { id, userId },
            include: {
                _count: {
                    select: { invoices: true },
                },
                invoices: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
            },
        });
        if (!client)
            return null;
        return {
            ...client,
            _count: {
                invoices: client._count?.invoices || 0,
            },
        };
    }
    async update(id, data) {
        return await prisma.client.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return await prisma.client.delete({
            where: { id },
        });
    }
}
exports.default = new ClientRepository();
