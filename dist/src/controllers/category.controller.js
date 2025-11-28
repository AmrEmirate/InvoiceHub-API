"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const category_service_1 = __importDefault(require("../service/category.service"));
class CategoryController {
    async create(req, res, next) {
        try {
            const userId = req.user.id;
            const { name } = req.body;
            const newCategory = await category_service_1.default.createCategory(name, userId);
            res.status(201).json({
                message: "Category created successfully",
                data: newCategory,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const userId = req.user.id;
            const { search, page, limit } = req.query;
            const paginationParams = {
                page: Number(page) || 1,
                limit: Number(limit) || 10,
            };
            const filters = {
                search: search
            };
            const categoriesResponse = await category_service_1.default.getCategories(userId, filters, paginationParams);
            res.status(200).json({
                message: "Categories fetched successfully",
                data: categoriesResponse.data,
                meta: categoriesResponse.meta,
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
            const category = await category_service_1.default.getCategoryById(id, userId);
            res.status(200).json({
                message: "Category fetched successfully",
                data: category,
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
            const updatedCategory = await category_service_1.default.updateCategory(id, req.body, userId);
            res.status(200).json({
                message: "Category updated successfully",
                data: updatedCategory,
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
            await category_service_1.default.deleteCategory(id, userId);
            res.status(200).json({
                message: "Category deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new CategoryController();
