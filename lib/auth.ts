import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

const isPostgres = process.env.DATABASE_URL?.startsWith("postgres") || false;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: isPostgres ? "postgresql" : "sqlite",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "MEMBER",
        required: false,
      },
      organizationId: {
        type: "string",
        required: false,
      },
      banned: {
        type: "boolean",
        defaultValue: false,
      },
      banReason: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  emailAndPassword: {
    enabled: true,
  },
});

export type Session = typeof auth.$Infer.Session;
