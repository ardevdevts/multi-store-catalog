import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <p className="text-4xl font-bold mb-4">Producto no encontrado</p>
        <p className="text-muted-foreground mb-8">
          Lo sentimos, el producto que buscas no existe o ha sido eliminado.
        </p>
        <Button asChild>
          <Link href="/">Volver al catálogo</Link>
        </Button>
      </main>
    </div>
  )
}
