'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientCard } from '@/components/client-card'
import { Plus, LayoutDashboard } from 'lucide-react'
import type { Client } from '@/lib/types'

export default function Home() {
  const [clients, setClients] = useState<Client[]>([])
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [activeTab, setActiveTab] = useState('setup')
  const [loading, setLoading] = useState(false)

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      if (data.clients) setClients(data.clients)
    } catch (e) {
      console.error("Erro ao buscar clientes", e)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleAddClient = async () => {
    if (!newClientName.trim()) return
    setLoading(true)

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
    setLoading(false)
    fetchClients()
  }

  const setupClients = clients.filter(c => c.status === 'setup')
  const followUpClients = clients.filter(c => c.status === 'follow_up' || c.status === 'follow-up')

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-card">
          <div className="mx-auto max-w-5xl px-6 h-16 flex items-center gap-3">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                S
             </div>
             <h1 className="font-bold text-xl">Sinapse CRM</h1>
          </div>
      </div>

      <div className="mx-auto max-w-5xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <h2 className="text-2xl font-bold tracking-tight">Painel de Gestão</h2>
               <p className="text-muted-foreground">Gerencie o setup e acompanhamento dos clientes.</p>
            </div>
            
            {!isAddingClient && (
                <Button onClick={() => setIsAddingClient(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Novo Cliente
                </Button>
            )}
        </div>

        {isAddingClient && (
            <div className="bg-card border rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
               <h3 className="font-semibold mb-4 flex items-center gap-2">
                 <LayoutDashboard className="w-4 h-4"/> Adicionar Cliente
               </h3>
               <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Nome da empresa/cliente"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="bg-background"
                    autoFocus
                  />
                  <Input
                    type="email"
                    placeholder="Email de contato (opcional)"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
                    className="bg-background"
                  />
               </div>
               <div className="flex gap-2 mt-4 justify-end">
                  <Button variant="ghost" onClick={() => setIsAddingClient(false)}>Cancelar</Button>
                  <Button onClick={handleAddClient} disabled={loading}>
                    {loading ? "Criando..." : "Confirmar"}
                  </Button>
               </div>
            </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted p-1 rounded-lg w-full max-w-[400px] grid grid-cols-2">
            <TabsTrigger value="setup">Setup Ativo ({setupClients.length})</TabsTrigger>
            <TabsTrigger value="follow_up">Carteira ({followUpClients.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-6 space-y-4">
            {setupClients.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    Nenhum cliente em fase de setup.
                </p>
            ) : (
                setupClients.map(client => (
                    <ClientCard key={client.id} client={client} onUpdate={fetchClients} />
                ))
            )}
          </TabsContent>

          <TabsContent value="follow_up" className="mt-6 space-y-4">
            {followUpClients.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    Carteira vazia.
                </p>
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
