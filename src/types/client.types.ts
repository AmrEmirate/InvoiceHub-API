export type TCreateClientInput = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  paymentPreferences?: string;
  userId: string;
};

export type TUpdateClientInput = Partial<Omit<TCreateClientInput, "userId">>;