import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { getErrorMessage } from "@/lib/error-messages";
import { generateSlug } from "../utils";

export function useCreateCategory() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const createMutation = trpc.admin.categories.create.useMutation();
    const utils = trpc.useUtils();

    const handleCreate = async (onSuccess?: (categoryId: string) => void) => {
        if (!name.trim()) {
            toast.error("Por favor ingresa un nombre para la categoría");
            return;
        }

        const slug = generateSlug(name);
        try {
            const category = await createMutation.mutateAsync({
                name,
                slug,
            });
            setName("");
            setIsOpen(false);
            toast.success("Categoría creada exitosamente");
            void utils.admin.categories.list.invalidate();
            onSuccess?.(category.id);
        } catch (error) {
            toast.error(getErrorMessage(error));
            console.error(error);
        }
    };

    return {
        isOpen,
        setIsOpen,
        name,
        setName,
        handleCreate,
        isLoading: createMutation.isPending,
    };
}

export function useCreateSubcategory() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const createMutation = trpc.admin.subcategories.create.useMutation();
    const utils = trpc.useUtils();

    const handleCreate = async (
        categoryId: string,
        onSuccess?: (subcategoryId: string) => void
    ) => {
        if (!name.trim()) {
            toast.error("Por favor ingresa un nombre para la subcategoría");
            return;
        }
        if (!categoryId) {
            toast.error("Por favor selecciona una categoría primero");
            return;
        }

        const slug = generateSlug(name);
        try {
            const subcategory = await createMutation.mutateAsync({
                name,
                slug,
                categoryId,
            });
            setName("");
            setIsOpen(false);
            toast.success("Subcategoría creada exitosamente");
            void utils.admin.subcategories.list.invalidate();
            onSuccess?.(subcategory.id);
        } catch (error) {
            toast.error(getErrorMessage(error));
            console.error(error);
        }
    };

    return {
        isOpen,
        setIsOpen,
        name,
        setName,
        handleCreate,
        isLoading: createMutation.isPending,
    };
}

export function useCreateCurrency() {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState({
        name: "",
        code: "",
        symbol: "",
    });
    const createMutation = trpc.admin.currencies.create.useMutation();
    const utils = trpc.useUtils();

    const handleCreate = async () => {
        if (!data.name.trim() || !data.code.trim() || !data.symbol.trim()) {
            toast.error("Por favor completa todos los campos de la moneda");
            return;
        }

        try {
            await createMutation.mutateAsync({
                name: data.name,
                code: data.code.toUpperCase(),
                symbol: data.symbol,
            });
            setData({ name: "", code: "", symbol: "" });
            setIsOpen(false);
            toast.success("Moneda creada exitosamente");
            void utils.admin.currencies.list.invalidate();
        } catch (error) {
            toast.error(getErrorMessage(error));
            console.error(error);
        }
    };

    return {
        isOpen,
        setIsOpen,
        data,
        setData,
        handleCreate,
        isLoading: createMutation.isPending,
    };
}
