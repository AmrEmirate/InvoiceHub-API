// File: src/types/express.d.ts
// (Buat folder src/types jika belum ada)

import { User } from "../generated/prisma"; // Sesuaikan path jika perlu

// Hapus password dari tipe User untuk keamanan
type SafeUser = Omit<User, "password">;

declare global {
  namespace Express {
    export interface Request {
      user?: SafeUser; // Tambahkan properti user ke object Request
    }
  }
}