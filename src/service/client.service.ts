import ClientRepository from "../repositories/client.repository";
import { TCreateClientInput, TUpdateClientInput } from "../types/client.types";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { PaginationParams, PaginatedResponse } from "../types/pagination.types";
import { Client } from "../generated/prisma";

type TCreateInput = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  paymentPreferences?: string;
};

class ClientService {
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

  public async getClients(
    userId: string,
    filters: { search?: string },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Client>> {
    return await ClientRepository.findAllByUser(userId, filters, pagination);
  }

  public async getClientById(id: string, userId: string) {
    const client = await ClientRepository.findByIdAndUser(id, userId);

    if (!client) {
      throw new AppError(404, "Client not found");
    }

    return client;
  }

  public async updateClient(
    id: string,
    data: TUpdateClientInput,
    userId: string
  ) {
    await this.getClientById(id, userId);

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

  public async deleteClient(id: string, userId: string) {
    await this.getClientById(id, userId);

    await ClientRepository.delete(id);
    logger.info(`Client deleted (ID: ${id}) by user ${userId}`);

    return true;
  }
}

export default new ClientService();