"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Trash } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type Media = {
  id: string;
  alt: string;
  url: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  stat?: {
    size: number;
    lastModified: Date;
    metaData: Record<string, any>;
  } | null;
};

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function MediaPage() {
  const storeBasePath = "/admin";

  const queryClient = useQueryClient();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data, isLoading, isError } = trpc.admin.media.list.useQuery();

  const { data: mediaDetails, isLoading: detailsLoading } =
    trpc.admin.media.get.useQuery(selectedMedia?.id ?? "", {
      enabled: !!selectedMedia && detailsOpen,
    });

  const updateMutation = trpc.admin.media.update.useMutation({
    onSuccess: () => {
      toast.success("Medio actualizado exitosamente");
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(`Error al actualizar medio: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.media.delete.useMutation({
    onSuccess: () => {
      toast.success("Medio eliminado exitosamente");
      setDeleteOpen(false);
      setSelectedMedia(null);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(`${error.message}`);
    },
  });

  const handleUpdateAlt = () => {
    if (!selectedMedia || !mediaDetails) return;
    const newAlt = (document.getElementById("alt-text") as HTMLInputElement)
      .value;
    if (newAlt !== mediaDetails.alt) {
      updateMutation.mutate({ id: selectedMedia.id, alt: newAlt });
    }
    setDetailsOpen(false);
  };

  const handleDelete = () => {
    if (!selectedMedia) return;
    deleteMutation.mutate(selectedMedia.id);
  };

  const Content = (
    <>
      {detailsLoading || !mediaDetails ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative aspect-square bg-muted">
            <Image
              src={mediaDetails.url}
              alt={mediaDetails.alt}
              fill
              className="object-contain"
            />
          </div>
          <div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="alt-text">Texto Alternativo</Label>
                <Input id="alt-text" defaultValue={mediaDetails.alt} />
              </div>
              <div>
                <Label>URL</Label>
                <Input readOnly value={mediaDetails.url} />
              </div>
              {mediaDetails.product && (
                <div>
                  <Label>Producto Relacionado</Label>
                  <div className="text-sm text-blue-500 hover:underline">
                    <Link
                      href={`${storeBasePath}/products/${mediaDetails.product.id}`}
                    >
                      {mediaDetails.product.name}
                    </Link>
                  </div>
                </div>
              )}
              {mediaDetails.stat && (
                <>
                  <div>
                    <Label>Tamaño del Archivo</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(mediaDetails.stat.size)}
                    </p>
                  </div>
                  <div>
                    <Label>Última Modificación</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        mediaDetails.stat.lastModified,
                      ).toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="mt-6 gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setDetailsOpen(false);
                  setDeleteOpen(true);
                }}
              >
                <Trash className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
              <Button onClick={handleUpdateAlt}>Guardar cambios</Button>
            </DialogFooter>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="md:pt-20 lg:pt-0">
        <div className="p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <p className="text-3xl font-bold">Medios</p>
            {/* TODO: Add Upload Button and functionality */}
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-destructive">Error al cargar medios.</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data?.docs.map((media) => (
              <div
                key={media.id}
                className="relative aspect-square overflow-hidden group cursor-pointer"
                onClick={() => {
                  setSelectedMedia(media as Media);
                  setDetailsOpen(true);
                }}
              >
                <Image
                  src={media.url}
                  alt={media.alt}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-white text-center p-2">
                    <p className="text-sm font-semibold truncate">
                      {media.alt}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {isMobile ? (
        <Drawer open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Detalles del Medio</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto flex-1">{Content}</div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalles del Medio</DialogTitle>
            </DialogHeader>
            {Content}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este medio? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
