import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relational Seeding, Resend Lifecycle & Edge Proxy Gates (CO3/CO4)",
  description: "Automated Relational Data Seeding, Transactional Event Notification & Secure Full-Stack Endpoints - Next.js, Prisma ORM, Better Auth, Resend, React Email, Mongoose",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
