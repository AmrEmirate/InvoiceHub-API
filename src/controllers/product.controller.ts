// File: src/controllers/product.controller.ts
import { Request, Response, NextFunction } from "express";
import ProductService from "../service/product.service";
import { SafeUser } from "../types/express";

interface AuthRequest extends Request {
  user?: SafeUser;
}

class ProductController {
  public async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const newProduct = await ProductService.createProduct(req.body, userId);
      res.status(201).json({
        message: "Product created successfully",
        data: newProduct,
      });
    } catch (error) {
      next(error);
    }
  }

public async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      // Ambil filter dan paginasi dari query URL
      const { search, categoryId, page, limit } = req.query;

      const paginationParams = {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      };

      const filters = {
        search: search as string | undefined,
        categoryId: categoryId as string | undefined,
      };

      const productsResponse = await ProductService.getProducts(
        userId,
        filters,
        paginationParams
      );

      // Kembalikan data DAN meta paginasi
      res.status(200).json({
        message: "Products fetched successfully",
        data: productsResponse.data,
        meta: productsResponse.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const product = await ProductService.getProductById(id, userId);
      res.status(200).json({
        message: "Product fetched successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  public async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updatedProduct = await ProductService.updateProduct(
        id,
        req.body,
        userId
      );
      res.status(200).json({
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await ProductService.deleteProduct(id, userId);
      res.status(200).json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();