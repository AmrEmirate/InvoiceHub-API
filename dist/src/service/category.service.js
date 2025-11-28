"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const category_repository_1 = __importDefault(require("../repositories/category.repository"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
class CategoryService {
    async createCategory(name, userId) {
        const existing = await category_repository_1.default.findByNameAndUser(name, userId);
        if (existing) {
            throw new AppError_1.default(409, "Category with this name already exists");
        }
        const newCategory = await category_repository_1.default.create({ name, userId });
        logger_1.default.info(`New category created (ID: ${newCategory.id}) by user ${userId}`);
        return newCategory;
    }
    async getCategories(userId, filters, pagination) {
        return await category_repository_1.default.findAllByUser(userId, filters, pagination);
    }
    async getCategoryById(id, userId) {
        const category = await category_repository_1.default.findByIdAndUser(id, userId);
        if (!category) {
            throw new AppError_1.default(404, "Category not found");
        }
        return category;
    }
    async updateCategory(id, data, userId) {
        await this.getCategoryById(id, userId);
        if (data.name) {
            const existing = await category_repository_1.default.findByNameAndUser(data.name, userId);
            if (existing && existing.id !== id) {
                throw new AppError_1.default(409, "Name already used by another category");
            }
        }
        const updatedCategory = await category_repository_1.default.update(id, data);
        logger_1.default.info(`Category updated (ID: ${id}) by user ${userId}`);
        return updatedCategory;
    }
    async deleteCategory(id, userId) {
        await this.getCategoryById(id, userId);
        await category_repository_1.default.softDelete(id);
        logger_1.default.info(`Category soft-deleted (ID: ${id}) by user ${userId}`);
        return true;
    }
}
exports.default = new CategoryService();
