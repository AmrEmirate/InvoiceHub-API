// File: src/repositories/category.repository.ts
import { PrismaClient, Category } from "../generated/prisma";
import {
  TCreateCategoryInput,
  TUpdateCategoryInput,
} from "../types/category.types";
import { PaginatedResponse, PaginationParams } from "../types/pagination.types";

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
   * PERUBAHAN: Mencari semua kategori dengan paginasi
   */
  public async findAllByUser(
    userId: string,
    filters: { search?: string },
    pagination: PaginationParams // <-- PARAMETER BARU
  ): Promise<PaginatedResponse<Category>> { // <-- TIPE KEMBALIAN BARU
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const whereCondition: any = { userId, deletedAt: null };

    if (filters.search) {
      whereCondition.name = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    // 1. Ambil data halaman saat ini
    const data = await prisma.category.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    // 2. Ambil total data
    const total = await prisma.category.count({
      where: whereCondition,
    });

    // 3. Kembalikan data + meta paginasi
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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