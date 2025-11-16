import ClientRepository from "../repositories/client.repository";
import { TCreateClientInput, TUpdateClientInput } from "../types/client.types";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { PaginationParams, PaginatedResponse } from "../types/pagination.types";
import { Client } from "../generated/prisma";

// Tipe data input dari Controller
type TCreateInput = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  paymentPreferences?: string;
};

class ClientService {
  /**
   * Membuat client baru.
   * Memastikan email unik untuk user tersebut.
   */
  public async createClient(input: TCreateInput, userId: string) {
    const existingClient = await ClientRepository.findByEmailAndUser(
      input.email,
      userId
    );

    if (existingClient) {
      throw new AppError(409, "Client with this email already exists");
    }

    const clientData = { ...input, userId };
    const newClient = await ClientRepository.create(clientData);
    logger.info(`New client created (ID: ${newClient.id}) by user ${userId}`);

    return newClient;
  }

  /**
   * PERUBAHAN: Mengambil semua client milik user, dengan filter DAN paginasi.
   */
  public async getClients(
    userId: string,
    filters: { search?: string },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Client>> {
    // Meneruskan parameter paginasi ke repository
    return await ClientRepository.findAllByUser(userId, filters, pagination);
  }

  /**
   * Mengambil satu client.
   * Ini juga memvalidasi kepemilikan.
   */
  public async getClientById(id: string, userId: string) {
    const client = await ClientRepository.findByIdAndUser(id, userId);

    if (!client) {
      throw new AppError(404, "Client not found");
    }

    return client;
  }

  /**
   * Mengupdate client.
   * Memvalidasi kepemilikan sebelum update.
   */
  public async updateClient(
    id: string,
    data: TUpdateClientInput,
    userId: string
  ) {
    // 1. Validasi kepemilikan
    await this.getClientById(id, userId);

    // 2. (Opsional) Jika email diubah, cek duplikat lagi
    if (data.email) {
      const existing = await ClientRepository.findByEmailAndUser(
        data.email,
        userId
      );
      if (existing && existing.id !== id) {
        throw new AppError(409, "Email already used by another client");
      }
    }

    const updatedClient = await ClientRepository.update(id, data);
    logger.info(`Client updated (ID: ${id}) by user ${userId}`);

    return updatedClient;
  }

  /**
   * Menghapus client.
   */
  public async deleteClient(id: string, userId: string) {
    // 1. Validasi kepemilikan
    await this.getClientById(id, userId);

    // 2. Hapus
    await ClientRepository.delete(id);
    logger.info(`Client deleted (ID: ${id}) by user ${userId}`);

    return true; // Sukses
  }
}

export default new ClientService();