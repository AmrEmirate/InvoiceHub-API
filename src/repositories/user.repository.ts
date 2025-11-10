// File: src/repositories/user.repository.ts
import { PrismaClient, User } from "../generated/prisma";
import { TCreateUserInput } from "../types/user.types"; // Kita akan buat TCreateUserInput

// Inisialisasi Prisma Client (kamu bisa pindahkan ini ke src/config/prisma.ts)
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
}

export default new UserRepository();