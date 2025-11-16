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

 /**
   * PERUBAHAN: Membaca query paginasi
   */
  public async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      
      // Ambil filter dan paginasi dari query URL
      const { search, page, limit } = req.query;

      const paginationParams = {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      };
      
      const filters = {
        search: search as string | undefined
      };

      const categoriesResponse = await CategoryService.getCategories(
        userId,
        filters,
        paginationParams
      );

      // Kembalikan data DAN meta paginasi
      res.status(200).json({
        message: "Categories fetched successfully",
        data: categoriesResponse.data,
        meta: categoriesResponse.meta,
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