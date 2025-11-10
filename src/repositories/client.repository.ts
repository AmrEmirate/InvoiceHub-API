// File: src/repositories/client.repository.ts
import { PrismaClient, Client } from "../generated/prisma"; // Ambil Client dari @prisma/client
import { TCreateClientInput, TUpdateClientInput } from "../types/client.types";

// Kamu sudah punya prisma client, gunakan itu
const prisma = new PrismaClient();

class ClientRepository {
  public async create(data: TCreateClientInput): Promise<Client> {
    return await prisma.client.create({ data });
  }

  /**
   * Mencari client berdasarkan email DAN userId.
   * Ini penting agar email unik per user, bukan per global.
   */
  public async findByEmailAndUser(
    email: string,
    userId: string
  ): Promise<Client | null> {
    return await prisma.client.findFirst({
      where: { email, userId },
    });
  }

  /**
   * Mencari semua client milik seorang user.
   * Menerima filter untuk pencarian.
   */
  public async findAllByUser(
    userId: string,
    filters: { search?: string }
  ): Promise<Client[]> {
    const whereCondition: any = { userId };

    if (filters.search) {
      whereCondition.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return await prisma.client.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Mencari satu client berdasarkan ID dan pemiliknya (userId).
   * Ini adalah kunci keamanan kita.
   */
  public async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<Client | null> {
    return await prisma.client.findFirst({
      where: { id, userId },
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