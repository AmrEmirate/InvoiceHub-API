import { User } from "@prisma/client";

type SafeUser = Omit<User, "password">;

declare global {
  namespace Express {
    export interface Request {
      user?: SafeUser;
    }
  }
}
