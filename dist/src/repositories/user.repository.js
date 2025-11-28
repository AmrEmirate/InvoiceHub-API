"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
class UserRepository {
    async findUserByEmail(email) {
        return await prisma.user.findUnique({
            where: { email },
        });
    }
    async createUser(userData) {
        return await prisma.user.create({
            data: userData,
        });
    }
    async findUserById(id) {
        return await prisma.user.findUnique({
            where: { id },
        });
    }
    async updateUser(id, data) {
        return await prisma.user.update({
            where: { id },
            data,
        });
    }
    async findByVerificationToken(token) {
        return await prisma.user.findUnique({
            where: { verificationToken: token },
        });
    }
    async findByResetToken(token) {
        return await prisma.user.findUnique({
            where: { resetToken: token },
        });
    }
    async setPasswordAndVerify(id, hashedPassword) {
        return await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                isVerified: true,
                verificationToken: null,
            },
        });
    }
    async setResetToken(id, resetToken, resetTokenExpiry) {
        return await prisma.user.update({
            where: { id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });
    }
    async updatePasswordFromReset(id, hashedPassword) {
        return await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
    }
}
exports.default = new UserRepository();
