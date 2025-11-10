// File: src/controllers/client.controller.ts
import { Request, Response, NextFunction } from "express";
import ClientService from "../service/client.service";
import { SafeUser } from "../types/express.d";

interface AuthRequest extends Request {
  user?: SafeUser;
}

class ClientController {
  public async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id; // `req.user` dijamin ada oleh authMiddleware
      const newClient = await ClientService.createClient(req.body, userId);
      res.status(201).json({
        message: "Client created successfully",
        data: newClient,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const filters = req.query as { search?: string }; // Ambil filter dari query URL
      const clients = await ClientService.getClients(userId, filters);
      res.status(200).json({
        message: "Clients fetched successfully",
        data: clients,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const client = await ClientService.getClientById(id, userId);
      res.status(200).json({
        message: "Client fetched successfully",
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  public async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updatedClient = await ClientService.updateClient(
        id,
        req.body,
        userId
      );
      res.status(200).json({
        message: "Client updated successfully",
        data: updatedClient,
      });
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await ClientService.deleteClient(id, userId);
      res.status(200).json({
        message: "Client deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClientController();