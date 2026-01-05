import InvoiceRepository from "../repositories/invoice.repository";
import ClientRepository from "../repositories/client.repository";
import ProductRepository from "../repositories/product.repository";
import { TCreateInvoiceInput } from "../types/invoice.types";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { Decimal } from "@prisma/client/runtime/library";
import { Invoice, InvoiceStatus, User, InvoiceItem } from "@prisma/client";
import { transport } from "../config/nodemailer";
import { PaginatedResponse, PaginationParams } from "../types/pagination.types";
import { prisma } from "../config/prisma";
import { generateInvoiceEmail } from "../utils/email-templates";

type ChartData = {
  month: string;
  revenue: number;
};

class InvoiceService {
  public async getDashboardStats(userId: string) {
    try {
      const stats = await InvoiceRepository.getDashboardStats(userId);
      return stats;
    } catch (error: any) {
      logger.error(`Error fetching dashboard stats: ${error.message}`);
      throw new AppError(500, "Failed to get dashboard stats", error);
    }
  }

  private async generateInvoiceNumber(userId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;

    const lastInvoice = await InvoiceRepository.findLastInvoiceByDate(
      userId,
      today
    );

    let sequence = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split("-");
      if (parts.length === 3 && parts[1] === datePrefix) {
        const lastSequence = parseInt(parts[2], 10);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
    }

    return `INV-${datePrefix}-${String(sequence).padStart(4, "0")}`;
  }

  public async createInvoice(
    input: TCreateInvoiceInput,
    userId: string
  ): Promise<Invoice> {
    const client = await ClientRepository.findByIdAndUser(
      input.clientId,
      userId
    );
    if (!client) {
      throw new AppError(404, "Client not found or does not belong to user");
    }

    let totalAmount = new Decimal(0);

    await Promise.all(
      input.items.map(async (item) => {
        if (item.productId) {
          const product = await ProductRepository.findByIdAndUser(
            item.productId,
            userId
          );
          if (!product) {
            throw new AppError(
              404,
              `Product with ID ${item.productId} not found`
            );
          }
        }

        const itemTotal = new Decimal(item.price).times(item.quantity);
        totalAmount = totalAmount.add(itemTotal);
      })
    );

    const invoiceNumber = await this.generateInvoiceNumber(userId);

    try {
      const newInvoice = await InvoiceRepository.create(
        { ...input, invoiceNumber },
        userId,
        totalAmount
      );
      logger.info(
        `New invoice created (ID: ${newInvoice.id}) by user ${userId}`
      );

      // Auto-send email if recurring invoice with autoSendEmail enabled
      if (input.isRecurring && input.autoSendEmail) {
        try {
          await this.sendInvoiceEmail(newInvoice.id, userId);
          logger.info(
            `Auto-sent email for new recurring invoice ${newInvoice.invoiceNumber}`
          );
        } catch (emailError: any) {
          logger.error(
            `Failed to auto-send email for ${newInvoice.invoiceNumber}: ${emailError.message}`
          );
          // Don't throw - invoice was created successfully, just email failed
        }
      }

      return newInvoice;
    } catch (error: any) {
      logger.error(`Invoice creation failed: ${error.message}`, error);
      if (error.code === "P2002") {
        try {
          const retryInvoiceNumber = await this.generateInvoiceNumber(userId);
          const newInvoice = await InvoiceRepository.create(
            { ...input, invoiceNumber: retryInvoiceNumber },
            userId,
            totalAmount
          );

          // Auto-send email for retry case too
          if (input.isRecurring && input.autoSendEmail) {
            try {
              await this.sendInvoiceEmail(newInvoice.id, userId);
              logger.info(
                `Auto-sent email for new recurring invoice ${newInvoice.invoiceNumber}`
              );
            } catch (emailError: any) {
              logger.error(
                `Failed to auto-send email for ${newInvoice.invoiceNumber}: ${emailError.message}`
              );
            }
          }

          return newInvoice;
        } catch (retryError: any) {
          throw new AppError(409, "Invoice number already exists.");
        }
      }
      throw new AppError(500, "Failed to create invoice", error);
    }
  }

  public async getInvoices(
    userId: string,
    filters: { search?: string; status?: InvoiceStatus; clientId?: string },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Invoice>> {
    return await InvoiceRepository.findAllByUser(userId, filters, pagination);
  }

  public async getInvoiceById(id: string, userId: string) {
    const invoice = await InvoiceRepository.findByIdAndUser(id, userId);
    if (!invoice) {
      throw new AppError(404, "Invoice not found");
    }
    return invoice;
  }

  public async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    userId: string
  ) {
    const invoice = await this.getInvoiceById(id, userId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new AppError(400, "Cannot update a paid invoice");
    }

    const updatedInvoice = await InvoiceRepository.updateStatus(id, { status });
    logger.info(
      `Invoice (ID: ${id}) status updated to ${status} by user ${userId}`
    );
    return updatedInvoice;
  }

  public async deleteInvoice(id: string, userId: string) {
    await this.getInvoiceById(id, userId);

    await InvoiceRepository.delete(id);
    logger.info(`Invoice (ID: ${id}) deleted by user ${userId}`);
    return true;
  }

  /**
   * Sends invoice via email to the client
   * Uses the centralized email template for consistency
   * @param invoiceId - The invoice ID
   * @param userId - The user ID (owner)
   */
  public async sendInvoiceEmail(invoiceId: string, userId: string) {
    const invoice = await this.getInvoiceById(invoiceId, userId);

    if (!invoice.client || !invoice.client.email) {
      throw new AppError(404, "Client email not found for this invoice");
    }

    const user = invoice.user;
    const client = invoice.client;

    // Use centralized email template
    const emailHtml = generateInvoiceEmail({
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueDate,
      totalAmount: Number(invoice.totalAmount),
      notes: invoice.notes,
      items: invoice.items.map((item: InvoiceItem) => ({
        description: item.description,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      client: {
        name: client.name,
      },
      user: {
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
      },
    });

    const mailOptions = {
      from: `"${user.company}" <${process.env.SMTP_USER}>`,
      to: client.email,
      subject: `Invoice Baru dari ${user.company} (${invoice.invoiceNumber})`,
      html: emailHtml,
    };

    try {
      await transport.sendMail(mailOptions);
      logger.info(
        `Invoice (ID: ${invoiceId}) sent to ${client.email} by user ${userId}`
      );

      // Update status and emailSentAt
      const updateData: { status?: InvoiceStatus; emailSentAt: Date } = {
        emailSentAt: new Date(),
      };

      if (invoice.status === InvoiceStatus.DRAFT) {
        updateData.status = InvoiceStatus.SENT;
      }

      await InvoiceRepository.updateStatus(invoiceId, updateData);

      return true;
    } catch (emailError: any) {
      logger.error(`Failed to send invoice email: ${emailError.message}`);
      throw new AppError(500, "Failed to send email", emailError);
    }
  }

  public async getChartData(
    userId: string,
    year?: number
  ): Promise<ChartData[]> {
    try {
      let result;
      const monthlyData: Record<string, number> = {};
      const months = [];

      if (year) {
        // Fetch data for specific year
        result = await prisma.$queryRaw<ChartData[]>`
          SELECT 
            TO_CHAR(date_trunc('month', i."invoiceDate"), 'YYYY-MM') as month,
            SUM(i."totalAmount")::float as revenue
          FROM "Invoice" i
          WHERE i."userId" = ${userId}
            AND i."status" = ${InvoiceStatus.PAID}::"InvoiceStatus"
            AND EXTRACT(YEAR FROM i."invoiceDate") = ${year}
          GROUP BY 1
          ORDER BY 1 ASC;
        `;

        // Generate months for the selected year (Jan - Dec)
        for (let i = 1; i <= 12; i++) {
          const monthKey = `${year}-${String(i).padStart(2, "0")}`;
          months.push(monthKey);
          monthlyData[monthKey] = 0;
        }
      } else {
        // Fetch data for last 12 months (existing logic)
        result = await prisma.$queryRaw<ChartData[]>`
          SELECT 
            TO_CHAR(date_trunc('month', i."invoiceDate"), 'YYYY-MM') as month,
            SUM(i."totalAmount")::float as revenue
          FROM "Invoice" i
          WHERE i."userId" = ${userId}
            AND i."status" = ${InvoiceStatus.PAID}::"InvoiceStatus"
            AND i."invoiceDate" >= date_trunc('month', NOW() - interval '11 months')
          GROUP BY 1
          ORDER BY 1 ASC;
        `;

        const today = new Date();
        for (let i = 0; i < 12; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`;
          months.push(monthKey);
          monthlyData[monthKey] = 0;
        }
        // Reverse needed for last 12 months relative to today
        months.reverse();
      }

      result.forEach((item) => {
        if (monthlyData.hasOwnProperty(item.month)) {
          monthlyData[item.month] = item.revenue;
        }
      });

      const formattedData = months.map((monthKey) => ({
        month: monthKey,
        revenue: monthlyData[monthKey],
      }));

      return formattedData;
    } catch (error: any) {
      logger.error(`Error fetching chart data: ${error.message}`);
      throw new AppError(500, "Failed to get chart data", error);
    }
  }

  public async markOverdueInvoices(): Promise<number> {
    try {
      const count = await InvoiceRepository.markOverdueInvoices();
      if (count > 0) {
        logger.info(`[Cron] Marked ${count} invoices as OVERDUE`);
      }
      return count;
    } catch (error: any) {
      logger.error(`Error marking overdue invoices: ${error.message}`);
      throw new AppError(500, "Failed to mark overdue invoices", error);
    }
  }
}

export default new InvoiceService();
