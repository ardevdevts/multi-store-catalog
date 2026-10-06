"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoreErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const isDatabaseError = (error: Error): boolean => {
  return (
    error.name === "DatabaseUnavailableError" ||
    error.message.includes("DATABASE_TEMPORARILY_UNAVAILABLE") ||
    error.message.includes("Can't reach database server")
  );
};

export default function StoreErrorBoundary({
  error,
  reset,
}: StoreErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const showDatabaseMessage = isDatabaseError(error);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <main className="w-full max-w-2xl border border-border bg-card p-8 space-y-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-1" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {showDatabaseMessage
                ? "La tienda esta temporalmente no disponible"
                : "Ocurrio un error inesperado"}
            </h1>
            <p className="text-muted-foreground">
              {showDatabaseMessage
                ? "Intentamos reconectar varias veces, pero no fue posible. Vuelve a intentarlo en unos segundos."
                : "Tuvimos un problema al cargar esta pagina. Puedes intentar nuevamente."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={reset}>
            <RefreshCcw className="h-4 w-4" />
            Reintentar
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <div className="border border-border bg-background p-3 text-xs text-muted-foreground font-mono break-all">
            {error.message}
            {error.digest ? `\nDigest: ${error.digest}` : ""}
          </div>
        )}
      </main>
    </div>
  );
}
