// File: src/repositories/invoice.repository.ts
import { PrismaClient, Invoice, InvoiceStatus } from "../generated/prisma";
import { TCreateInvoiceInput } from "../types/invoice.types";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

class InvoiceRepository {
  /**
   * Membuat Invoice dan InvoiceItems dalam satu transaksi
   */
  public async create(
    data: TCreateInvoiceInput,
    userId: string,
    totalAmount: Decimal
  ): Promise<Invoice> {
    const { items, ...invoiceData } = data;

    // Gunakan transaksi untuk memastikan semua kueri berhasil atau gagal bersamaan
    return await prisma.$transaction(async (tx) => {
      // 1. Buat Invoice utama
      const newInvoice = await tx.invoice.create({
        data: {
          ...invoiceData,
          dueDate: new Date(invoiceData.dueDate), // Konversi ke Date
          totalAmount: totalAmount,
          userId: userId, // Hubungkan ke User
        },
      });

      // 2. Siapkan data InvoiceItems
      const itemsData = items.map((item) => ({
        ...item,
        price: new Decimal(item.price), // Pastikan harga adalah Decimal
        invoiceId: newInvoice.id, // Hubungkan ke Invoice baru
        productId: item.productId || null, // Pastikan null jika undefined
      }));

      // 3. Buat semua InvoiceItems
      await tx.invoiceItem.createMany({
        data: itemsData,
      });

      // 4. Ambil lagi invoice-nya dengan SEMUA relasi
      const createdInvoiceWithItems = await tx.invoice.findUniqueOrThrow({
        where: { id: newInvoice.id },
        // --- PERBAIKAN DI SINI ---
        // Kita harus 'include' relasi agar service bisa mengaksesnya
        include: { 
          items: true, 
          client: true, 
          user: true // <-- Ini yang hilang di 'create'
        },
        // --- AKHIR PERBAIKAN ---
      });

      return createdInvoiceWithItems;
    });
  }

  /**
   * Mencari semua invoice milik seorang user
   * (Termasuk filter yang kompleks)
   */
  public async findAllByUser(
    userId: string,
    filters: {
      search?: string; // Untuk invoiceNumber
      status?: InvoiceStatus; // Terima Tipe ENUM
      clientId?: string;
    }
  ): Promise<Invoice[]> {
    const whereCondition: any = { userId };

    if (filters.search) {
      whereCondition.invoiceNumber = {
        contains: filters.search,
        mode: "insensitive",
      };
    }
    if (filters.status) {
      whereCondition.status = filters.status;
    }
    if (filters.clientId) {
      whereCondition.clientId = filters.clientId;
    }

    return await prisma.invoice.findMany({
      where: whereCondition,
      include: {
        client: true, // Sertakan data client (penting untuk FE)
      },
      orderBy: { invoiceDate: "desc" },
    });
  }

  /**
   * Mencari satu invoice lengkap dengan item dan client
   */
  public async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<(Invoice & { user: any; client: any; items: any[] }) | null> { // Memberi tipe yang lebih spesifik
    return await prisma.invoice.findFirst({
      where: { id, userId },
      // --- PERBAIKAN DI SINI ---
      // Kita harus 'include' relasi 'user'
      include: {
        user: true, // <-- Ini yang hilang di 'findByIdAndUser'
        client: true,
        items: {
          include: {
            product: true, // Sertakan data produk jika terhubung
          },
        },
      },
      // --- AKHIR PERBAIKAN ---
    });
  }

  /**
   * Update status atau detail invoice
   */
  public async updateStatus(
    id: string,
    data: { status?: InvoiceStatus } // Terima Tipe ENUM
  ): Promise<Invoice> {
    return await prisma.invoice.update({
      where: { id },
      data,
    });
  }

  /**
   * Hapus invoice (dan item-itemnya akan terhapus otomatis by cascade)
   */
  public async delete(id: string): Promise<Invoice> {
    return await prisma.invoice.delete({
      where: { id },
    });
  }
}

export default new InvoiceRepository();