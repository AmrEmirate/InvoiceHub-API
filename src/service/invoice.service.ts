import InvoiceRepository from "../repositories/invoice.repository";
import ClientRepository from "../repositories/client.repository";
import ProductRepository from "../repositories/product.repository";
import { TCreateInvoiceInput } from "../types/invoice.types";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { Decimal } from "@prisma/client/runtime/library";
import { Invoice, InvoiceStatus, User, InvoiceItem } from "../generated/prisma";
import { transport } from "../config/nodemailer";
import { PaginatedResponse, PaginationParams } from "../types/pagination.types";
import { prisma } from "../config/prisma";

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

  public async sendInvoiceEmail(invoiceId: string, userId: string) {
    const invoice = await this.getInvoiceById(invoiceId, userId);

    if (!invoice.client || !invoice.client.email) {
      throw new AppError(404, "Client email not found for this invoice");
    }

    const user = invoice.user;
    const client = invoice.client;

    const userAvatar = user.avatar
      ? `<img src="${user.avatar}" alt="${user.company}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;" />`
      : `<div style="width: 60px; height: 60px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">${
          user.company?.charAt(0) || "I"
        }</div>`;

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 8px 8px 0 0;">
          <table style="width: 100%;">
            <tr>
              <td style="vertical-align: middle;">
                ${userAvatar}
              </td>
              <td style="vertical-align: middle; padding-left: 16px;">
                <h1 style="margin: 0; color: white; font-size: 20px;">${
                  user.company
                }</h1>
                <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${
                  user.email
                }</p>
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="margin-top: 0; color: #1f2937;">Halo ${client.name},</h2>
          <p style="color: #4b5563;">Anda menerima invoice baru dari <strong>${
            user.company
          }</strong>.</p>
          
          <!-- Invoice Summary -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280; font-size: 14px;">No. Invoice</td>
                <td style="text-align: right; font-weight: 600; color: #1f2937;">${
                  invoice.invoiceNumber
                }</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Jatuh Tempo</td>
                <td style="text-align: right; font-weight: 600; color: #1f2937; padding-top: 8px;">${new Date(
                  invoice.dueDate
                ).toLocaleDateString("id-ID")}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 14px; padding-top: 8px;">Total Tagihan</td>
                <td style="text-align: right; font-weight: 700; color: #7c3aed; font-size: 18px; padding-top: 8px;">Rp ${Number(
                  invoice.totalAmount
                ).toLocaleString("id-ID")}</td>
              </tr>
            </table>
          </div>
          
          <h3 style="color: #1f2937; margin-bottom: 12px;">Detail Item:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="background-color: #f3f4f6;">
              <tr>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151; font-size: 14px;">Deskripsi</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #374151; font-size: 14px;">Qty</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 14px;">Harga Satuan</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; color: #374151; font-size: 14px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item: InvoiceItem) =>
                    `<tr>
               <td style="padding: 12px; border: 1px solid #e5e7eb; color: #4b5563;">${
                 item.description
               }</td>
               <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #4b5563;">${
                 item.quantity
               }</td>
               <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; color: #4b5563;">Rp ${Number(
                 item.price
               ).toLocaleString("id-ID")}</td>
               <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; color: #4b5563; font-weight: 600;">Rp ${Number(
                 Number(item.price) * item.quantity
               ).toLocaleString("id-ID")}</td>
             </tr>`
                )
                .join("")}
            </tbody>
          </table>
          
          ${
            invoice.notes
              ? `
          <div style="margin-top: 20px; padding: 12px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Catatan:</strong></p>
            <p style="margin: 4px 0 0 0; color: #92400e; font-size: 14px;">${invoice.notes}</p>
          </div>
          `
              : ""
          }
          
          <p style="margin-top: 24px; color: #4b5563;">Terima kasih atas kepercayaan Anda!</p>
          
          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">Email ini dikirim oleh ${
              user.company
            }</p>
            ${
              user.phone
                ? `<p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 12px;">Telepon: ${user.phone}</p>`
                : ""
            }
            ${
              user.address
                ? `<p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 12px;">${user.address}</p>`
                : ""
            }
          </div>
        </div>
      </div>
    `;

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

      if (invoice.status === InvoiceStatus.DRAFT) {
        await InvoiceRepository.updateStatus(invoiceId, {
          status: InvoiceStatus.SENT,
        });
      }

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
}

export default new InvoiceService();
