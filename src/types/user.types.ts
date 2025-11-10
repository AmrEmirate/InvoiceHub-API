// File: src/types/user.types.ts
// Tipe ini berdasarkan input dari form signup
export type TCreateUserInput = {
  email: string; // <-- BENAR (wajib)
  password: string; // <-- BENAR (wajib)
  name: string; // <-- BENAR (wajib)
  company: string; // <-- BENAR (wajib)
};

// Tipe untuk update profile (ini boleh opsional)
export type TUpdateUserInput = {
  name?: string;
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  taxId?: string;
  bankAccount?: string;
};