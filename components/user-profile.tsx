'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function UserProfile() {
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false) // Controla o Dialog
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'onboarding' | 'edit'>('onboarding') // onboarding = forçado, edit = voluntário

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const name = user.user_metadata?.full_name
        if (!name) {
          // Se não tem nome, abre o modo onboarding
          setMode('onboarding')
          setIsOpen(true)
        } else {
          setFullName(name)
        }
      }
    }
    getUser()
  }, [])

  const handleSave = async () => {
    if (!fullName.trim()) return toast.error("Nome é obrigatório")
    
    setLoading(true)
    const updates: any = {
      data: { full_name: fullName }
    }
    
    if (mode === 'edit' && password.trim()) {
      updates.password = password
    }

    const { error } = await supabase.auth.updateUser(updates)

    if (error) {
      toast.error("Erro ao atualizar perfil")
    } else {
      toast.success("Perfil atualizado com sucesso!")
      setIsOpen(false)
      setPassword('')
      // Atualiza estado local
      setUser({ ...user, user_metadata: { ...user.user_metadata, full_name: fullName } })
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (!user) return null

  // Iniciais para o Avatar
  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={fullName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{fullName || 'Usuário'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { setMode('edit'); setIsOpen(true) }}>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={(val) => {
        // No modo onboarding, não pode fechar clicando fora
        if (mode === 'onboarding' && !val) return 
        setIsOpen(val)
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {mode === 'onboarding' ? 'Bem-vindo(a)!' : 'Editar Perfil'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'onboarding' 
                ? 'Para começar, precisamos saber como você gostaria de ser chamado.' 
                : 'Faça alterações no seu perfil aqui.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome de exibição</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: João Silva"
              />
            </div>
            {mode === 'edit' && (
              <div className="grid gap-2">
                <Label htmlFor="password">Nova Senha (Opcional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Deixe em branco para manter"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
