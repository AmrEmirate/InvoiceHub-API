"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_repository_1 = __importDefault(require("../repositories/client.repository"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
class ClientService {
    async createClient(input, userId) {
        const existingClient = await client_repository_1.default.findByEmailAndUser(input.email, userId);
        if (existingClient) {
            throw new AppError_1.default(409, "Client with this email already exists");
        }
        const clientData = { ...input, userId };
        const newClient = await client_repository_1.default.create(clientData);
        logger_1.default.info(`New client created (ID: ${newClient.id}) by user ${userId}`);
        return newClient;
    }
    async getClients(userId, filters, pagination) {
        return await client_repository_1.default.findAllByUser(userId, filters, pagination);
    }
    async getClientById(id, userId) {
        const client = await client_repository_1.default.findByIdAndUser(id, userId);
        if (!client) {
            throw new AppError_1.default(404, "Client not found");
        }
        return client;
    }
    async updateClient(id, data, userId) {
        await this.getClientById(id, userId);
        if (data.email) {
            const existing = await client_repository_1.default.findByEmailAndUser(data.email, userId);
            if (existing && existing.id !== id) {
                throw new AppError_1.default(409, "Email already used by another client");
            }
        }
        const updatedClient = await client_repository_1.default.update(id, data);
        logger_1.default.info(`Client updated (ID: ${id}) by user ${userId}`);
        return updatedClient;
    }
    async deleteClient(id, userId) {
        await this.getClientById(id, userId);
        await client_repository_1.default.delete(id);
        logger_1.default.info(`Client deleted (ID: ${id}) by user ${userId}`);
        return true;
    }
}
exports.default = new ClientService();
