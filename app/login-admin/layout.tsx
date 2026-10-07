import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso - Una Ganga",
  description: "Inicia sesión para gestionar tu catálogo",
};

import "../globals.css";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect("/admin");
  }
  return <>{children}</>;
}
