// File: src/service/auth.service.ts
import UserRepository from "../repositories/user.repository";
import {
  TCreateUserInput,
  TUpdateUserInput,
} from "../types/user.types"; // <-- Pastikan TUpdateUserInput diimpor
import AppError from "../utils/AppError";
import { hashPassword, comparePassword } from "../utils/hash"; // <-- Pastikan comparePassword diimpor
import { createToken } from "../utils/jwt";
import logger from "../utils/logger";

// Tipe data yang dikirim dari controller
type TRegisterInput = Omit<TCreateUserInput, "password"> & {
  password_plain: string;
};

class AuthService {
  /**
   * Registrasi user baru
   */
  public async register(
    input: TRegisterInput
  ): Promise<{ user: any; token: string }> {
    // 1. Cek apakah user sudah ada
    const existingUser = await UserRepository.findUserByEmail(input.email); //
    if (existingUser) { //
      logger.warn(
        `Registration attempt failed: Email ${input.email} already exists.`
      ); //
      throw new AppError(409, "Email already registered"); //
    }

    // 2. Hash password
    const hashedPassword = await hashPassword(input.password_plain); //

    // 3. Buat user baru
    const newUserInput: TCreateUserInput = { //
      email: input.email, //
      name: input.name, //
      company: input.company, //
      password: hashedPassword, //
    };

    let createdUser; //
    try {
      createdUser = await UserRepository.createUser(newUserInput); //
      logger.info(
        `New user registered: ${createdUser.email} (ID: ${createdUser.id})`
      ); //
    } catch (dbError: any) {
      logger.error(`Database error during user creation: ${dbError.message}`); //
      throw new AppError(500, "Failed to create user", dbError); //
    }

    // 4. Buat JWT Token
    const tokenPayload = { //
      id: createdUser.id, //
      email: createdUser.email, //
    };
    const token = createToken(tokenPayload); //

    // 5. Hapus password dari data user yang dikembalikan
    const { password, ...userWithoutPassword } = createdUser; //

    return { user: userWithoutPassword, token }; //
  }

  // --- METHOD BARU (LOGIN) ---
  /**
   * Login user
   */
  public async login(
    input: Pick<TRegisterInput, "email" | "password_plain">
  ): Promise<{ user: any; token: string }> {
    // 1. Cari user berdasarkan email
    const user = await UserRepository.findUserByEmail(input.email);
    if (!user) {
      logger.warn(`Login attempt failed: Email ${input.email} not found.`);
      throw new AppError(401, "Invalid email or password");
    }

    // 2. Bandingkan password
    const isPasswordValid = await comparePassword(
      input.password_plain,
      user.password
    );

    if (!isPasswordValid) {
      logger.warn(`Login attempt failed: Invalid password for ${input.email}.`);
      throw new AppError(401, "Invalid email or password");
    }

    // 3. Buat JWT Token
    const tokenPayload = {
      id: user.id,
      email: user.email,
    };
    const token = createToken(tokenPayload);
    logger.info(`User logged in: ${user.email} (ID: ${user.id})`);

    // 4. Hapus password dari data user
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  // --- METHOD BARU (UPDATE PROFILE) ---
  /**
   * Update profile user
   */
  public async updateProfile(
    userId: string,
    data: TUpdateUserInput
  ): Promise<any> {
    const updatedUser = await UserRepository.updateUser(userId, data);
    logger.info(`Profile updated for user: ${updatedUser.email} (ID: ${userId})`);

    // Hapus password dari data user yang dikembalikan
    const { password, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
  }
}

export default new AuthService();