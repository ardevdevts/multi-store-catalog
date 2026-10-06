import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminNav } from "@/components/admin/admin-nav";

const outfit = Outfit({ subsets: ["latin"] });

// Disable caching for all admin routes
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Admin - Una Ganga",
  description: "Administración del catálogo",
};

import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify session server-side
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login-admin");
  }

  return (
    <div className={`${outfit.className}`}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <SidebarProvider>
          <AdminNav />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
      <Toaster />
    </div>
  );
}