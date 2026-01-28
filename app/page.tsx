'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientCard } from '@/components/client-card'
import { Plus } from 'lucide-react'
import type { Client } from '@/lib/types'

export default function Home() {
  const [clients, setClients] = useState<Client[]>([])
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [activeTab, setActiveTab] = useState('setup')

  const fetchClients = async () => {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(data.clients || [])
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleAddClient = async () => {
    if (!newClientName.trim() || !newClientEmail.trim()) return

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

  const setupClients = clients.filter(c => c.status === 'setup')
  const followUpClients = clients.filter(c => c.status === 'follow_up')

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Gestão de Clientes</h1>
          <p className="text-muted-foreground mt-2">
            Organize o onboarding e acompanhamento dos seus clientes
          </p>
        </header>

        <div className="mb-6">
          {isAddingClient ? (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <Input
                placeholder="Nome do cliente"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email do cliente"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
              />
              <div className="flex gap-2">
                <Button onClick={handleAddClient}>Adicionar Cliente</Button>
                <Button onClick={() => setIsAddingClient(false)} variant="outline">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAddingClient(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="setup" className="relative">
              Setup
              {setupClients.length > 0 && (
                <span className="ml-2 bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                  {setupClients.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="follow_up" className="relative">
              Follow-up
              {followUpClients.length > 0 && (
                <span className="ml-2 bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                  {followUpClients.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-6 space-y-4">
            {setupClients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum cliente em setup</p>
              </div>
            ) : (
              setupClients.map(client => (
                <ClientCard key={client.id} client={client} onUpdate={fetchClients} />
              ))
            )}
          </TabsContent>

          <TabsContent value="follow_up" className="mt-6 space-y-4">
            {followUpClients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum cliente em follow-up</p>
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
