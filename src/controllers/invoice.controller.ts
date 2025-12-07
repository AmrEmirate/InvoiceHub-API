import { Request, Response, NextFunction } from "express";
import InvoiceService from "../service/invoice.service";
import { SafeUser } from "../types/express";
import { InvoiceStatus } from "../generated/prisma";

interface AuthRequest extends Request {
  user?: SafeUser;
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

      res.status(200).json({
        message: "Invoices fetched successfully",
        data: invoicesResponse,
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

  public async updateStatus(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { status } = req.body;

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
      const { id } = req.params;

      await InvoiceService.sendInvoiceEmail(id, userId);

      res.status(200).json({
        message: "Invoice sent successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  public getDashboardStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const stats = await InvoiceService.getDashboardStats(req.user!.id);
      res.status(200).json({
        message: "Dashboard stats fetched successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  public getChartStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { year } = req.query;
      const data = await InvoiceService.getChartData(
        req.user!.id,
        year ? Number(year) : undefined
      );
      res.status(200).json({
        message: "Chart data fetched successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new InvoiceController();
