"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const library_1 = require("@prisma/client/runtime/library");
const prisma = new prisma_1.PrismaClient();
class ProductRepository {
    async create(data) {
        const priceAsDecimal = new library_1.Decimal(data.price);
        return await prisma.product.create({
            data: {
                ...data,
                price: priceAsDecimal,
            },
        });
    }
    async findBySkuAndUser(sku, userId) {
        return await prisma.product.findFirst({
            where: { sku, userId, deletedAt: null },
        });
    }
    async findAllByUser(userId, filters, pagination) {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;
        const whereCondition = {
            userId,
            deletedAt: null
        };
        if (filters.search) {
            whereCondition.OR = [
                {
                    name: {
                        contains: filters.search,
                        mode: "insensitive",
                    },
                },
                {
                    sku: {
                        contains: filters.search,
                        mode: "insensitive",
                    },
                },
            ];
        }
        if (filters.categoryId) {
            whereCondition.categoryId = filters.categoryId;
        }
        const data = await prisma.product.findMany({
            where: whereCondition,
            include: {
                category: true,
            },
            orderBy: { createdAt: "desc" },
            skip: skip,
            take: limit,
        });
        const total = await prisma.product.count({
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
        return await prisma.product.findFirst({
            where: { id, userId, deletedAt: null },
            include: {
                category: true,
            },
        });
    }
    async update(id, data) {
        const updateData = { ...data };
        if (data.price) {
            updateData.price = new library_1.Decimal(data.price);
        }
        return await prisma.product.update({
            where: { id },
            data: updateData,
        });
    }
    async softDelete(id) {
        return await prisma.product.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }
}
exports.default = new ProductRepository();
