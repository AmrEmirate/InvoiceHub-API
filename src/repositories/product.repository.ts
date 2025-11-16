// File: src/repositories/product.repository.ts
import { PrismaClient, Product } from "../generated/prisma";
import { PaginatedResponse, PaginationParams } from "../types/pagination.types";
import { TCreateProductInput, TUpdateProductInput } from "../types/product.types";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

class ProductRepository {
  public async create(data: TCreateProductInput): Promise<Product> {
    // Pastikan harga adalah Decimal
    const priceAsDecimal = new Decimal(data.price);
    
    return await prisma.product.create({
      data: {
        ...data,
        price: priceAsDecimal,
      },
    });
  }

  /**
   * Mencari produk berdasarkan SKU & userId (yang belum di-soft-delete).
   * SKU harus unik per user.
   */
  public async findBySkuAndUser(
    sku: string,
    userId: string
  ): Promise<Product | null> {
    return await prisma.product.findFirst({
      where: { sku, userId, deletedAt: null },
    });
  }

  /**
   * Mencari semua produk milik seorang user (yang belum di-soft-delete).
   * Termasuk filter dan relasi kategori.
   */
/**
   * PERUBAHAN: Mencari semua produk dengan paginasi
   */
  public async findAllByUser(
    userId: string,
    filters: { search?: string; categoryId?: string },
    pagination: PaginationParams // <-- PARAMETER BARU
  ): Promise<PaginatedResponse<Product>> { // <-- TIPE KEMBALIAN BARU
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const whereCondition: any = { userId, deletedAt: null };

    if (filters.search) {
      whereCondition.name = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    if (filters.categoryId) {
      whereCondition.categoryId = filters.categoryId;
    }

    // 1. Ambil data halaman saat ini
    const data = await prisma.product.findMany({
      where: whereCondition,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    // 2. Ambil total data
    const total = await prisma.product.count({
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
   * Mencari satu produk berdasarkan ID dan pemiliknya (yang belum di-soft-delete).
   */
  public async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<Product | null> {
    return await prisma.product.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        category: true,
      },
    });
  }

  public async update(
    id: string,
    data: TUpdateProductInput
  ): Promise<Product> {
    
    // Konversi harga jika ada
    const updateData: any = { ...data };
    if (data.price) {
      updateData.price = new Decimal(data.price);
    }

    return await prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * IMPLEMENTASI SOFT DELETE
   */
  public async softDelete(id: string): Promise<Product> {
    return await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export default new ProductRepository();