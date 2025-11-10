import { PrismaClient, User } from "../generated/prisma";
import { TCreateUserInput, TUpdateUserInput } from "../types/user.types";

// Inisialisasi Prisma Client (kamu bisa pindahkan ini ke src/config/prisma.ts jika mau)
const prisma = new PrismaClient();

class UserRepository {
  public async findUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  public async createUser(userData: TCreateUserInput): Promise<User> {
    return await prisma.user.create({
      data: userData,
    });
  }

  public async findUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  // --- METHOD BARU YANG DITAMBAHKAN ---
  /**
   * Mengupdate data user berdasarkan ID
   * @param id ID user yang akan di-update
   * @param data Data baru yang akan di-update
   * @returns User yang sudah ter-update
   */
  public async updateUser(
    id: string,
    data: TUpdateUserInput
  ): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }
  // --- AKHIR DARI METHOD BARU ---
}

export default new UserRepository();