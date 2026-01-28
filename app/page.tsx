'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientCard } from '@/components/client-card'
import { UserProfile } from '@/components/user-profile' 
import { NotificationsNav } from '@/components/notifications-nav' 
import { Plus, Search, LayoutDashboard, ArrowUpDown } from 'lucide-react'
import type { Client, Task as TaskType, Comment } from '@/lib/types'
import { differenceInCalendarDays } from 'date-fns'

type ClientWithRelations = Client & {
  tasks: TaskType[]
  comments: Comment[]
}

function DashboardContent() {
  const [clients, setClients] = useState<ClientWithRelations[]>([])
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [activeTab, setActiveTab] = useState('setup')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'deadline' | 'alpha'>('deadline')
  
  const searchParams = useSearchParams()
  const targetClientId = searchParams.get('client_id')
  const targetTab = searchParams.get('tab') as 'tasks' | 'comments' | undefined
  const timestamp = searchParams.get('t')

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data.clients || [])
      
      if (targetClientId) {
          const targetClient = data.clients?.find((c: Client) => c.id === targetClientId)
          if (targetClient && targetClient.status === 'follow_up' && activeTab !== 'follow_up') {
              setActiveTab('follow_up')
          }
      }
    } catch (error) {
      console.error("Failed to fetch", error)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [targetClientId, timestamp])

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

  const processedClients = clients
    .filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      // Ordenação prioritária para Carteira (Active vs Sleeping)
      if (activeTab === 'follow_up') {
         const getUrgency = (client: ClientWithRelations) => {
            const nextTask = client.tasks.filter(t => !t.is_completed).sort((t1, t2) => new Date(t1.deadline || '').getTime() - new Date(t2.deadline || '').getTime())[0]
            if (!nextTask) return 9999 // Sleeping
            const days = differenceInCalendarDays(new Date(nextTask.deadline!), new Date())
            // Se dias <= 2, considera muito urgente (Ativo)
            return days 
         }
         return getUrgency(a) - getUrgency(b)
      }

      if (sortBy === 'alpha') {
        return a.name.localeCompare(b.name)
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
    })

  const setupClients = processedClients.filter(c => c.status === 'setup')
  const followUpClients = processedClients.filter(c => c.status === 'follow_up' || c.status === 'follow-up')

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 text-foreground pb-20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 text-sm">
              S
            </div>
            <span className="font-bold text-base tracking-tight hidden md:inline">Sinapse CRM</span>
          </div>
          
          <div className="flex items-center gap-2">
             <NotificationsNav />
             <div className="h-4 w-[1px] bg-border mx-1"></div>
             <UserProfile />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground text-sm">Gerencie o status dos clientes.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-56">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Buscar..." 
                 className="pl-9 h-9 bg-muted/50 border-transparent focus:bg-background transition-all text-sm"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             
             <div className="relative">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as 'deadline' | 'alpha')}
                  className="h-9 pl-8 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none cursor-pointer hover:bg-accent"
                >
                  <option value="deadline">Prazo</option>
                  <option value="alpha">A-Z</option>
                </select>
                <ArrowUpDown className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
             </div>

             {!isAddingClient && (
                <Button onClick={() => setIsAddingClient(true)} size="sm" className="h-9">
                  <Plus className="w-4 h-4 mr-1" /> Novo
                </Button>
             )}
          </div>
        </div>

        {isAddingClient && (
          <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-primary">
               <LayoutDashboard className="w-4 h-4" /> Adicionar Cliente
            </div>
            <div className="grid gap-3 md:grid-cols-2">
               <Input
                 placeholder="Nome da Empresa / Cliente"
                 value={newClientName}
                 onChange={(e) => setNewClientName(e.target.value)}
                 className="bg-background h-9"
                 autoFocus
               />
               <Input
                 type="email"
                 placeholder="Email de Contato"
                 value={newClientEmail}
                 onChange={(e) => setNewClientEmail(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
                 className="bg-background h-9"
               />
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsAddingClient(false)}>Cancelar</Button>
              <Button onClick={handleAddClient} size="sm">Criar</Button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1 h-9 w-full md:w-auto rounded-lg">
            <TabsTrigger value="setup" className="text-xs px-4 h-7">
              Setup Ativo <span className="ml-2 opacity-50">({setupClients.length})</span>
            </TabsTrigger>
            <TabsTrigger value="follow_up" className="text-xs px-4 h-7">
              Carteira <span className="ml-2 opacity-50">({followUpClients.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-4 space-y-2 min-h-[300px]">
            {setupClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-muted rounded-xl text-muted-foreground bg-muted/5">
                <p className="text-sm">Nenhum cliente em setup.</p>
              </div>
            ) : (
              setupClients.map(client => (
                <ClientCard 
                  key={client.id} 
                  client={client} 
                  onUpdate={fetchClients}
                  initialExpanded={client.id === targetClientId}
                  initialTab={client.id === targetClientId ? targetTab : undefined}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="follow_up" className="mt-4 space-y-2 min-h-[300px]">
            {followUpClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-muted rounded-xl text-muted-foreground bg-muted/5">
                <p className="text-sm">Carteira vazia.</p>
              </div>
            ) : (
              followUpClients.map(client => (
                <ClientCard 
                  key={client.id} 
                  client={client} 
                  onUpdate={fetchClients}
                  initialExpanded={client.id === targetClientId}
                  initialTab={client.id === targetClientId ? targetTab : undefined}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
