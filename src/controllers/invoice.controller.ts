// File: src/controllers/invoice.controller.ts
import { Request, Response, NextFunction } from "express";
import InvoiceService from "../service/invoice.service";// Menggunakan @prisma/client untuk InvoiceStatus
import { SafeUser } from "../types/express"; // Import SafeUser dari types/express
import { InvoiceStatus } from "../generated/prisma";
interface AuthRequest extends Request {
  user?: SafeUser; // Menggunakan SafeUser yang sudah didefinisikan
}

class InvoiceController {
  public async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const newInvoice = await InvoiceService.createInvoice(req.body, userId);
      res.status(201).json({
        message: "Invoice created successfully",
        data: newInvoice,
      });
    } catch (error) {
      next(error);
    }
  }

public async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      // Ambil filter dan paginasi dari query URL
      const { search, status, clientId, page, limit } = req.query;

      const paginationParams = {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      };

      const filters = {
        search: search as string | undefined,
        status: status as InvoiceStatus | undefined,
        clientId: clientId as string | undefined,
      };

      const invoicesResponse = await InvoiceService.getInvoices(
        userId,
        filters,
        paginationParams
      );

      // Kembalikan data DAN meta paginasi
      res.status(200).json({
        message: "Invoices fetched successfully",
        data: invoicesResponse.data,
        meta: invoicesResponse.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const invoice = await InvoiceService.getInvoiceById(id, userId);
      res.status(200).json({
        message: "Invoice fetched successfully",
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { status } = req.body; // Hanya ambil status
      
      const updatedInvoice = await InvoiceService.updateInvoiceStatus(
        id,
        status,
        userId
      );
      res.status(200).json({
        message: "Invoice status updated successfully",
        data: updatedInvoice,
      });
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await InvoiceService.deleteInvoice(id, userId);
      res.status(200).json({
        message: "Invoice deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  public async sendEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id } = req.params; // ID Invoice

      await InvoiceService.sendInvoiceEmail(id, userId);

      res.status(200).json({
        message: "Invoice sent successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

// Pastikan baris ini ada di paling bawah
export default new InvoiceController();