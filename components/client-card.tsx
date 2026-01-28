'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, ChevronRight, Plus, Trash2, Calendar, 
  MessageSquare, Clock, CheckCircle2, Circle 
} from 'lucide-react'
import type { Client, Task as TaskType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ClientCardProps {
  client: Client
  onUpdate: () => void
}

export function ClientCard({ client, onUpdate }: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Cálculos
  const totalTasks = client.tasks?.length || 0
  const completedTasks = client.tasks?.filter(t => t.completed).length || 0
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100
  const isComplete = totalTasks > 0 && completedTasks === totalTasks

  // Função fictícia de deadline para exemplo (idealmente viria do banco)
  const deadlineDate = new Date(client.created_at)
  deadlineDate.setDate(deadlineDate.getDate() + 7)
  const daysLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    setIsSaving(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        title: newTaskTitle,
        description: '',
        deadline: new Date().toISOString()
      })
    })
    setNewTaskTitle('')
    setIsAddingTask(false)
    setIsSaving(false)
    onUpdate()
  }

  const handleToggleTask = async (task: TaskType) => {
    const newCompleted = !task.completed
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: task.id,
        completed: newCompleted,
        title: task.title
      })
    })
    
    // Lógica de mover para follow-up se tudo estiver completo
    const updatedTasks = client.tasks.map(t => t.id === task.id ? {...t, completed: newCompleted} : t)
    const allDone = updatedTasks.every(t => t.completed)
    
    if (allDone && client.status === 'setup') {
       if(confirm("Todas tarefas concluídas! Mover para Follow-up?")) {
          await fetch(`/api/clients/${client.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'follow_up' })
          })
       }
    }
    onUpdate()
  }

  const handleDeleteClient = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      onUpdate()
    }
  }

  return (
    <Card 
      className={cn(
        "group relative border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20",
        isComplete && "border-emerald-500/20 bg-emerald-500/5"
      )}
    >
      {/* Barra de progresso sutil no topo */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-muted overflow-hidden rounded-t-xl">
        <div 
          className={cn("h-full transition-all duration-500", isComplete ? "bg-emerald-500" : "bg-primary")} 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-md"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          <div className="flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                  {client.name}
                  {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </h3>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>

              <div className="flex items-center gap-3">
                {client.status === 'setup' && (
                  <Badge variant="secondary" className={cn("font-mono text-xs", daysLeft < 3 ? "text-red-400 bg-red-400/10" : "text-muted-foreground")}>
                    <Clock className="w-3 h-3 mr-1" />
                    {daysLeft > 0 ? `${daysLeft} dias` : 'Atrasado'}
                  </Badge>
                )}
                <div className="flex flex-col items-end">
                   <span className="text-xs font-medium text-muted-foreground">
                     {completedTasks}/{totalTasks}
                   </span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteClient}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Área Expansível */}
        <div 
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isExpanded ? "grid-rows-[1fr] mt-6 opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden space-y-3 pl-2 md:pl-10">
            {/* Lista de Tarefas */}
            <div className="space-y-1">
              {client.tasks?.sort((a, b) => (a.position || 0) - (b.position || 0)).map(task => (
                <div 
                  key={task.id} 
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-all border border-transparent group/task",
                    task.completed 
                      ? "opacity-60 hover:opacity-100" 
                      : "hover:bg-muted/50 hover:border-border/50 bg-card/30"
                  )}
                >
                  <div className="relative flex items-center justify-center">
                    <Checkbox 
                      checked={task.completed} 
                      onCheckedChange={() => handleToggleTask(task)}
                      className={cn(
                        "transition-all data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
                        "w-5 h-5 rounded-full" // Estilo circular
                      )}
                    />
                  </div>
                  
                  <span className={cn(
                    "text-sm flex-1 transition-all",
                    task.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"
                  )}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Input de Nova Tarefa */}
            {isAddingTask ? (
              <div className="flex gap-2 items-center mt-4 animate-in fade-in slide-in-from-top-1">
                <Input
                  autoFocus
                  placeholder="Nome da nova tarefa..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  className="h-9 bg-background/50 border-primary/30 focus-visible:ring-primary/20"
                />
                <Button size="sm" onClick={handleAddTask} disabled={isSaving}>
                   {isSaving ? "..." : "Salvar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)}>Cancelar</Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingTask(true)}
                className="mt-2 text-muted-foreground hover:text-primary pl-2 h-8 text-xs uppercase tracking-wide font-semibold"
              >
                <Plus className="w-3 h-3 mr-2" /> Adicionar tarefa
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
