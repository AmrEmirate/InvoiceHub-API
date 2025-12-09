import { PrismaClient, Product } from "../generated/prisma";
import { PaginatedResponse, PaginationParams } from "../types/pagination.types";
import {
  TCreateProductInput,
  TUpdateProductInput,
} from "../types/product.types";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

class ProductRepository {
  public async create(data: TCreateProductInput): Promise<Product> {
    const priceAsDecimal = new Decimal(data.price);

    return await prisma.product.create({
      data: {
        ...data,
        price: priceAsDecimal,
      },
    });
  }

  public async findBySkuAndUser(
    sku: string,
    userId: string
  ): Promise<Product | null> {
    return await prisma.product.findFirst({
      where: { sku, userId, deletedAt: null },
    });
  }

  public async findAllByUser(
    userId: string,
    filters: { search?: string; categoryId?: string },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Product>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      userId,
      deletedAt: null,
    };

    if (filters.search) {
      whereCondition.OR = [
        {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          sku: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (filters.categoryId) {
      whereCondition.categoryId = filters.categoryId;
    }

    const data = await prisma.product.findMany({
      where: whereCondition,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    const total = await prisma.product.count({
      where: whereCondition,
    });

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

  public async update(id: string, data: TUpdateProductInput): Promise<Product> {
    const updateData: any = { ...data };
    if (data.price) {
      updateData.price = new Decimal(data.price);
    }

    return await prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  public async softDelete(id: string): Promise<Product> {
    // Append unique suffix to SKU to free up the SKU for reuse
    const deletedSuffix = `_deleted_${Date.now()}`;
    const product = await prisma.product.findUnique({ where: { id } });

    return await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        sku: product ? `${product.sku}${deletedSuffix}` : `deleted_${id}`,
      },
    });
  }
}

export default new ProductRepository();
