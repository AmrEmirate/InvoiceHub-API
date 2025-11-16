import { PrismaClient, Client } from "../generated/prisma"; // Menggunakan @prisma/client
import { TCreateClientInput, TUpdateClientInput } from "../types/client.types";
import { PaginationParams, PaginatedResponse } from "../types/pagination.types"; // Import tipe paginasi

const prisma = new PrismaClient();

class ClientRepository {
  public async create(data: TCreateClientInput): Promise<Client> {
    return await prisma.client.create({ data });
  }

  public async findByEmailAndUser(
    email: string,
    userId: string
  ): Promise<Client | null> {
    return await prisma.client.findFirst({
      where: { email, userId },
    });
  }

  /**
   * PERUBAHAN: Mencari semua client dengan paginasi
   */
  public async findAllByUser(
    userId: string,
    filters: { search?: string },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Client>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit; // Hitung data yang akan di-skip

    const whereCondition: any = { userId };

    if (filters.search) {
      whereCondition.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // 1. Ambil data untuk halaman saat ini (menggunakan skip dan take)
    const data = await prisma.client.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    // 2. Ambil total jumlah data (untuk menghitung total halaman)
    const total = await prisma.client.count({
      where: whereCondition,
    });

    // 3. Kembalikan data dan meta paginasi
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
   * PERUBAHAN: findByIdAndUser sekarang mengambil 5 invoice terbaru
   */
  public async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<Client | null> {
    return await prisma.client.findFirst({
      where: { id, userId },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5, // Mengambil 5 invoice terkait
        },
      },
    });
  }

  public async update(id: string, data: TUpdateClientInput): Promise<Client> {
    return await prisma.client.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<Client> {
    return await prisma.client.delete({
      where: { id },
    });
  }
}

export default new ClientRepository();