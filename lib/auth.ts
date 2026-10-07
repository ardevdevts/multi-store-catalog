import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  databaseHooks: {
    user: {
      create: {
        // Sign-up closes for good once the first user exists; only the
        // first-run setup flow may create accounts.
        before: async () => {
          const userCount = await prisma.user.count();
          if (userCount > 0) {
            throw new APIError("FORBIDDEN", {
              message: "El registro de usuarios está deshabilitado",
            });
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "EDITOR",
        input: false,
        returned: true,
      },
      },
  },
});
