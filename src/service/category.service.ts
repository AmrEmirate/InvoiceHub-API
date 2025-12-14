import { Category } from "@prisma/client";
import CategoryRepository from "../repositories/category.repository";
import { TUpdateCategoryInput } from "../types/category.types";
import { PaginatedResponse, PaginationParams } from "../types/pagination.types";
import AppError from "../utils/AppError";
import logger from "../utils/logger";

class CategoryService {
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

  public async getCategories(
    userId: string,
    filters: { search?: string },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Category>> {
    return await CategoryRepository.findAllByUser(userId, filters, pagination);
  }

  public async getCategoryById(id: string, userId: string) {
    const category = await CategoryRepository.findByIdAndUser(id, userId);

    if (!category) {
      throw new AppError(404, "Category not found");
    }

    return category;
  }

  public async updateCategory(
    id: string,
    data: TUpdateCategoryInput,
    userId: string
  ) {
    await this.getCategoryById(id, userId);

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

  public async deleteCategory(id: string, userId: string) {
    await this.getCategoryById(id, userId);

    await CategoryRepository.softDelete(id);
    logger.info(`Category soft-deleted (ID: ${id}) by user ${userId}`);

    return true;
  }
}

export default new CategoryService();
