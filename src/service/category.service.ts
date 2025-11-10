// File: src/service/category.service.ts
import CategoryRepository from "../repositories/category.repository";
import { TUpdateCategoryInput } from "../types/category.types";
import AppError from "../utils/AppError";
import logger from "../utils/logger";

class CategoryService {
  /**
   * Membuat kategori baru.
   */
  public async createCategory(name: string, userId: string) {
    const existing = await CategoryRepository.findByNameAndUser(name, userId);

    if (existing) {
      throw new AppError(409, "Category with this name already exists");
    }

    const newCategory = await CategoryRepository.create({ name, userId });
    logger.info(
      `New category created (ID: ${newCategory.id}) by user ${userId}`
    );

    return newCategory;
  }

  /**
   * Mengambil semua kategori milik user, dengan filter.
   */
  public async getCategories(userId: string, filters: { search?: string }) {
    return await CategoryRepository.findAllByUser(userId, filters);
  }

  /**
   * Mengambil satu kategori. (Juga memvalidasi kepemilikan)
   */
  public async getCategoryById(id: string, userId: string) {
    const category = await CategoryRepository.findByIdAndUser(id, userId);

    if (!category) {
      throw new AppError(404, "Category not found");
    }

    return category;
  }

  /**
   * Mengupdate kategori.
   */
  public async updateCategory(
    id: string,
    data: TUpdateCategoryInput,
    userId: string
  ) {
    // 1. Validasi kepemilikan
    await this.getCategoryById(id, userId);

    // 2. Jika nama diubah, cek duplikat
    if (data.name) {
      const existing = await CategoryRepository.findByNameAndUser(
        data.name,
        userId
      );
      if (existing && existing.id !== id) {
        throw new AppError(409, "Name already used by another category");
      }
    }

    const updatedCategory = await CategoryRepository.update(id, data);
    logger.info(`Category updated (ID: ${id}) by user ${userId}`);

    return updatedCategory;
  }

  /**
   * Menghapus kategori (Soft Delete).
   */
  public async deleteCategory(id: string, userId: string) {
    // 1. Validasi kepemilikan
    await this.getCategoryById(id, userId);

    // 2. Lakukan Soft Delete
    await CategoryRepository.softDelete(id);
    logger.info(`Category soft-deleted (ID: ${id}) by user ${userId}`);

    return true; // Sukses
  }
}

export default new CategoryService();