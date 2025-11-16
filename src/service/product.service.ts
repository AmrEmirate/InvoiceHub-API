// File: src/service/product.service.ts
import ProductRepository from "../repositories/product.repository";
import CategoryRepository from "../repositories/category.repository"; // Import repo Kategori
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
  /**
   * Membuat produk baru.
   * Validasi: SKU unik & Kategori milik user.
   */
  public async createProduct(input: TCreateInput, userId: string) {
    // 1. Validasi kepemilikan Kategori
    const category = await CategoryRepository.findByIdAndUser(
      input.categoryId,
      userId
    );
    if (!category) {
      throw new AppError(404, "Category not found or does not belong to user");
    }

    // 2. Validasi keunikan SKU
    const existingSku = await ProductRepository.findBySkuAndUser(
      input.sku,
      userId
    );
    if (existingSku) {
      throw new AppError(409, "SKU already exists for this user");
    }

    // 3. Buat produk
    const productData = { ...input, userId };
    const newProduct = await ProductRepository.create(productData);
    logger.info(
      `New product created (ID: ${newProduct.id}) by user ${userId}`
    );

    return newProduct;
  }

  /**
   * Mengambil semua produk milik user, dengan filter.
   */
/**
   * PERUBAHAN: Mengambil produk dengan paginasi
   */
  public async getProducts(
    userId: string,
    filters: { search?: string; categoryId?: string },
    pagination: PaginationParams // <-- PARAMETER BARU
  ): Promise<PaginatedResponse<Product>> { // <-- TIPE KEMBALIAN BARU
    return await ProductRepository.findAllByUser(userId, filters, pagination);
  }

  /**
   * Mengambil satu produk. (Juga memvalidasi kepemilikan)
   */
  public async getProductById(id: string, userId: string) {
    const product = await ProductRepository.findByIdAndUser(id, userId);
    if (!product) {
      throw new AppError(404, "Product not found");
    }
    return product;
  }

  /**
   * Mengupdate produk.
   */
  public async updateProduct(
    id: string,
    data: TUpdateProductInput,
    userId: string
  ) {
    // 1. Validasi kepemilikan Produk
    await this.getProductById(id, userId);

    // 2. Jika kategori diubah, validasi kepemilikan Kategori BARU
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

  /**
   * Menghapus produk (Soft Delete).
   */
  public async deleteProduct(id: string, userId: string) {
    // 1. Validasi kepemilikan
    await this.getProductById(id, userId);

    // 2. Lakukan Soft Delete
    await ProductRepository.softDelete(id);
    logger.info(`Product soft-deleted (ID: ${id}) by user ${userId}`);

    return true; // Sukses
  }
}

export default new ProductService();