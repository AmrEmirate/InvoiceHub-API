import InvoiceRepository from "../repositories/invoice.repository";
import ClientRepository from "../repositories/client.repository";
import ProductRepository from "../repositories/product.repository";
import {
  TCreateInvoiceInput,
  TUpdateInvoiceInput,
} from "../types/invoice.types";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { Decimal } from "@prisma/client/runtime/library";

// PERBAIKAN 1: Impor tipe dari @prisma/client
import { Invoice, InvoiceStatus, User, InvoiceItem } from "../generated/prisma";

// PERBAIKAN 2: Impor 'transporter' (bukan 'transport')
import { transport } from "../config/nodemailer";

class InvoiceService {
  public async createInvoice(
    input: TCreateInvoiceInput,
    userId: string
  ): Promise<Invoice> {
    const client = await ClientRepository.findByIdAndUser(input.clientId, userId);
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

    try {
      const newInvoice = await InvoiceRepository.create(
        input,
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
        throw new AppError(409, "Invoice number already exists.");
      }
      throw new AppError(500, "Failed to create invoice", error);
    }
  }

  public async getInvoices(
    userId: string,
    filters: { search?: string; status?: InvoiceStatus; clientId?: string }
  ) {
    return await InvoiceRepository.findAllByUser(userId, filters);
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

    // PERBAIKAN 3: Gunakan Enum (bukan string "PAID")
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
    // Tipe 'invoice' akan otomatis memiliki 'user' dan 'client'
    // jika 'invoice.repository.ts' sudah diperbaiki
    const invoice = await this.getInvoiceById(invoiceId, userId);

    if (!invoice.client || !invoice.client.email) {
      throw new AppError(404, "Client email not found for this invoice");
    }

    const user = invoice.user;
    const client = invoice.client;

    // PERBAIKAN 4: Beri tipe ': InvoiceItem' pada parameter 'item'
    const itemsHtml = invoice.items
      .map(
        (item: InvoiceItem) =>
          `<tr>
             <td style="padding: 8px; border: 1px solid #ddd;">${
               item.description
             }</td>
             <td style="padding: 8px; border: 1px solid #ddd;">${
               item.quantity
             }</td>
             <td style="padding: 8px; border: 1px solid #ddd;">$${item.price.toFixed(
               2
             )}</td>
           </tr>`
      )
      .join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Halo ${client.name},</h2>
        <p>Anda menerima invoice baru (${invoice.invoiceNumber}) dari ${
      user.company
    }.</p>
        <p><strong>Total Tagihan: $${invoice.totalAmount.toFixed(
          2
        )}</strong></p>
        <p><strong>Jatuh Tempo: ${new Date(
          invoice.dueDate
        ).toLocaleDateString()}</p>
        <hr>
        <h3>Detail Item:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background-color: #f4f4f4;">
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Deskripsi</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Qty</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Harga</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <hr>
        <p>Catatan:</p>
        <p><em>${invoice.notes || "Tidak ada catatan."}</em></p>
        <p>Terima kasih!</p>
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

      // PERBAIKAN 5: Gunakan Enum (bukan string "DRAFT" / "SENT")
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
}

export default new InvoiceService();