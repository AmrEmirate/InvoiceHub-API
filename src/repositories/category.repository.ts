// File: src/repositories/category.repository.ts
import { PrismaClient, Category } from "../generated/prisma";
import {
  TCreateCategoryInput,
  TUpdateCategoryInput,
} from "../types/category.types";

const prisma = new PrismaClient();

class CategoryRepository {
  public async create(data: TCreateCategoryInput): Promise<Category> {
    return await prisma.category.create({ data });
  }

  /**
   * Mencari kategori berdasarkan nama DAN userId (yang belum di-soft-delete).
   */
  public async findByNameAndUser(
    name: string,
    userId: string
  ): Promise<Category | null> {
    return await prisma.category.findFirst({
      where: { name, userId, deletedAt: null }, // Hanya cari yang aktif
    });
  }

  /**
   * Mencari semua kategori milik seorang user (yang belum di-soft-delete).
   */
  public async findAllByUser(
    userId: string,
    filters: { search?: string }
  ): Promise<Category[]> {
    const whereCondition: any = { userId, deletedAt: null }; // Filter utama

    if (filters.search) {
      whereCondition.name = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    return await prisma.category.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Mencari satu kategori berdasarkan ID dan pemiliknya (yang belum di-soft-delete).
   */
  public async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<Category | null> {
    return await prisma.category.findFirst({
      where: { id, userId, deletedAt: null }, // Hanya cari yang aktif
    });
  }

  public async update(
    id: string,
    data: TUpdateCategoryInput
  ): Promise<Category> {
    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * IMPLEMENTASI SOFT DELETE
   * Kita meng-update kolom `deletedAt` dengan tanggal saat ini.
   */
  public async softDelete(id: string): Promise<Category> {
    return await prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export default new CategoryRepository();