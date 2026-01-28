'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientCard } from '@/components/client-card'
import { Plus, Search, LayoutDashboard, CheckCircle } from 'lucide-react'
import type { Client } from '@/lib/types'

export default function Home() {
  const [clients, setClients] = useState<Client[]>([])
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [activeTab, setActiveTab] = useState('setup')
  const [search, setSearch] = useState('')

  const fetchClients = async () => {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(data.clients || [])
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleAddClient = async () => {
    if (!newClientName.trim()) return

    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newClientName,
        email: newClientEmail
      })
    })

    setNewClientName('')
    setNewClientEmail('')
    setIsAddingClient(false)
    fetchClients()
  }

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  const setupClients = filteredClients.filter(c => c.status === 'setup')
  const followUpClients = filteredClients.filter(c => c.status === 'follow_up' || c.status === 'follow-up')

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 text-foreground">
      {/* Navbar Sticky com Blur */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
              S
            </div>
            <span className="font-bold text-lg tracking-tight">Sinapse CRM</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Você pode adicionar avatar de usuário aqui no futuro */}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6 lg:p-8 space-y-8">
        
        {/* Header da Página */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel de Setup</h1>
            <p className="text-muted-foreground mt-1 text-sm">Gerencie o onboarding e a esteira de clientes.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Buscar cliente..." 
                 className="pl-9 bg-muted/50 border-transparent focus:bg-background transition-all"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             {!isAddingClient && (
                <Button onClick={() => setIsAddingClient(true)} className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                  <Plus className="w-4 h-4 mr-2" /> Novo
                </Button>
             )}
          </div>
        </div>

        {/* Card de Adicionar Cliente (Inline) */}
        {isAddingClient && (
          <div className="bg-card border border-border/60 rounded-xl p-6 shadow-xl shadow-black/5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-primary">
               <LayoutDashboard className="w-4 h-4" /> Novo Cliente
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                 <label className="text-xs font-medium text-muted-foreground ml-1">Nome da Empresa / Cliente</label>
                 <Input
                   placeholder="Ex: Acme Corp"
                   value={newClientName}
                   onChange={(e) => setNewClientName(e.target.value)}
                   className="bg-background"
                   autoFocus
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-medium text-muted-foreground ml-1">Email de Contato</label>
                 <Input
                   type="email"
                   placeholder="contato@empresa.com"
                   value={newClientEmail}
                   onChange={(e) => setNewClientEmail(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
                   className="bg-background"
                 />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="ghost" onClick={() => setIsAddingClient(false)}>Cancelar</Button>
              <Button onClick={handleAddClient} className="min-w-[120px]">Criar Cliente</Button>
            </div>
          </div>
        )}

        {/* Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1 h-11 w-full md:w-auto rounded-xl">
            <TabsTrigger value="setup" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
              Setup Ativo
              <span className="ml-2 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/10">
                {setupClients.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="follow_up" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
              Carteira / Follow-up
              <span className="ml-2 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/10">
                {followUpClients.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-6 space-y-4 min-h-[300px] animate-in fade-in slide-in-from-left-4 duration-300">
            {setupClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted rounded-xl text-muted-foreground bg-muted/10">
                <CheckCircle className="w-12 h-12 mb-4 opacity-20" />
                <p>Nenhum cliente em fase de setup.</p>
              </div>
            ) : (
              setupClients.map(client => (
                <ClientCard key={client.id} client={client} onUpdate={fetchClients} />
              ))
            )}
          </TabsContent>

          <TabsContent value="follow_up" className="mt-6 space-y-4 min-h-[300px] animate-in fade-in slide-in-from-right-4 duration-300">
            {followUpClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-muted rounded-xl text-muted-foreground bg-muted/10">
                <p>Nenhum cliente na carteira de follow-up.</p>
              </div>
            ) : (
              followUpClients.map(client => (
                <ClientCard key={client.id} client={client} onUpdate={fetchClients} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
