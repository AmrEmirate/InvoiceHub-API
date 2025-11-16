// Tipe untuk membuat user baru di repo
export type TCreateUserInput = {
  email: string;
  name: string;
  company: string;
  password?: string | null; // <-- UBAH INI
  verificationToken?: string | null; // <-- Tambahkan ini
  isVerified?: boolean; // <-- Tambahkan ini
};

// Tipe untuk update profile (Tidak berubah)
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