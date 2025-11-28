"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_service_1 = __importDefault(require("../service/client.service"));
class ClientController {
    async create(req, res, next) {
        try {
            const userId = req.user.id;
            const newClient = await client_service_1.default.createClient(req.body, userId);
            res.status(201).json({
                message: "Client created successfully",
                data: newClient,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const userId = req.user.id;
            const { search, page, limit } = req.query;
            const paginationParams = {
                page: Number(page) || 1,
                limit: Number(limit) || 10,
            };
            const filters = {
                search: search,
            };
            const clientsResponse = await client_service_1.default.getClients(userId, filters, paginationParams);
            res.status(200).json({
                message: "Clients fetched successfully",
                data: clientsResponse.data,
                meta: clientsResponse.meta,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getOne(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const client = await client_service_1.default.getClientById(id, userId);
            res.status(200).json({
                message: "Client fetched successfully",
                data: client,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const updatedClient = await client_service_1.default.updateClient(id, req.body, userId);
            res.status(200).json({
                message: "Client updated successfully",
                data: updatedClient,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await client_service_1.default.deleteClient(id, userId);
            res.status(200).json({
                message: "Client deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new ClientController();
