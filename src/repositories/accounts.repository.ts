import { prisma } from "../config/prisma";
import { hashPassword } from "../utils/hashPassword";

export const createAccount = async (data: any) => {
  return prisma.accounts.create({
    data: { ...data, password: await hashPassword(data.password) },
  });
};
