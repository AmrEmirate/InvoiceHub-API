import { compare } from "bcrypt";
import { prisma } from "../config/prisma";
import AppError from "../utils/AppError";
import { createToken } from "../utils/createToken"; // 1. Impor createToken

export const loginService = async (data: {
  email: string;
  password: string;
}) => {
  const account = await prisma.accounts.findUnique({
    where: {
      email: data.email,
    },
  });
  if (!account) {
    throw new AppError("Account is not exist", 404);
  }

  const comparePass = await compare(data.password, account.password);
  if (!comparePass) {
    throw new AppError("Password is wrong", 400);
  }

  // 2. Gunakan fungsi untuk membuat token
  const token = createToken(account, "24h");

  return { ...account, token };
};