import ProductRepository from "../repositories/product.repository";
import CategoryRepository from "../repositories/category.repository";
import { TUpdateProductInput } from "../types/product.types";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { Decimal } from "@prisma/client/runtime/library";
import { PaginatedResponse, PaginationParams } from "../types/pagination.types";
import { Product } from "../generated/prisma";

type TCreateInput = {
  name: string;
  description?: string;
  price: number | Decimal;
  sku: string;
  categoryId: string;
};

class ProductService {
  public async createProduct(input: TCreateInput, userId: string) {
    const category = await CategoryRepository.findByIdAndUser(
      input.categoryId,
      userId
    );
    if (!category) {
      throw new AppError(404, "Category not found or does not belong to user");
    }
    const existingSku = await ProductRepository.findBySkuAndUser(
      input.sku,
      userId
    );
    if (existingSku) {
      throw new AppError(409, "SKU already exists for this user");
    }
    const productData = { ...input, userId };
    const newProduct = await ProductRepository.create(productData);
    logger.info(
      `New product created (ID: ${newProduct.id}) by user ${userId}`
    );

    return newProduct;
  }

  public async getProducts(
    userId: string,
    filters: { search?: string; categoryId?: string },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Product>> {
    return await ProductRepository.findAllByUser(userId, filters, pagination);
  }

  public async getProductById(id: string, userId: string) {
    const product = await ProductRepository.findByIdAndUser(id, userId);
    if (!product) {
      throw new AppError(404, "Product not found");
    }
    return product;
  }

  public async updateProduct(
    id: string,
    data: TUpdateProductInput,
    userId: string
  ) {
    await this.getProductById(id, userId);
    if (data.categoryId) {
      const category = await CategoryRepository.findByIdAndUser(
        data.categoryId,
        userId
      );
      if (!category) {
        throw new AppError(404, "New category not found or does not belong to user");
      }
    }

    const updatedProduct = await ProductRepository.update(id, data);
    logger.info(`Product updated (ID: ${id}) by user ${userId}`);

    return updatedProduct;
  }

  public async deleteProduct(id: string, userId: string) {
    await this.getProductById(id, userId);
    await ProductRepository.softDelete(id);
    logger.info(`Product soft-deleted (ID: ${id}) by user ${userId}`);

    return true;
  }
}

export default new ProductService();