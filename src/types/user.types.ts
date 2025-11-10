// File: src/types/user.types.ts
// Tipe ini berdasarkan input dari form signup
export type TCreateUserInput = {
  email: string;
  password: string; // Ini adalah password yang sudah di-hash
  name: string;
  company: string;
};