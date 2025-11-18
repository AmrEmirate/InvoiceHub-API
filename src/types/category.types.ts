export type TCreateCategoryInput = {
  name: string;
  userId: string;
};

export type TUpdateCategoryInput = Partial<Omit<TCreateCategoryInput, "userId">>;