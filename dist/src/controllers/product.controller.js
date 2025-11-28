"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const product_service_1 = __importDefault(require("../service/product.service"));
class ProductController {
    async create(req, res, next) {
        try {
            const userId = req.user.id;
            const newProduct = await product_service_1.default.createProduct(req.body, userId);
            res.status(201).json({
                message: "Product created successfully",
                data: newProduct,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const userId = req.user.id;
            const { search, categoryId, page, limit } = req.query;
            const paginationParams = {
                page: Number(page) || 1,
                limit: Number(limit) || 10,
            };
            const filters = {
                search: search,
                categoryId: categoryId,
            };
            const productsResponse = await product_service_1.default.getProducts(userId, filters, paginationParams);
            res.status(200).json({
                message: "Products fetched successfully",
                data: productsResponse.data,
                meta: productsResponse.meta,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getOne(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const product = await product_service_1.default.getProductById(id, userId);
            res.status(200).json({
                message: "Product fetched successfully",
                data: product,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const updatedProduct = await product_service_1.default.updateProduct(id, req.body, userId);
            res.status(200).json({
                message: "Product updated successfully",
                data: updatedProduct,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await product_service_1.default.deleteProduct(id, userId);
            res.status(200).json({
                message: "Product deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new ProductController();
