// File: src/types/client.types.ts

// Data yang dibutuhkan untuk membuat client baru
export type TCreateClientInput = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  paymentPreferences?: string;
  userId: string; // ID dari user yang memiliki client ini
};

// Data yang bisa di-update
export type TUpdateClientInput = Partial<Omit<TCreateClientInput, "userId">>;