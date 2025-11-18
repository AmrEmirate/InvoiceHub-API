import { PrismaClient, User } from "../generated/prisma";
import { TCreateUserInput, TUpdateUserInput } from "../types/user.types";

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

  public async updateUser(
    id: string,
    data: TUpdateUserInput
  ): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  public async findByVerificationToken(
    token: string
  ): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { verificationToken: token },
    });
  }

  public async setPasswordAndVerify(
    id: string,
    hashedPassword: string
  ): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        isVerified: true,
        verificationToken: null,
      },
    });
  }
}

export default new UserRepository();