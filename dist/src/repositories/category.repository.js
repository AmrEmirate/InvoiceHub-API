"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
class CategoryRepository {
    async create(data) {
        return await prisma.category.create({ data });
    }
    async findByNameAndUser(name, userId) {
        return await prisma.category.findFirst({
            where: { name, userId, deletedAt: null },
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
            whereCondition.name = {
                contains: filters.search,
                mode: "insensitive",
            };
        }
        const data = await prisma.category.findMany({
            where: whereCondition,
            orderBy: { createdAt: "desc" },
            skip: skip,
            take: limit,
        });
        const total = await prisma.category.count({
            where: whereCondition,
        });
        const logger = require("../utils/logger").default;
        logger.info(`[CategoryRepository] findAllByUser: userId=${userId}, filters=${JSON.stringify(filters)}, whereCondition=${JSON.stringify(whereCondition)}`);
        logger.info(`[CategoryRepository] Found ${data.length} categories. IDs: ${data.map(c => c.id).join(", ")}`);
        data.forEach(c => {
            if (c.deletedAt) {
                logger.info(`[CategoryRepository] WARNING: Found deleted category! ID=${c.id}, Name=${c.name}, deletedAt=${c.deletedAt}`);
            }
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
        return await prisma.category.findFirst({
            where: { id, userId, deletedAt: null },
        });
    }
    async update(id, data) {
        return await prisma.category.update({
            where: { id },
            data,
        });
    }
    async softDelete(id) {
        return await prisma.category.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }
}
exports.default = new CategoryRepository();
