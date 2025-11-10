// File: src/controllers/category.controller.ts
import { Request, Response, NextFunction } from "express";
import CategoryService from "../service/category.service";
import { SafeUser } from "../types/express";

interface AuthRequest extends Request {
  user?: SafeUser;
}

class CategoryController {
  public async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name } = req.body;
      const newCategory = await CategoryService.createCategory(name, userId);
      res.status(201).json({
        message: "Category created successfully",
        data: newCategory,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const filters = req.query as { search?: string };
      const categories = await CategoryService.getCategories(userId, filters);
      res.status(200).json({
        message: "Categories fetched successfully",
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const category = await CategoryService.getCategoryById(id, userId);
      res.status(200).json({
        message: "Category fetched successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  public async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updatedCategory = await CategoryService.updateCategory(
        id,
        req.body,
        userId
      );
      res.status(200).json({
        message: "Category updated successfully",
        data: updatedCategory,
      });
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await CategoryService.deleteCategory(id, userId);
      res.status(200).json({
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();