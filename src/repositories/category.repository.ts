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

  public async findByNameAndUser(
    name: string,
    userId: string
  ): Promise<Category | null> {
    return await prisma.category.findFirst({
      where: { name, userId, deletedAt: null },
    });
  }

  public async findAllByUser(
    userId: string,
    filters: { search?: string },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Category>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const whereCondition: any = { userId, deletedAt: null };

    if (filters.search) {
      whereCondition.name = {
        contains: filters.search,
        mode: "insensitive",
      };
    }

    const data = await prisma.category.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    const total = await prisma.category.count({
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
  ): Promise<Category | null> {
    return await prisma.category.findFirst({
      where: { id, userId, deletedAt: null },
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