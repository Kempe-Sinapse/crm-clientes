'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  ChevronDown, ChevronRight, Plus, Trash2, Calendar, 
  CheckCircle2, GripVertical, Pencil, ArrowUp, Clock,
  ArrowRightCircle
} from 'lucide-react'
import type { Client, Task as TaskType, Comment } from '@/lib/types'
import { cn } from '@/lib/utils'
import { addDays, format, differenceInCalendarDays, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner' // Adicionado para feedback visual

// DND Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableTaskItem({ task, onToggle, onEdit }: { task: TaskType, onToggle: (t: TaskType) => void, onEdit: (t: TaskType, title: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)

  const handleSave = () => {
    onEdit(task, editTitle)
    setIsEditing(false)
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "group/task flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/40 transition-colors bg-card/50 border border-transparent hover:border-border/30",
        task.is_completed && "opacity-60 bg-transparent"
      )}
    >
      <button {...attributes} {...listeners} className="opacity-0 group-hover/task:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none p-0.5">
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <Checkbox 
        checked={task.is_completed} 
        onCheckedChange={() => onToggle(task)}
        className="rounded-full w-4 h-4 border-muted-foreground/40 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
      />
      
      {isEditing ? (
        <div className="flex-1 flex gap-2">
           <Input 
             value={editTitle} 
             onChange={(e) => setEditTitle(e.target.value)}
             className="h-6 text-xs"
             autoFocus
             onKeyDown={(e) => e.key === 'Enter' && handleSave()}
           />
           <Button size="icon" className="h-6 w-6" onClick={handleSave}><CheckCircle2 className="w-3 h-3"/></Button>
        </div>
      ) : (
        <span 
          onDoubleClick={() => setIsEditing(true)}
          className={cn(
            "text-sm flex-1 cursor-text transition-all truncate select-none",
            task.is_completed ? "line-through text-muted-foreground/60" : "text-foreground font-medium"
          )}
        >
          {task.title}
        </span>
      )}

      <button 
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover/task:opacity-100 text-muted-foreground hover:text-primary p-1 transition-opacity"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  )
}

interface ClientCardProps {
  client: Client & { tasks: TaskType[], comments: Comment[] }
  onUpdate: () => void
  initialExpanded?: boolean
  initialTab?: 'tasks' | 'comments'
}

export function ClientCard({ client, onUpdate, initialExpanded = false, initialTab = 'tasks' }: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const [activeTab, setActiveTab] = useState<'tasks' | 'comments'>(initialTab)
  const [localTasks, setLocalTasks] = useState<TaskType[]>(client.tasks || [])
  const commentsEndRef = useRef<HTMLDivElement>(null) 
  
  useEffect(() => {
    setLocalTasks(client.tasks?.sort((a, b) => (a.position || 0) - (b.position || 0)) || [])
  }, [client.tasks])

  useEffect(() => {
    if (initialExpanded) {
        setIsExpanded(true)
        if (initialTab) setActiveTab(initialTab)
        
        const element = document.getElementById(`client-${client.id}`)
        if (element) {
            setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
        }
    }
  }, [initialExpanded, initialTab, client.id])

  useEffect(() => {
    if (activeTab === 'comments' && isExpanded) {
        setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
    }
  }, [activeTab, isExpanded, client.comments])

  // Estados
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [isMoving, setIsMoving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const totalTasks = localTasks.length
  const completedTasks = localTasks.filter(t => t.is_completed).length
  const isComplete = totalTasks > 0 && completedTasks === totalTasks
  
  const startDate = new Date(client.created_at)
  const deadlineDate = addDays(startDate, 7)
  const daysLeft = differenceInCalendarDays(deadlineDate, new Date())
  
  const getDeadlineStyles = () => {
    if (client.status !== 'setup') return "border-border text-muted-foreground"
    if (daysLeft < 0) return "bg-red-950/30 border-red-900 text-red-500 shadow-[0_0_10px_rgba(220,38,38,0.4)] animate-pulse"
    if (daysLeft <= 2) return "bg-red-900/20 border-red-800 text-red-400 shadow-[0_0_8px_rgba(220,38,38,0.2)]"
    if (daysLeft <= 4) return "bg-orange-900/10 border-orange-800/50 text-orange-400 shadow-sm"
    return "bg-secondary/50 border-border text-muted-foreground"
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setLocalTasks((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      const newOrder = arrayMove(items, oldIndex, newIndex)
      
      const updates = newOrder.map((task, index) => 
        fetch('/api/tasks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: task.id, position: index })
        })
      )
      Promise.all(updates).then(() => onUpdate())
      return newOrder
    })
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    const optimisticTask = {
        id: 'temp-' + Date.now(),
        title: newTaskTitle,
        is_completed: false,
        position: localTasks.length,
        client_id: client.id
    } as TaskType
    setLocalTasks([...localTasks, optimisticTask])
    setNewTaskTitle('')
    setIsAddingTask(false)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        title: optimisticTask.title,
      })
    })
    onUpdate()
  }

  const handleToggleTask = async (task: TaskType) => {
    const newStatus = !task.is_completed
    setLocalTasks(localTasks.map(t => t.id === task.id ? {...t, is_completed: newStatus} : t))
    
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, is_completed: newStatus })
    })
    
    // Removido o bloco de confirmação automática (confirm) aqui
    
    onUpdate()
  }

  // Nova função para mover para Carteira
  const handleMoveToCarteira = async (e: React.MouseEvent) => {
    e.stopPropagation() // Evita abrir/fechar o card
    setIsMoving(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // AQUI ESTAVA O ERRO: mudado de 'follow_up' para 'follow-up' (com hífen)
        body: JSON.stringify({ status: 'follow-up' }) 
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Erro ao mover cliente')
      }

      toast.success("Cliente movido para Carteira!")
      onUpdate()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao atualizar status.")
    } finally {
      setIsMoving(false)
    }
  }

  const handleEditTask = async (task: TaskType, newTitle: string) => {
      setLocalTasks(localTasks.map(t => t.id === task.id ? {...t, title: newTitle} : t))
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, title: newTitle })
      })
      onUpdate()
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setIsSendingComment(true)
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: client.id, content: newComment })
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

  // Ordenar comentários para exibir (Antigos -> Recentes)
  const sortedComments = client.comments?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []

  return (
    <Card 
      id={`client-${client.id}`}
      className={cn(
        "group relative border-border/40 bg-card/40 hover:bg-card/80 transition-all duration-200 shadow-sm overflow-hidden mb-2",
        isComplete && "border-emerald-500/20 bg-emerald-500/5"
      )}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="flex-1 cursor-pointer grid grid-cols-[1fr_auto] items-center gap-4" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 overflow-hidden">
                <h3 className="font-semibold text-sm text-foreground truncate flex items-center gap-2 min-w-fit">
                  {client.name}
                  {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-mono">
                    <span className="hidden md:inline text-border">|</span>
                    <Calendar className="w-3 h-3 opacity-70" />
                    <span>{format(startDate, 'dd/MM')}</span>
                    <span className="opacity-50">→</span>
                    <span>{format(deadlineDate, 'dd/MM')}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
               {/* Botão de Mover para Carteira: Só aparece se Setup + Completo */}
               {isComplete && client.status === 'setup' && (
                 <Button 
                    size="sm" 
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white animate-in zoom-in duration-300"
                    onClick={handleMoveToCarteira}
                    disabled={isMoving}
                 >
                    {isMoving ? 'Movendo...' : (
                        <>
                            Carteira <ArrowRightCircle className="w-3.5 h-3.5 ml-1.5" />
                        </>
                    )}
                 </Button>
               )}

               {!isComplete && client.status === 'setup' && (
                  <div className={cn(
                      "px-2.5 py-0.5 rounded text-xs font-bold transition-all border flex items-center gap-1.5",
                      getDeadlineStyles()
                  )}>
                    <Clock className="w-3 h-3" />
                    {daysLeft > 0 ? `${daysLeft}d` : 'HOJE'}
                  </div>
               )}
               
               <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded min-w-[3rem] text-center">
                 {completedTasks}/{totalTasks}
               </div>
               
               <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteClient}
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-1"
               >
                <Trash2 className="w-3.5 h-3.5" />
               </Button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-border/40 animate-in slide-in-from-top-1 duration-200">
            <div className="flex gap-4 px-2 mb-2">
               <button 
                 onClick={() => setActiveTab('tasks')}
                 className={cn("text-xs font-medium pb-1 border-b-2 transition-colors", activeTab === 'tasks' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
               >
                 Checklist
               </button>
               <button 
                 onClick={() => setActiveTab('comments')}
                 className={cn("text-xs font-medium pb-1 border-b-2 transition-colors", activeTab === 'comments' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
               >
                 Comentários {sortedComments.length > 0 && `(${sortedComments.length})`}
               </button>
            </div>

            <div className="pl-1 md:pl-7 pr-1">
              {activeTab === 'tasks' && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={localTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                        {localTasks.map((task) => (
                            <SortableTaskItem 
                                key={task.id} 
                                task={task} 
                                onToggle={handleToggleTask} 
                                onEdit={handleEditTask}
                            />
                        ))}
                        </div>
                    </SortableContext>
                    {isAddingTask ? (
                        <div className="flex gap-2 items-center mt-2 pl-1.5 animate-in fade-in">
                        <Input
                            autoFocus
                            placeholder="Nome da subtarefa..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                            className="h-8 text-sm"
                        />
                        <Button size="sm" onClick={handleAddTask} className="h-8 text-xs">Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)} className="h-8 text-xs">Cancelar</Button>
                        </div>
                    ) : (
                        <button
                        onClick={() => setIsAddingTask(true)}
                        className="mt-2 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 pl-1.5 transition-colors py-1"
                        >
                        <Plus className="w-3 h-3 mr-1" /> Adicionar item ao final
                        </button>
                    )}
                </DndContext>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-3 pt-1">
                   {/* Área de Visualização Aumentada */}
                   <div className="h-[300px] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                      {sortedComments.length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-10">Nenhum comentário. Comece a conversa.</p>
                      )}
                      {sortedComments.map(comment => (
                        <div key={comment.id} className="bg-muted/30 p-2.5 rounded-lg border border-border/40 text-xs">
                           <div className="flex justify-between items-baseline mb-1.5">
                              <span className="font-semibold text-primary">{comment.author}</span>
                              <span className="text-[10px] text-muted-foreground opacity-70">
                                {formatDistanceToNow(new Date(comment.created_at), { locale: ptBR, addSuffix: true })}
                              </span>
                           </div>
                           <p className="opacity-90 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                      <div ref={commentsEndRef} /> {/* Âncora para scroll */}
                   </div>
                   
                   {/* Área de Escrita Aumentada */}
                   <div className="flex gap-2 items-end pt-2 border-t border-border/30">
                      <Textarea 
                        placeholder="Escreva um comentário..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] text-sm resize-none bg-background focus:ring-primary/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <Button size="icon" className="h-10 w-10 shrink-0 mb-1" onClick={handleAddComment} disabled={isSendingComment}>
                        <ArrowUp className="w-5 h-5" />
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
