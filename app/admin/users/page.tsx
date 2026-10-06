'use client'

import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Role } from '@/generated/prisma/enums'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { PlusIcon, ShieldCheckIcon, UserIcon, TrashIcon, XIcon, LoaderIcon } from 'lucide-react'

export default function UsersPage() {
    const { data: users, isLoading, error, refetch } = trpc.admin.users.list.useQuery()
    const { data: session } = authClient.useSession()
    const updateUserRole = trpc.admin.users.updateRole.useMutation({
        onSuccess: () => {
            toast.success('Rol de usuario actualizado')
            refetch()
        },
        onError: (err) => {
            toast.error('Error al actualizar el rol de usuario', { description: err.message })
        }
    })
    const deleteUser = trpc.admin.users.delete.useMutation({
        onSuccess: () => {
            toast.success('Usuario eliminado')
            refetch()
        },
        onError: (err) => {
            toast.error('Error al eliminar usuario', { description: err.message })
        }
    })

    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [role, setRole] = useState<Role>(Role.EDITOR)

    const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

    const createUser = trpc.admin.users.create.useMutation({
        onSuccess: () => {
            toast.success('Usuario creado')
            refetch()
            setOpen(false)
            setEmail('')
            setPassword('')
            setName('')
            setRole(Role.EDITOR)
        },
        onError: (err) => {
            toast.error('Error al crear usuario', { description: err.message })
        }
    })

    if (isLoading) return <div className="flex items-center justify-center p-8"><LoaderIcon className="animate-spin w-6 h-6 mr-2" />Cargando...</div>
    if (error) return <div>Error: {error.message}</div>

    return (
        <div className="md:mt-20 p-4 md:p-8">
            <p className="text-3xl font-bold mb-6">Gestión de Usuarios</p>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button><PlusIcon className="w-4 h-4 mr-2" />Crear Usuario</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="password">Contraseña</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="role">Rol</Label>
                            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={Role.EDITOR}>Editor</SelectItem>
                                    <SelectItem value={Role.ADMIN}>Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={() => createUser.mutate({ email, password, name, role })}><PlusIcon className="w-4 h-4 mr-2" />Crear</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Correo Electrónico</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users?.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell className="space-x-2">
                                {user.id !== session?.user?.id && (
                                    <>
                                        {user.role === Role.EDITOR && (
                                            <Button
                                                size="sm"
                                                onClick={() => updateUserRole.mutate({ id: user.id, role: Role.ADMIN })}
                                            >
                                                <ShieldCheckIcon className="w-4 h-4 mr-2" />Hacer Administrador
                                            </Button>
                                        )}
                                        {user.role === Role.ADMIN && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateUserRole.mutate({ id: user.id, role: Role.EDITOR })}
                                            >
                                                <UserIcon className="w-4 h-4 mr-2" />Hacer Editor
                                            </Button>
                                        )}
                                        <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="destructive" onClick={() => setDeleteUserId(user.id)}>
                                                    <TrashIcon className="w-4 h-4 mr-2" />Eliminar
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Confirmar Eliminación</DialogTitle>
                                                    <DialogDescription>
                                                        ¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setDeleteUserId(null)}><XIcon className="w-4 h-4 mr-2" />Cancelar</Button>
                                                    <Button variant="destructive" onClick={() => { deleteUser.mutate(deleteUserId!); setDeleteUserId(null); }}><TrashIcon className="w-4 h-4 mr-2" />Eliminar</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
