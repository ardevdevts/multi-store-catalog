"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  FolderTree,
  LogOut,
  ImageIcon,
  Users,
  Settings,
  Palette,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { Role } from "@/generated/prisma/enums";
import { trpc } from "@/trpc/client";
import { LogoutDialog } from "@/components/ui/logout-dialog";
import Image from "next/image";

export function AdminNav() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data: site } = trpc.admin.site.get.useQuery();
  const branding = (site?.theme as { branding?: { logoUrl?: string; logoAlt?: string } } | undefined)
    ?.branding;

  const navigation = [
    {
      name: "Panel de Control",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Productos",
      href: "/admin/products",
      icon: Package,
    },
    {
      name: "Categorías",
      href: "/admin/categories",
      icon: FolderTree,
    },
    {
      name: "Subcategorías",
      href: "/admin/subcategories",
      icon: FolderTree,
    },
    {
      name: "Media",
      href: "/admin/media",
      icon: ImageIcon,
    },
    {
      name: "Monedas",
      href: "/admin/currencies",
      icon: DollarSign,
    },
    {
      name: "Tema",
      href: "/admin/theme",
      icon: Palette,
    },
    {
      name: "Identidad",
      href: "/admin/branding",
      icon: Store,
    },
  ];

  const adminNavigation = [
    {
      name: "Usuarios",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Configuración",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    await authClient.signOut();
    setIsDialogOpen(false);
    router.push("/login-admin");
  };

  const isActivePath = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile header: we keep a small top bar with a trigger for mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-border p-4">
        <div className="flex items-center">
          <SidebarTrigger />
          <p className="text-xl font-bold px-4">Panel del Catálogo</p>
        </div>
      </div>

      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="">
          <button
            onClick={() => router.push("/admin")}
            className="shrink-0 cursor-pointer flex flex-row items-center"
            aria-label="Ir a inicio"
          >
            <div className="relative">
              {branding?.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt={branding.logoAlt || "Logo"}
                  className="object-cover p-1"
                  width={92}
                  height={92}
                />
              ) : (
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">No logo</span>
                </div>
              )}
            </div>
            {site?.name && (
              <div className="flex flex-row text-md font-bold text-foreground px-4 items-center">
                <p>{site.name}</p>
              </div>
            )}
          </button>
        </SidebarHeader>

        <SidebarContent className="px-4">
          <SidebarMenu>
            {navigation.map((item) => {
              const isActive = isActivePath(item.href, item.exact);
              return (
                <SidebarMenuItem key={item.name} className="">
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="h-12 text-xl"
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
            {session?.user?.role === Role.ADMIN &&
              adminNavigation.map((item) => {
                const isActive = isActivePath(item.href);

                return (
                  <SidebarMenuItem key={item.name} className="">
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-12 text-xl"
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border">
          <Button
            variant="default"
            className="w-full justify-start gap-3 bg-transparent hover:bg-muted text-foreground"
            onClick={() => setIsDialogOpen(true)}
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </Button>
        </SidebarFooter>
      </Sidebar >
      <LogoutDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleLogout}
      />
    </>
  );
}