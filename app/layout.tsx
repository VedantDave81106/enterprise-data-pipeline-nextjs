import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relational Seeding, Resend Emails & Role-Based Access",
  description: "Full-Stack Next.js application with Prisma ORM, Better Auth RBAC, Resend Transactional Emails, and Webhook Ingestion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
