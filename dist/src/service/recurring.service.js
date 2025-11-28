"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const invoice_repository_1 = __importDefault(require("../repositories/invoice.repository"));
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new prisma_1.PrismaClient();
class RecurringService {
    async generateRecurringInvoices() {
        logger_1.default.info("[Cron] Running recurring invoice check...");
        const templateInvoices = await prisma.invoice.findMany({
            where: {
                isRecurring: true,
                recurrenceInterval: { not: null },
            },
            include: {
                items: true,
            },
        });
        if (templateInvoices.length === 0) {
            logger_1.default.info("[Cron] No recurring invoices templates found.");
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (const template of templateInvoices) {
            try {
                const nextDueDate = this.calculateNextDueDate(template.dueDate, template.recurrenceInterval);
                nextDueDate.setHours(0, 0, 0, 0);
                if (nextDueDate.getTime() === today.getTime()) {
                    const alreadyExists = await this.checkIfDuplicateExists(template, today);
                    if (!alreadyExists) {
                        await this.duplicateInvoice(template, today);
                    }
                }
            }
            catch (error) {
                logger_1.default.error(`[Cron] Failed to process template ${template.id}: ${error.message}`);
            }
        }
        logger_1.default.info("[Cron] Recurring invoice check finished.");
    }
    calculateNextDueDate(originalDueDate, interval) {
        const nextDate = new Date(originalDueDate.getTime());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        while (nextDate.getTime() < today.getTime()) {
            switch (interval) {
                case "weekly":
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case "monthly":
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    break;
                case "yearly":
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                    break;
                default:
                    nextDate.setFullYear(nextDate.getFullYear() + 100);
                    break;
            }
        }
        return nextDate;
    }
    async checkIfDuplicateExists(template, newDueDate) {
        const existing = await prisma.invoice.findFirst({
            where: {
                userId: template.userId,
                clientId: template.clientId,
                status: prisma_1.InvoiceStatus.DRAFT,
                dueDate: newDueDate,
                notes: { contains: `Recurring from ${template.invoiceNumber}` },
            },
        });
        return !!existing;
    }
    async duplicateInvoice(template, newDueDate) {
        logger_1.default.info(`[Cron] Generating new invoice from template ${template.id} for user ${template.userId}`);
        const newItems = template.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price.toString(),
            productId: item.productId || undefined,
        }));
        const newInvoiceNumber = `${template.invoiceNumber.split("-")[0]}-RE-${newDueDate.getTime()}`;
        const newInvoiceData = {
            clientId: template.clientId,
            invoiceNumber: newInvoiceNumber,
            status: prisma_1.InvoiceStatus.DRAFT,
            dueDate: newDueDate,
            notes: `Recurring from ${template.invoiceNumber}\n${template.notes || ""}`,
            currency: template.currency,
            isRecurring: false,
            items: newItems,
        };
        await invoice_repository_1.default.create(newInvoiceData, template.userId, template.totalAmount);
        logger_1.default.info(`[Cron] Successfully created new invoice ${newInvoiceNumber}`);
    }
}
exports.default = new RecurringService();
