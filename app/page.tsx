'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientCard } from '@/components/client-card'
import { Plus, UserCircle, LogOut } from 'lucide-react'
import type { Client } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function Home() {
  const [clients, setClients] = useState<Client[]>([])
  const [user, setUser] = useState<any>(null)
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [activeTab, setActiveTab] = useState('setup')
  
  const supabase = createClient()
  const router = useRouter()

  const fetchClients = async () => {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(data.clients || [])
  }

  useEffect(() => {
    fetchClients()
    
    const getUser = async () => {
        const { data } = await supabase.auth.getUser()
        setUser(data.user)
    }
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    toast.success("Saiu da conta")
    router.refresh()
  }

  const handleAddClient = async () => {
    if (!newClientName.trim() || !newClientEmail.trim()) {
        toast.warning("Preencha nome e email")
        return
    }

    try {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newClientName,
            email: newClientEmail
          })
        })
        
        if(!res.ok) throw new Error()

        setNewClientName('')
        setNewClientEmail('')
        setIsAddingClient(false)
        fetchClients()
        toast.success("Cliente criado com sucesso!")
    } catch {
        toast.error("Erro ao criar cliente")
    }
  }

  // Correção na lógica de filtro: verifica as duas condições dentro do mesmo filter
  const setupClients = clients.filter(c => c.status === 'setup')
  const followUpClients = clients.filter(c => c.status === 'follow_up' || c.status === 'follow-up')

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Navbar Minimalista */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground">S</div>
                 <span className="font-bold text-lg hidden md:block">Sinapse CRM</span>
             </div>
             
             <div className="flex items-center gap-4">
                {user ? (
                   <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
                      <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
                         <LogOut className="w-5 h-5" />
                      </Button>
                   </div>
                ) : (
                   <Button onClick={() => router.push('/login')} size="sm">
                      <UserCircle className="w-4 h-4 mr-2" /> Entrar
                   </Button>
                )}
             </div>
          </div>
      </div>

      <div className="mx-auto max-w-5xl p-6 lg:p-8 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">Painel de Setup</h1>
               <p className="text-muted-foreground mt-1">Gerencie o onboarding e as tarefas dos seus clientes.</p>
            </div>
            {!isAddingClient && (
                <Button onClick={() => setIsAddingClient(true)} className="shadow-lg hover:shadow-primary/20 transition-all">
                  <Plus className="w-4 h-4 mr-2" /> Novo Cliente
                </Button>
            )}
        </div>

        {isAddingClient && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in slide-in-from-top-4">
               <h3 className="font-semibold mb-4">Adicionar Novo Cliente</h3>
               <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Nome da empresa/cliente"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="bg-background"
                  />
                  <Input
                    type="email"
                    placeholder="Email de contato"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
                    className="bg-background"
                  />
               </div>
               <div className="flex gap-2 mt-4 justify-end">
                  <Button variant="ghost" onClick={() => setIsAddingClient(false)}>Cancelar</Button>
                  <Button onClick={handleAddClient}>Confirmar Criação</Button>
               </div>
            </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="setup" className="px-8">
              Setup Ativo
              {setupClients.length > 0 && (
                <span className="ml-2 bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {setupClients.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="follow_up" className="px-8">
              Follow-up
              {followUpClients.length > 0 && (
                <span className="ml-2 bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {followUpClients.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-6 space-y-4 min-h-[300px]">
            {setupClients.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground">
                  <p>Nenhum cliente em fase de setup.</p>
               </div>
            ) : (
              setupClients.map(client => (
                <ClientCard key={client.id} client={client} onUpdate={fetchClients} />
              ))
            )}
          </TabsContent>

          <TabsContent value="follow_up" className="mt-6 space-y-4 min-h-[300px]">
            {followUpClients.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground">
                  <p>Nenhum cliente em follow-up.</p>
               </div>
            ) : (
              followUpClients.map(client => (
                <ClientCard key={client.id} client={client} onUpdate={fetchClients} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
