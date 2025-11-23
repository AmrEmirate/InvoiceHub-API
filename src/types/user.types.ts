export type TCreateUserInput = {
  email: string;
  name: string;
  company: string;
  password?: string | null;
  verificationToken?: string | null;
  isVerified?: boolean;
};

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
  avatar?: string;
  password?: string | null;
  verificationToken?: string | null;
  isVerified?: boolean;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
};