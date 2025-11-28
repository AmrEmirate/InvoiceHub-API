"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const product_repository_1 = __importDefault(require("../repositories/product.repository"));
const category_repository_1 = __importDefault(require("../repositories/category.repository"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
class ProductService {
    async createProduct(input, userId) {
        const category = await category_repository_1.default.findByIdAndUser(input.categoryId, userId);
        if (!category) {
            throw new AppError_1.default(404, "Category not found or does not belong to user");
        }
        const existingSku = await product_repository_1.default.findBySkuAndUser(input.sku, userId);
        if (existingSku) {
            throw new AppError_1.default(409, "SKU already exists for this user");
        }
        const productData = { ...input, userId };
        const newProduct = await product_repository_1.default.create(productData);
        logger_1.default.info(`New product created (ID: ${newProduct.id}) by user ${userId}`);
        return newProduct;
    }
    async getProducts(userId, filters, pagination) {
        return await product_repository_1.default.findAllByUser(userId, filters, pagination);
    }
    async getProductById(id, userId) {
        const product = await product_repository_1.default.findByIdAndUser(id, userId);
        if (!product) {
            throw new AppError_1.default(404, "Product not found");
        }
        return product;
    }
    async updateProduct(id, data, userId) {
        await this.getProductById(id, userId);
        if (data.categoryId) {
            const category = await category_repository_1.default.findByIdAndUser(data.categoryId, userId);
            if (!category) {
                throw new AppError_1.default(404, "New category not found or does not belong to user");
            }
        }
        const updatedProduct = await product_repository_1.default.update(id, data);
        logger_1.default.info(`Product updated (ID: ${id}) by user ${userId}`);
        return updatedProduct;
    }
    async deleteProduct(id, userId) {
        await this.getProductById(id, userId);
        await product_repository_1.default.softDelete(id);
        logger_1.default.info(`Product soft-deleted (ID: ${id}) by user ${userId}`);
        return true;
    }
}
exports.default = new ProductService();
