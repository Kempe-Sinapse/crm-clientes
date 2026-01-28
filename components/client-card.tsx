'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress' // Certifique-se de ter este componente ou use a div html abaixo
import { 
  ChevronDown, ChevronRight, Plus, Trash2, Calendar, 
  MessageSquare, Loader2, CheckCircle2 
} from 'lucide-react'
import { addDays, formatDistanceToNow, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Client, Task as TaskType } from '@/lib/types'

interface ClientCardProps {
  client: Client
  onUpdate: () => void
}

export function ClientCard({ client, onUpdate }: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Estado para adicionar nova tarefa (item do checklist)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Cálculos de prazo e progresso
  // Assumindo prazo de 7 dias para setup
  const deadlineDate = addDays(new Date(client.created_at), 7)
  const isOverdue = isPast(deadlineDate) && client.status === 'setup'
  
  // No banco 'tasks' são os itens do checklist principal
  const checklistItems = client.tasks || []
  const completedCount = checklistItems.filter(t => t.is_completed).length // Note: is_completed vs completed
  const totalCount = checklistItems.length
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100
  const isAllDone = totalCount > 0 && completedCount === totalCount

  // Função para adicionar item ao checklist manual
  const handleAddItem = async () => {
    if (!newTaskTitle.trim()) return
    setIsSaving(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          title: newTaskTitle,
          description: '',
          deadline: new Date().toISOString()
        })
      })
      
      if (res.ok) {
        setNewTaskTitle('')
        setIsAddingTask(false)
        onUpdate() // Atualiza a tela
      }
    } catch (error) {
      console.error("Erro ao adicionar:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClient = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Tem certeza que deseja excluir este cliente e todo o histórico?')) {
      await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      onUpdate()
    }
  }

  const handleFinishSetup = async () => {
    if (confirm('Confirmar conclusão do Setup e mover para Follow-up?')) {
        await fetch(`/api/clients/${client.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'follow_up' })
        })
        onUpdate()
    }
  }

  return (
    <Card className={`group overflow-hidden border transition-all hover:shadow-md ${isAllDone ? 'border-emerald-200 bg-emerald-50/10' : 'border-border'}`}>
      {/* Header do Cartão (Tarefa Mãe) */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 text-muted-foreground hover:text-primary transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          <div className="flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center justify-between gap-4">
               <div>
                 <h3 className="font-bold text-lg leading-none cursor-pointer hover:underline decoration-dashed underline-offset-4">
                    {client.name}
                 </h3>
                 <p className="text-sm text-muted-foreground mt-1">{client.email}</p>
               </div>
               
               {/* Badge de Deadline */}
               {client.status === 'setup' && (
                   <Badge variant={isOverdue ? "destructive" : "secondary"} className="whitespace-nowrap">
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
                 {completedCount}/{totalCount}
               </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pl-2 border-l border-border/50">
             <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleDeleteClient}
             >
               <Trash2 className="w-4 h-4" />
             </Button>
          </div>
        </div>

        {/* Corpo do Cartão (Subtarefas/Checklist) */}
        {isExpanded && (
          <div className="mt-6 pl-8 space-y-4 animate-in slide-in-from-top-2 duration-200">
            
            {/* Lista de Itens */}
            <div className="space-y-1">
              {checklistItems
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Mantém ordem de criação
                .map(task => (
                  <ChecklistItem 
                    key={task.id} 
                    task={task} 
                    onUpdate={onUpdate} 
                  />
              ))}
            </div>

            {/* Botão Adicionar Novo Item */}
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
                   {isSaving ? <Loader2 className="w-3 h-3 animate-spin"/> : "Salvar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)}>Cancelar</Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingTask(true)}
                className="text-muted-foreground hover:text-primary -ml-2"
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar subtarefa
              </Button>
            )}

            {/* Botão de Finalizar Setup (Aparece só quando tudo está pronto) */}
            {isAllDone && client.status === 'setup' && (
                <div className="pt-4 border-t border-border mt-4 flex justify-end">
                    <Button onClick={handleFinishSetup} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Encerrar Setup e Mover para Carteira
                    </Button>
                </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// Componente individual de cada item do checklist
function ChecklistItem({ task, onUpdate }: { task: TaskType, onUpdate: () => void }) {
    const [isLoading, setIsLoading] = useState(false)

    const toggleCheck = async () => {
        setIsLoading(true)
        try {
            await fetch('/api/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                // Atenção: o banco pode usar 'is_completed' ou 'completed', verifique seu types.ts
                // Baseado no seu script SQL, é is_completed.
                body: JSON.stringify({ 
                    id: task.id, 
                    // @ts-ignore - forçando compatibilidade caso type esteja diferente
                    completed: !task.is_completed && !task.completed,
                    // Se o endpoint esperar 'is_completed', adicionar aqui:
                    is_completed: !task.is_completed
                }) 
            })
            onUpdate()
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const isDone = task.is_completed || (task as any).completed

    return (
        <div className={`flex items-center gap-3 p-2 rounded-md transition-colors ${isDone ? 'opacity-60 bg-muted/20' : 'hover:bg-muted/40'}`}>
            <Checkbox 
                checked={isDone} 
                onCheckedChange={toggleCheck}
                disabled={isLoading}
            />
            <span className={`text-sm flex-1 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.title}
            </span>
            {/* Se quiser adicionar comentários específicos por item no futuro, o botão iria aqui */}
        </div>
    )
}
