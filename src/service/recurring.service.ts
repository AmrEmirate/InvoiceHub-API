import {
  PrismaClient,
  Invoice,
  InvoiceStatus,
  InvoiceItem,
} from "../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import InvoiceRepository from "../repositories/invoice.repository";
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
      },
    });

    if (templateInvoices.length === 0) {
      logger.info("[Cron] No recurring invoices templates found.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const template of templateInvoices) {
      try {
        const nextDueDate = this.calculateNextDueDate(
          template.dueDate,
          template.recurrenceInterval!
        );
        nextDueDate.setHours(0, 0, 0, 0);

        if (nextDueDate.getTime() === today.getTime()) {
          const alreadyExists = await this.checkIfDuplicateExists(
            template,
            today
          );

          if (!alreadyExists) {
            await this.duplicateInvoice(template as Invoice & { items: InvoiceItem[] }, today);
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

  private calculateNextDueDate(
    originalDueDate: Date,
    interval: string
  ): Date {
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

  private async checkIfDuplicateExists(
    template: Invoice,
    newDueDate: Date
  ): Promise<boolean> {
    const existing = await prisma.invoice.findFirst({
      where: {
        userId: template.userId,
        clientId: template.clientId,
        status: InvoiceStatus.DRAFT,
        dueDate: newDueDate,
        notes: { contains: `Recurring from ${template.invoiceNumber}` },
      },
    });
    return !!existing;
  }

  private async duplicateInvoice(
    template: Invoice & { items: InvoiceItem[] },
    newDueDate: Date
  ) {
    logger.info(
      `[Cron] Generating new invoice from template ${template.id} for user ${template.userId}`
    );

    const newItems = template.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      productId: item.productId || undefined,
    }));

    const newInvoiceNumber = `${
      template.invoiceNumber.split("-")[0]
    }-RE-${newDueDate.getTime()}`;

    const newInvoiceData: TCreateInvoiceInput = {
      clientId: template.clientId,
      invoiceNumber: newInvoiceNumber,
      status: InvoiceStatus.DRAFT,
      dueDate: newDueDate,
      notes: `Recurring from ${template.invoiceNumber}\n${
        template.notes || ""
      }`,
      currency: template.currency,
      isRecurring: false,
      items: newItems,
    };

    await InvoiceRepository.create(
      newInvoiceData,
      template.userId,
      template.totalAmount
    );

    logger.info(
      `[Cron] Successfully created new invoice ${newInvoiceNumber}`
    );
  }
}

export default new RecurringService();