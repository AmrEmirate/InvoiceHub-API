// File: src/service/invoice.service.ts
import InvoiceRepository from "../repositories/invoice.repository";
import ClientRepository from "../repositories/client.repository";
import ProductRepository from "../repositories/product.repository";
import { TCreateInvoiceInput, TInvoiceItemInput, TUpdateInvoiceInput } from "../types/invoice.types";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { Decimal } from "@prisma/client/runtime/library";
import { Invoice, InvoiceStatus } from "../generated/prisma";

class InvoiceService {
  /**
   * Membuat Invoice baru
   */
  public async createInvoice(
    input: TCreateInvoiceInput,
    userId: string
  ): Promise<Invoice> {
    // 1. Validasi kepemilikan Client
    const client = await ClientRepository.findByIdAndUser(input.clientId, userId);
    if (!client) {
      throw new AppError(404, "Client not found or does not belong to user");
    }

    // 2. Validasi setiap item dan hitung total
    let totalAmount = new Decimal(0);
    
    // Gunakan Promise.all untuk validasi item secara paralel
    await Promise.all(
      input.items.map(async (item) => {
        // 2a. Jika ada productId, validasi kepemilikan produk
        if (item.productId) {
          const product = await ProductRepository.findByIdAndUser(item.productId, userId);
          if (!product) {
            throw new AppError(404, `Product with ID ${item.productId} not found`);
          }
        }
        
        // 2b. Hitung total
        const itemTotal = new Decimal(item.price).times(item.quantity);
        totalAmount = totalAmount.add(itemTotal);
      })
    );

    // 3. Panggil Repository untuk membuat invoice dalam transaksi
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
      if (error.code === 'P2002') { // Error unik (misal: invoiceNumber duplikat)
        throw new AppError(409, "Invoice number already exists.");
      }
      throw new AppError(500, "Failed to create invoice", error);
    }
  }

  /**
   * Mengambil semua invoice (dengan filter)
   */
  public async getInvoices(
    userId: string,
    filters: { search?: string; status?: InvoiceStatus; clientId?: string }
  ) {
    return await InvoiceRepository.findAllByUser(userId, filters);
  }

  /**
   * Mengambil satu invoice detail
   */
  public async getInvoiceById(id: string, userId: string) {
    const invoice = await InvoiceRepository.findByIdAndUser(id, userId);
    if (!invoice) {
      throw new AppError(404, "Invoice not found");
    }
    return invoice;
  }

  /**
   * Update status invoice (misal: dari DRAFT ke PENDING)
   */
  public async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    userId: string
  ) {
    // 1. Validasi kepemilikan
    const invoice = await this.getInvoiceById(id, userId);
    
    // Disini bisa ditambahkan logika bisnis,
    // misal: tidak boleh update jika status sudah PAID
    if (invoice.status === 'PAID') {
       throw new AppError(400, "Cannot update a paid invoice");
    }

    const updatedInvoice = await InvoiceRepository.updateStatus(id, { status });
    logger.info(
      `Invoice (ID: ${id}) status updated to ${status} by user ${userId}`
    );
    return updatedInvoice;
  }

  /**
   * Hapus invoice
   */
  public async deleteInvoice(id: string, userId: string) {
    // 1. Validasi kepemilikan
    await this.getInvoiceById(id, userId);
    
    await InvoiceRepository.delete(id);
    logger.info(`Invoice (ID: ${id}) deleted by user ${userId}`);
    return true;
  }
}

export default new InvoiceService();