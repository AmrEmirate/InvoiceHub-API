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

  /**
   * PERUBAHAN: Sekarang menangani paginasi
   */
  public async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      // Ambil filter dan paginasi dari query URL
      const { search, page, limit } = req.query;

      // Set default untuk paginasi jika tidak disediakan
      const paginationParams = {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      };

      const filters = {
        search: search as string | undefined,
      };

      // Panggil service dengan parameter baru
      const clientsResponse = await ClientService.getClients(
        userId,
        filters,
        paginationParams
      );

      // Kembalikan data DAN meta paginasi
      res.status(200).json({
        message: "Clients fetched successfully",
        data: clientsResponse.data,
        meta: clientsResponse.meta,
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