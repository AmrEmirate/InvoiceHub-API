"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invoice_service_1 = __importDefault(require("../service/invoice.service"));
class InvoiceController {
    constructor() {
        this.getDashboardStats = async (req, res, next) => {
            try {
                const stats = await invoice_service_1.default.getDashboardStats(req.user.id);
                res.status(200).json({
                    message: "Dashboard stats fetched successfully",
                    data: stats,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getChartStats = async (req, res, next) => {
            try {
                const data = await invoice_service_1.default.getChartData(req.user.id);
                res.status(200).json({
                    message: "Chart data fetched successfully",
                    data,
                });
            }
            catch (error) {
                next(error);
            }
        };
    }
    async create(req, res, next) {
        try {
            const userId = req.user.id;
            const newInvoice = await invoice_service_1.default.createInvoice(req.body, userId);
            res.status(201).json({
                message: "Invoice created successfully",
                data: newInvoice,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAll(req, res, next) {
        try {
            const userId = req.user.id;
            const { search, status, clientId, page, limit } = req.query;
            const paginationParams = {
                page: Number(page) || 1,
                limit: Number(limit) || 10,
            };
            const filters = {
                search: search,
                status: status,
                clientId: clientId,
            };
            const invoicesResponse = await invoice_service_1.default.getInvoices(userId, filters, paginationParams);
            res.status(200).json({
                message: "Invoices fetched successfully",
                data: invoicesResponse,
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
            const invoice = await invoice_service_1.default.getInvoiceById(id, userId);
            res.status(200).json({
                message: "Invoice fetched successfully",
                data: invoice,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { status } = req.body;
            const updatedInvoice = await invoice_service_1.default.updateInvoiceStatus(id, status, userId);
            res.status(200).json({
                message: "Invoice status updated successfully",
                data: updatedInvoice,
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
            await invoice_service_1.default.deleteInvoice(id, userId);
            res.status(200).json({
                message: "Invoice deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async sendEmail(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await invoice_service_1.default.sendInvoiceEmail(id, userId);
            res.status(200).json({
                message: "Invoice sent successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new InvoiceController();
