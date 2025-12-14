import {
  PrismaClient,
  Invoice,
  InvoiceStatus,
  InvoiceItem,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import InvoiceRepository from "../repositories/invoice.repository";
import InvoiceService from "../service/invoice.service";
import logger from "../utils/logger";
import { TCreateInvoiceInput } from "../types/invoice.types";

const prisma = new PrismaClient();

class RecurringService {
  public async generateRecurringInvoices() {
    logger.info("[Cron] Running recurring invoice check...");

    const templateInvoices = await prisma.invoice.findMany({
      where: {
        isRecurring: true,
        recurrenceInterval: { not: null },
      },
      include: {
        items: true,
        client: true,
        user: true,
      },
    });

    if (templateInvoices.length === 0) {
      logger.info("[Cron] No recurring invoices templates found.");
      return;
    }

    const today = new Date();
    const currentDay = today.getDate();

    for (const template of templateInvoices) {
      try {
        // Check if today is the recurring day
        const shouldGenerateToday = this.shouldGenerateInvoice(
          template,
          currentDay,
          today
        );

        if (shouldGenerateToday) {
          const alreadyExists = await this.checkIfDuplicateExists(
            template,
            today
          );

          if (!alreadyExists) {
            await this.duplicateInvoice(
              template as Invoice & { items: InvoiceItem[] },
              today
            );
          }
        }
      } catch (error: any) {
        logger.error(
          `[Cron] Failed to process template ${template.id}: ${error.message}`
        );
      }
    }
    logger.info("[Cron] Recurring invoice check finished.");
  }

  private shouldGenerateInvoice(
    template: Invoice,
    currentDay: number,
    today: Date
  ): boolean {
    // If recurrenceDay is set, check if today is that day
    if (template.recurrenceDay) {
      // Handle months with fewer days (e.g., Feb 28/29)
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate();
      const targetDay = Math.min(template.recurrenceDay, lastDayOfMonth);
      return currentDay === targetDay;
    }

    // Fallback to old logic based on dueDate interval
    const nextDueDate = this.calculateNextDueDate(
      template.dueDate,
      template.recurrenceInterval!
    );
    nextDueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return nextDueDate.getTime() === today.getTime();
  }

  private calculateNextDueDate(originalDueDate: Date, interval: string): Date {
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

  private calculateDueDate(template: Invoice): Date {
    const today = new Date();

    // If paymentTermDays is set, calculate due date from today
    if (template.paymentTermDays && template.paymentTermDays > 0) {
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + template.paymentTermDays);
      return dueDate;
    }

    // Fallback: calculate based on interval
    const dueDate = new Date(today);
    switch (template.recurrenceInterval) {
      case "weekly":
        dueDate.setDate(dueDate.getDate() + 7);
        break;
      case "monthly":
        dueDate.setMonth(dueDate.getMonth() + 1);
        break;
      case "yearly":
        dueDate.setFullYear(dueDate.getFullYear() + 1);
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 30); // Default 30 days
    }
    return dueDate;
  }

  private async checkIfDuplicateExists(
    template: Invoice,
    newInvoiceDate: Date
  ): Promise<boolean> {
    const startOfDay = new Date(newInvoiceDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(newInvoiceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.invoice.findFirst({
      where: {
        userId: template.userId,
        clientId: template.clientId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        notes: { contains: `Recurring from ${template.invoiceNumber}` },
      },
    });
    return !!existing;
  }

  private async duplicateInvoice(
    template: Invoice & { items: InvoiceItem[] },
    invoiceDate: Date
  ) {
    logger.info(
      `[Cron] Generating new invoice from template ${template.id} for user ${template.userId}`
    );

    const newItems = template.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      price: item.price.toString(),
      productId: item.productId || undefined,
    }));

    const newDueDate = this.calculateDueDate(template);

    const newInvoiceNumber = `${
      template.invoiceNumber.split("-")[0]
    }-RE-${invoiceDate.getTime()}`;

    // Set initial status based on autoSendEmail
    const initialStatus = template.autoSendEmail
      ? InvoiceStatus.SENT
      : InvoiceStatus.DRAFT;

    const newInvoiceData = {
      clientId: template.clientId,
      invoiceNumber: newInvoiceNumber,
      status: initialStatus,
      dueDate: newDueDate,
      notes: `Recurring from ${template.invoiceNumber}\n${
        template.notes || ""
      }`,
      currency: template.currency,
      isRecurring: false,
      items: newItems,
    };

    const newInvoice = await InvoiceRepository.create(
      newInvoiceData as any,
      template.userId,
      template.totalAmount
    );

    logger.info(`[Cron] Successfully created new invoice ${newInvoiceNumber}`);

    // Auto-send email if enabled
    if (template.autoSendEmail) {
      try {
        await InvoiceService.sendInvoiceEmail(newInvoice.id, template.userId);
        logger.info(`[Cron] Auto-sent email for invoice ${newInvoiceNumber}`);
      } catch (emailError: any) {
        logger.error(
          `[Cron] Failed to auto-send email for ${newInvoiceNumber}: ${emailError.message}`
        );
      }
    }
  }
}

export default new RecurringService();
