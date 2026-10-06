"use client";

import { useState } from "react";
import AdminResource from "@/components/admin/admin-resource";
import { IconPicker, IconName } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { generateSlug, sanitizeSlugInput } from "@/lib/utils";

interface CategoryFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

function CategoryForm({ formData, setFormData }: CategoryFormProps) {
  const [manuallyEditedSlug, setManuallyEditedSlug] = useState(false);
  const [iconMode, setIconMode] = useState<"picker" | "custom">("picker");

  // Compute whether the slug appears to have been manually edited and whether the icon is a custom SVG.
  // Avoid calling setState inside effects by deriving values from `formData` and combining with user state.
  const generatedSlug = generateSlug(formData.name || "");
  const computedManuallyEditedSlug =
    !!formData.slug && formData.slug !== generatedSlug;
  const effectiveManuallyEditedSlug =
    manuallyEditedSlug || computedManuallyEditedSlug;

  const isCustomSvg =
    !!formData.icon && formData.icon.trim().startsWith("<svg");
  const displayIconMode = isCustomSvg ? "custom" : iconMode;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={String(formData.name ?? "")}
          onChange={(e) => {
            const name = e.target.value;
            setFormData((prev: any) => ({
              ...prev,
              name,
              slug: effectiveManuallyEditedSlug
                ? prev.slug
                : generateSlug(name),
            }));
          }}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={String(formData.slug ?? "")}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              setManuallyEditedSlug(false);
              setFormData((prev: any) => ({
                ...prev,
                slug: generateSlug(prev.name || ""),
              }));
            } else {
              setManuallyEditedSlug(true);
              setFormData((prev: any) => ({
                ...prev,
                slug: sanitizeSlugInput(value),
              }));
            }
          }}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          value={String(formData.description ?? "")}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          className="w-full border p-2"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Icono</Label>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setIconMode("picker")}
              className={`px-3 py-1 ${displayIconMode === "picker"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              Selector de Iconos
            </button>
            <button
              type="button"
              onClick={() => setIconMode("custom")}
              className={`px-3 py-1 ${displayIconMode === "custom"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              Subir SVG
            </button>
          </div>
        </div>

        {displayIconMode === "picker" ? (
          <IconPicker
            value={
              !isCustomSvg ? (formData.icon as IconName | undefined) : undefined
            }
            onValueChange={(icon) =>
              setFormData((prev: any) => ({ ...prev, icon }))
            }
          />
        ) : (
          <div className="space-y-2">
            <div className="flex flex-col gap-2">
              <Input
                id="customSvg"
                type="file"
                accept=".svg"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (!file.name.endsWith(".svg")) {
                      alert("Por favor sube un archivo SVG");
                      return;
                    }
                    const text = await file.text();
                    setFormData((prev: any) => ({ ...prev, icon: text }));
                  }
                }}
                className="cursor-pointer"
              />
              {isCustomSvg && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev: any) => ({ ...prev, icon: "" }))
                  }
                  className="text-sm text-destructive hover:underline self-start"
                >
                  Eliminar SVG
                </button>
              )}
            </div>
            {isCustomSvg && (
              <div className="flex items-center gap-2">
                <Label>Vista previa:</Label>
                <div
                  className="w-8 h-8 flex items-center justify-center border p-1"
                  dangerouslySetInnerHTML={{ __html: formData.icon }}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={!!formData.isActive}
          onCheckedChange={(val) =>
            setFormData((prev: any) => ({ ...prev, isActive: val }))
          }
        />
        <Label htmlFor="isActive">Activo</Label>
      </div>
    </>
  );
}

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="md:pt-20 lg:pt-0">
        <div className="">
          <AdminResource
            title="Categorías"
            fetchUrl="/api/admin/categories"
            columns={[
              { header: "Nombre", accessor: "name", sortable: true },
              {
                header: "Slug",
                accessor: "slug",
                className: "text-muted-foreground",
                sortable: true,
              },
              {
                header: "Productos",
                render: (x: any) => x._count?.products || 0,
                sortable: false,
              },
              {
                header: "Estado",
                render: (x: any) => (x.isActive ? "Activo" : "Inactivo"),
                sortable: false,
              },
            ]}
            renderForm={({ formData, setFormData }) => (
              <CategoryForm formData={formData} setFormData={setFormData} />
            )}
            searchKeys={["name", "slug"]}
            newButtonLabel="Agregar Categoría"
          />
        </div>
      </main>
    </div>
  );
}
