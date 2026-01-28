'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress' // Se não tiver, use uma div simples
import { 
  ChevronDown, ChevronRight, Clock, CheckCircle2, 
  MessageSquare, MoreVertical, ArrowRight 
} from 'lucide-react'
import { formatDistanceToNow, addDays, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ClientSidePanel } from './client-side-panel' // Novo componente abaixo

export function ClientCard({ client, onUpdate }: { client: any, onUpdate: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  // Cálculos de Setup
  const setupDeadline = addDays(new Date(client.created_at), 7)
  const isOverdue = isPast(setupDeadline) && client.status === 'setup'
  const completedTasks = client.tasks?.filter((t: any) => t.is_completed).length || 0
  const totalTasks = client.tasks?.length || 0
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100
  const allCompleted = totalTasks > 0 && completedTasks === totalTasks

  // Lógica de Follow-up (busca a tarefa ativa)
  const activeFollowUp = client.tasks?.find((t: any) => t.is_follow_up && !t.is_completed)
  
  const handleToggleTask = async (task: any) => {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: task.id,
        is_completed: !task.is_completed
      })
    })
    onUpdate()
  }

  const handleEndSetup = async () => {
    if(!confirm("Deseja finalizar o setup e mover para Follow-up?")) return
    
    // 1. Muda status
    await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'follow_up' })
    })

    // 2. Cria primeira tarefa de follow-up (+15 dias)
    const firstFollowUpDate = addDays(new Date(), 15)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        title: "Primeiro Follow-up (15 dias)",
        is_follow_up: true,
        deadline: firstFollowUpDate.toISOString()
      })
    })

    onUpdate()
  }

  // Visualização Condicional baseada na aba/status
  if (client.status === 'follow_up') {
    // CARD DE FOLLOW-UP
    return (
      <>
        <Card className={`p-4 border-l-4 ${activeFollowUp ? 'border-l-primary shadow-md' : 'border-l-transparent opacity-75'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               {activeFollowUp && (
                 <Checkbox 
                   checked={false} 
                   onCheckedChange={() => handleToggleTask(activeFollowUp)}
                 />
               )}
               <div>
                 <h3 className="font-semibold text-lg cursor-pointer hover:underline" onClick={() => setShowPanel(true)}>
                   {client.name}
                 </h3>
                 <p className="text-sm text-muted-foreground flex items-center gap-1">
                   {activeFollowUp ? (
                     <>Próximo contato: {new Date(activeFollowUp.deadline).toLocaleDateString('pt-BR')}</>
                   ) : (
                     "Sem follow-up pendente"
                   )}
                 </p>
               </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowPanel(true)}>
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </Card>
        {showPanel && <ClientSidePanel client={client} onClose={() => setShowPanel(false)} onUpdate={onUpdate} />}
      </>
    )
  }

  // CARD DE SETUP (Padrão)
  return (
    <>
      <Card className="overflow-hidden mb-3">
        {/* Header do Card */}
        <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-muted rounded">
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 
                  className="font-bold text-lg cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setShowPanel(true)}
                >
                  {client.name}
                </h3>
                {isOverdue && <Badge variant="destructive">Atrasado</Badge>}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(setupDeadline, { addSuffix: true, locale: ptBR })}
                </span>
                <span>•</span>
                <span>{completedTasks}/{totalTasks} tarefas</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="flex-1 md:w-32 h-2 bg-muted rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-500" 
                 style={{ width: `${progress}%` }} 
               />
             </div>
             
             {allCompleted ? (
               <Button size="sm" onClick={handleEndSetup} className="bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse">
                 Finalizar Setup <ArrowRight className="w-4 h-4 ml-1" />
               </Button>
             ) : (
               <Button variant="ghost" size="icon" onClick={() => setShowPanel(true)}>
                 <MessageSquare className="w-4 h-4 text-muted-foreground" />
               </Button>
             )}
          </div>
        </div>

        {/* Lista de Tarefas (Accordion) */}
        {isExpanded && (
          <div className="border-t border-border/50 bg-muted/20 p-4 space-y-2">
            {client.tasks?.sort((a: any, b: any) => a.position - b.position).map((task: any) => (
              <div 
                key={task.id} 
                className={`flex items-center gap-3 p-2 rounded-md hover:bg-background transition-colors ${task.is_completed ? 'opacity-50' : ''}`}
              >
                <Checkbox 
                  checked={task.is_completed} 
                  onCheckedChange={() => handleToggleTask(task)}
                />
                <span className={`text-sm ${task.is_completed ? 'line-through' : ''}`}>
                  {task.title}
                </span>
              </div>
            ))}
            
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground mt-2">
              + Adicionar subtarefa
            </Button>
          </div>
        )}
      </Card>
      
      {showPanel && <ClientSidePanel client={client} onClose={() => setShowPanel(false)} onUpdate={onUpdate} />}
    </>
  )
}
