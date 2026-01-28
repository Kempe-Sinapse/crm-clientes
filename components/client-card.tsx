'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react'
import { addDays, formatDistanceToNow, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Client, Task as TaskType } from '@/lib/types'

interface ClientCardProps {
  client: Client
  onUpdate: () => void
}

export function ClientCard({ client, onUpdate }: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Cálculos de Prazo (7 dias a partir da criação)
  const deadlineDate = addDays(new Date(client.created_at), 7)
  const isOverdue = isPast(deadlineDate) && client.status === 'setup'
  
  // Lista de tarefas (Checklist)
  const checklistItems = client.tasks || []
  const completedCount = checklistItems.filter((t: any) => t.is_completed).length
  const totalCount = checklistItems.length
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100
  const isAllDone = totalCount > 0 && completedCount === totalCount

  // Adicionar item manual ao checklist
  const handleAddItem = async () => {
    if (!newTaskTitle.trim()) return
    setIsSaving(true)

    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        title: newTaskTitle,
        deadline: new Date().toISOString()
      })
    })
    
    setNewTaskTitle('')
    setIsAddingTask(false)
    setIsSaving(false)
    onUpdate()
  }

  const handleDeleteClient = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      onUpdate()
    }
  }

  const handleFinishSetup = async () => {
    if (confirm('Mover cliente para carteira de Follow-up?')) {
        await fetch(`/api/clients/${client.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'follow_up' })
        })
        onUpdate()
    }
  }

  return (
    <Card className={`group overflow-hidden border transition-all hover:shadow-md mb-3 ${isAllDone ? 'border-emerald-200 bg-emerald-50/10' : 'border-border'}`}>
      <div className="p-4">
        {/* Cabeçalho: Tarefa Mãe (Cliente) */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 text-muted-foreground hover:text-primary transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          <div className="flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
               <div>
                 <h3 className="font-bold text-lg leading-none cursor-pointer hover:underline decoration-dashed underline-offset-4">
                    {client.name}
                 </h3>
                 <p className="text-sm text-muted-foreground mt-1">{client.email}</p>
               </div>
               
               {client.status === 'setup' && (
                   <Badge variant={isOverdue ? "destructive" : "secondary"} className="w-fit">
                      {isOverdue ? "Atrasado" : formatDistanceToNow(deadlineDate, { locale: ptBR, addSuffix: true })}
                   </Badge>
               )}
            </div>

            {/* Barra de Progresso */}
            <div className="mt-3 flex items-center gap-3">
               <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isAllDone ? 'bg-emerald-500' : 'bg-primary'}`} 
                    style={{ width: `${progress}%` }} 
                  />
               </div>
               <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                 {completedCount}/{totalCount} tarefas
               </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDeleteClient}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Corpo: Checklist (Subtarefas) */}
        {isExpanded && (
          <div className="mt-6 pl-8 space-y-3 animate-in slide-in-from-top-2 duration-200">
            
            <div className="space-y-1">
              {checklistItems
                .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                .map((task: any) => (
                  <ChecklistItem 
                    key={task.id} 
                    task={task} 
                    onUpdate={onUpdate} 
                  />
              ))}
            </div>

            {isAddingTask ? (
              <div className="flex gap-2 items-center mt-2 bg-muted/20 p-2 rounded-md">
                <Input
                  autoFocus
                  placeholder="Nome da subtarefa..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  className="h-8 bg-background"
                />
                <Button size="sm" onClick={handleAddItem} disabled={isSaving}>
                   {isSaving ? "..." : "Salvar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)}>Cancelar</Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingTask(true)}
                className="text-muted-foreground hover:text-primary -ml-2 h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-2" /> Adicionar subtarefa
              </Button>
            )}

            {isAllDone && client.status === 'setup' && (
                <div className="pt-4 border-t border-border mt-4 flex justify-end">
                    <Button onClick={handleFinishSetup} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Encerrar Setup
                    </Button>
                </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function ChecklistItem({ task, onUpdate }: { task: any, onUpdate: () => void }) {
    const [isLoading, setIsLoading] = useState(false)

    const toggleCheck = async () => {
        setIsLoading(true)
        // Correção crítica: usar is_completed para bater com o banco e a API
        const newStatus = !task.is_completed
        await fetch('/api/tasks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: task.id, 
                is_completed: newStatus 
            }) 
        })
        onUpdate()
        setIsLoading(false)
    }

    return (
        <div className={`flex items-center gap-3 p-2 rounded-md transition-colors ${task.is_completed ? 'opacity-60 bg-muted/20' : 'hover:bg-muted/40'}`}>
            <Checkbox 
                checked={task.is_completed} 
                onCheckedChange={toggleCheck}
                disabled={isLoading}
            />
            <span className={`text-sm flex-1 ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.title}
            </span>
        </div>
    )
}
