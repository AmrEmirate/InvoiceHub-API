// File: src/repositories/invoice.repository.ts
import { PrismaClient, Invoice, InvoiceStatus } from "../generated/prisma";
import { TCreateInvoiceInput } from "../types/invoice.types";
import { Decimal } from "@prisma/client/runtime/library";
import { PaginatedResponse, PaginationParams } from "../types/pagination.types";

// Pastikan prisma diinisialisasi (Anda mungkin mengimpornya dari config/prisma)
// Jika Anda punya file 'src/config/prisma.ts', gunakan impor itu:
// import prisma from "../config/prisma";
// Jika tidak, inisialisasi di sini:
// const prisma = new PrismaClient();
// Berdasarkan file Anda yang lain, Anda sepertinya mengimpor 'prisma' dari config.
// Jika file ini tidak mengimpornya, mari kita asumsikan Anda memiliki 'config/prisma.ts'
import { prisma } from "../config/prisma";


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
        include: {
          items: true,
          client: true,
          user: true,
        },
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
      search?: string;
      status?: InvoiceStatus; // Gunakan tipe Enum
      clientId?: string;
    },
    pagination: PaginationParams // <-- PARAMETER BARU
  ): Promise<PaginatedResponse<Invoice>> { // <-- TIPE KEMBALIAN BARU
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

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

    // 1. Ambil data halaman saat ini
    const data = await prisma.invoice.findMany({
      where: whereCondition,
      include: {
        client: true,
      },
      orderBy: { invoiceDate: "desc" },
      skip: skip,
      take: limit,
    });

    // 2. Ambil total data
    const total = await prisma.invoice.count({
      where: whereCondition,
    });

    // 3. Kembalikan data + meta paginasi
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mencari satu invoice lengkap dengan item dan client
   */
  public async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<(Invoice & { user: any; client: any; items: any[] }) | null> {
    return await prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        user: true,
        client: true,
        items: {
          include: {
            product: true, // Sertakan data produk jika terhubung
          },
        },
      },
    });
  }

  // --- 🚀 KODE YANG HILANG DITAMBAHKAN DI SINI 🚀 ---
  /**
   * Mengambil statistik agregat untuk dashboard
   */
  public async getDashboardStats(userId: string) {
    const now = new Date();

    // Jalankan semua query agregat dalam satu transaksi
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenueResult,
    ] = await prisma.$transaction([
      // 1. Total Invoices
      prisma.invoice.count({ where: { userId } }),
      
      // 2. Paid Invoices
      prisma.invoice.count({
        where: { userId, status: InvoiceStatus.PAID },
      }),
      
      // 3. Pending Invoices (Sent + Pending)
      prisma.invoice.count({
        where: {
          userId,
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.PENDING] },
        },
      }),
      
      // 4. Overdue Invoices
      prisma.invoice.count({
        where: {
          userId,
          status: InvoiceStatus.OVERDUE,
          // Juga hitung yang SENT/PENDING tapi sudah lewat jatuh tempo
          OR: [
            { status: InvoiceStatus.OVERDUE },
            {
              status: { in: [InvoiceStatus.SENT, InvoiceStatus.PENDING] },
              dueDate: { lt: now },
            },
          ],
        },
      }),
      
      // 5. Total Revenue (SUM dari semua yg PAID)
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { userId, status: InvoiceStatus.PAID },
      }),
    ]);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue: totalRevenueResult._sum.totalAmount || 0,
    };
  }
  // --- AKHIR DARI KODE YANG DITAMBAHKAN ---

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