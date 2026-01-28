'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  ChevronDown, ChevronRight, Plus, Trash2, Calendar, 
  MessageSquare, Clock, CheckCircle2, MoreHorizontal, Pencil, ArrowUp, ArrowDown 
} from 'lucide-react'
import type { Client, Task as TaskType, Comment } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ClientCardProps {
  client: Client & { tasks: TaskType[], comments: Comment[] }
  onUpdate: () => void
}

export function ClientCard({ client, onUpdate }: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'comments'>('tasks')
  
  // Estados de Tarefas
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  
  // Estados de Comentários
  const [newComment, setNewComment] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)

  // Estados de Edição
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Cálculos
  const totalTasks = client.tasks?.length || 0
  const completedTasks = client.tasks?.filter(t => t.is_completed).length || 0
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100
  const isComplete = totalTasks > 0 && completedTasks === totalTasks

  // Cálculo de Deadline (7 dias após criação)
  const deadline = addDays(new Date(client.created_at), 7)
  const daysLeft = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 3600 * 24))

  // --- Handlers de Tarefas ---

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        title: newTaskTitle,
        position: totalTasks // Adiciona no final
      })
    })
    setNewTaskTitle('')
    setIsAddingTask(false)
    onUpdate()
  }

  const handleToggleTask = async (task: TaskType) => {
    const newStatus = !task.is_completed
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, is_completed: newStatus }) // Usando is_completed correto
    })
    
    // Verificar se completou tudo para mover de fase
    if (newStatus && completedTasks + 1 === totalTasks && client.status === 'setup') {
       if(confirm("Setup finalizado! Mover cliente para Carteira?")) {
          await fetch(`/api/clients/${client.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'follow_up' })
          })
       }
    }
    onUpdate()
  }

  const handleUpdateTaskTitle = async (task: TaskType) => {
    if (!editingTitle.trim()) return
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, title: editingTitle })
    })
    setEditingTaskId(null)
    onUpdate()
  }

  // --- Handler de Comentários (No Cliente) ---

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setIsSendingComment(true)
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        content: newComment
      })
    })
    setNewComment('')
    setIsSendingComment(false)
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
        "group relative border-border/40 bg-card/40 hover:bg-card/80 transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden",
        isComplete && "border-emerald-500/20 bg-emerald-500/5"
      )}
    >
      {/* Barra de progresso ultra-fina no topo */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-muted/50 w-full">
        <div 
          className={cn("h-full transition-all duration-500", isComplete ? "bg-emerald-500" : "bg-primary")} 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm hover:bg-muted"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="flex-1 cursor-pointer grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center" onClick={() => setIsExpanded(!isExpanded)}>
            
            {/* Informações do Cliente */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  {client.name}
                  {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </h3>
                {client.status === 'setup' && (
                  <Badge variant="secondary" className={cn("h-5 px-1.5 text-[10px] font-normal", daysLeft < 3 ? "text-red-500 bg-red-500/10" : "text-muted-foreground")}>
                    {daysLeft > 0 ? `${daysLeft}d restantes` : 'Atrasado'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{client.email || 'Sem email'}</p>
            </div>

            {/* Status e Resumo */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
               <div className="flex items-center gap-1.5">
                 <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden md:block">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                 </div>
                 <span className="font-mono">{completedTasks}/{totalTasks}</span>
               </div>
               
               <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{client.comments?.length || 0}</span>
               </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteClient}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Área Expansível */}
        {isExpanded && (
          <div className="mt-4 pt-0 border-t border-border/40 animate-in slide-in-from-top-1 duration-200">
            
            {/* Abas Internas */}
            <div className="flex gap-4 border-b border-border/40 px-2">
               <button 
                 onClick={() => setActiveTab('tasks')}
                 className={cn("text-xs font-medium py-2 border-b-2 transition-colors", activeTab === 'tasks' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
               >
                 Checklist
               </button>
               <button 
                 onClick={() => setActiveTab('comments')}
                 className={cn("text-xs font-medium py-2 border-b-2 transition-colors", activeTab === 'comments' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
               >
                 Comentários ({client.comments?.length || 0})
               </button>
            </div>

            <div className="p-2 md:pl-8 mt-2">
              {/* ABA: TAREFAS */}
              {activeTab === 'tasks' && (
                <div className="space-y-1">
                  {client.tasks?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).map((task, index) => (
                    <div 
                      key={task.id} 
                      className="group/task flex items-center gap-3 p-1.5 rounded-md hover:bg-muted/40 transition-colors"
                    >
                      <Checkbox 
                        checked={task.is_completed} 
                        onCheckedChange={() => handleToggleTask(task)}
                        className="rounded-full w-4 h-4 border-muted-foreground/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex gap-2">
                           <Input 
                             value={editingTitle} 
                             onChange={(e) => setEditingTitle(e.target.value)}
                             className="h-7 text-sm"
                             autoFocus
                             onKeyDown={(e) => e.key === 'Enter' && handleUpdateTaskTitle(task)}
                           />
                           <Button size="icon" className="h-7 w-7" onClick={() => handleUpdateTaskTitle(task)}><CheckCircle2 className="w-3 h-3"/></Button>
                        </div>
                      ) : (
                        <span 
                          onDoubleClick={() => { setEditingTaskId(task.id); setEditingTitle(task.title) }}
                          className={cn(
                            "text-sm flex-1 cursor-text transition-all",
                            task.is_completed ? "line-through text-muted-foreground/60" : "text-foreground"
                          )}
                        >
                          {task.title}
                        </span>
                      )}

                      {/* Botões de Ação da Tarefa */}
                      <div className="opacity-0 group-hover/task:opacity-100 flex items-center gap-1 transition-opacity">
                         <button 
                           onClick={() => { setEditingTaskId(task.id); setEditingTitle(task.title) }}
                           className="text-muted-foreground hover:text-primary p-1"
                         >
                           <Pencil className="w-3 h-3" />
                         </button>
                         {/* Futuramente: Adicionar Arrows para Reorder aqui */}
                      </div>
                    </div>
                  ))}

                  {/* Adicionar Nova Tarefa */}
                  {isAddingTask ? (
                    <div className="flex gap-2 items-center mt-2 pl-1.5">
                      <Input
                        autoFocus
                        placeholder="Nova tarefa..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        className="h-8 text-sm"
                      />
                      <Button size="sm" onClick={handleAddTask} className="h-8 text-xs">Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)} className="h-8 text-xs">X</Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingTask(true)}
                      className="mt-2 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 pl-1.5 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Adicionar item
                    </button>
                  )}
                </div>
              )}

              {/* ABA: COMENTÁRIOS */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                   <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {client.comments?.length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum comentário ainda.</p>
                      )}
                      {client.comments?.map(comment => (
                        <div key={comment.id} className="bg-muted/30 p-2 rounded-md border border-border/30">
                           <div className="flex justify-between items-baseline mb-1">
                              <span className="text-[10px] font-bold text-primary">{comment.author}</span>
                              <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at), { locale: ptBR, addSuffix: true })}</span>
                           </div>
                           <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                   </div>

                   <div className="flex gap-2 items-end">
                      <Textarea 
                        placeholder="Escreva uma observação..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[60px] text-xs resize-none bg-background"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAddComment} disabled={isSendingComment}>
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
