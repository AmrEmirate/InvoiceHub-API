import { sign } from "jsonwebtoken";

export const createToken = (account: any, expiresIn: any) => {
  return sign(
    {
      id: account.id,
      role: account.role,
    },
    "secret",
    {
      expiresIn,
    }
  );
};
