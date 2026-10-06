"use client";

import { useCallback, useState } from "react";
import AdminResource from "@/components/admin/admin-resource";
import { trpc } from "@/trpc/client";
import { generateSlug, sanitizeSlugInput } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type CategoryList = { id: string; name: string };

interface SubcategoryFormProps {
  formData: any;
  setFormData: (data: any) => void;
  dependencies: Record<string, unknown> | null;
}

function SubcategoryForm({
  formData,
  setFormData,
  dependencies,
}: SubcategoryFormProps) {
  const categoryOptions =
    (dependencies?.categoryId as
      | { value: string; label: string; id: string }[]
      | undefined) || [];
  const [manuallyEditedSlug, setManuallyEditedSlug] = useState(false);

  const generatedSlug = generateSlug(formData.name || "");
  const computedManuallyEditedSlug =
    !!formData.slug && formData.slug !== generatedSlug;
  const effectiveManuallyEditedSlug =
    manuallyEditedSlug || computedManuallyEditedSlug;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoría</Label>
        <Select
          value={formData.categoryId || ""}
          onValueChange={(value) =>
            setFormData((prev: any) => ({ ...prev, categoryId: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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

export default function SubcategoriesPage() {
  const catsQuery = trpc.admin.categories.list.useQuery();

  const loadDependencies = useCallback(async () => {
    if (catsQuery.isLoading) await catsQuery.refetch();

    const cats = (catsQuery.data ?? []) as CategoryList[];

    const mapOptions = (list: CategoryList[]) =>
      list.map((c) => ({ value: c.id, label: c.name, id: c.id }));

    return {
      categoryId: mapOptions(cats),
    };
  }, [catsQuery]);

  return (
    <div className="min-h-screen bg-background">
      <main className="md:pt-20 lg:pt-0">
        <div className="">
          <AdminResource
            title="Subcategorías"
            fetchUrl="/api/admin/subcategories"
            columns={[
              { header: "Nombre", accessor: "name", sortable: true },
              { header: "Slug", accessor: "slug", sortable: true },
              {
                header: "Categoría",
                accessor: "category.name",
                sortable: true,
              },
              {
                header: "Productos",
                render: (s: any) => s._count?.products || 0,
                sortable: false,
              },
              {
                header: "Estado",
                render: (s: any) => (s.isActive ? "Activo" : "Inactivo"),
                sortable: false,
              },
            ]}
            renderForm={({ formData, setFormData, dependencies }) => (
              <SubcategoryForm
                formData={formData}
                setFormData={setFormData}
                dependencies={dependencies}
              />
            )}
            loadDependencies={loadDependencies}
            newButtonLabel="Agregar Subcategoría"
            searchKeys={["name"]}
          />
        </div>
      </main>
    </div>
  );
}
