import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/site";
import { Eye } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const site = await getSiteSettings();

  const [productCount, categoryCount, subcategoryCount, currencyCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.subcategory.count(),
      prisma.currency.count({ where: { isActive: true } }),
    ]);

  const resourceCards = [
    {
      title: "Productos",
      description: "Gestiona el catalogo y variantes.",
      href: "/admin/products",
      count: productCount,
    },
    {
      title: "Categorias",
      description: "Organiza las categorias principales.",
      href: "/admin/categories",
      count: categoryCount,
    },
    {
      title: "Subcategorias",
      description: "Refina la jerarquia de productos.",
      href: "/admin/subcategories",
      count: subcategoryCount,
    },
    {
      title: "Monedas",
      description: "Configura monedas y formatos de precio.",
      href: "/admin/currencies",
      count: currencyCount,
    },
    {
      title: "Media",
      description: "Biblioteca de imagenes para productos.",
      href: "/admin/media",
    },
    {
      title: "Tema",
      description: "Colores y tipografias del catalogo.",
      href: "/admin/theme",
    },
    {
      title: "Identidad",
      description: "Logo, contacto y redes sociales.",
      href: "/admin/branding",
    },
    {
      title: "Usuarios",
      description: "Administrar miembros con acceso.",
      href: "/admin/users",
    },
    {
      title: "Configuracion",
      description: "Ajustes generales y datos de contacto.",
      href: "/admin/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="md:pt-20 lg:pt-0">
        <div className="p-4 md:p-8 space-y-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 mt-18 md:mt-0">
              <p className="text-3xl font-bold">{site.name}</p>
              <p className="text-sm text-muted-foreground max-w-2xl">
                {site.description || "Sin descripcion"}
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="default">Activo</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/" target="_blank" rel="noreferrer">
                  <Eye className="mr-2 h-4 w-4" />
                  Visitar catalogo
                </Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>
                Contenido principal del catalogo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile label="Productos" value={productCount} />
                <StatTile label="Categorias" value={categoryCount} />
                <StatTile label="Subcategorias" value={subcategoryCount} />
                <StatTile label="Monedas" value={currencyCount} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold">Gestion rapida</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resourceCards.map((resource) => (
                <Card key={resource.title} className="h-full border-border/70">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">
                          {resource.title}
                        </CardTitle>
                        <CardDescription>
                          {resource.description}
                        </CardDescription>
                      </div>
                      {typeof resource.count === "number" && (
                        <Badge variant="outline">{resource.count}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      <Separator />
                      <Button asChild>
                        <Link href={resource.href}>Abrir</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border/70 bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}