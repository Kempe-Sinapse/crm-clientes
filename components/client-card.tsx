'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Plus, Trash2, Calendar, MessageSquare, Loader2, LogIn } from 'lucide-react'
import type { Client, Task as TaskType } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ClientCardProps {
  client: Client
  onUpdate: () => void
}

export function ClientCard({ client, onUpdate }: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loadingTask, setLoadingTask] = useState(false)

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return
    setLoadingTask(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          title: newTaskTitle,
          description: '',
          deadline: new Date().toISOString() // Default to today
        })
      })
      
      if(!res.ok) throw new Error("Falha ao criar tarefa")

      setNewTaskTitle('')
      setIsAddingTask(false)
      onUpdate()
      toast.success("Tarefa adicionada")
    } catch (e) {
      toast.error("Erro ao adicionar tarefa")
    } finally {
      setLoadingTask(false)
    }
  }

  const handleDeleteClient = async () => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      onUpdate()
      toast.success("Cliente removido")
    }
  }

  const completedCount = client.tasks?.filter(t => t.completed).length || 0
  const totalCount = client.tasks?.length || 0
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100
  const isComplete = totalCount > 0 && completedCount === totalCount

  return (
    <Card className={`group overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg dark:hover:border-primary/20 ${isComplete ? 'border-emerald-500/30 dark:border-emerald-500/20' : ''}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-start gap-4 flex-1 text-left"
          >
            <div className={`mt-1 rounded-full p-1 transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-primary/5'}`}>
               {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {client.name}
                </h3>
                {isComplete && <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">Setup Concluído</Badge>}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{client.email}</span>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 mt-3 max-w-xs">
                <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{completedCount}/{totalCount}</span>
              </div>
            </div>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteClient}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-6 pl-10 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {client.tasks?.sort((a: any, b: any) => (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())).map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={onUpdate}
              />
            ))}

            {isAddingTask ? (
              <div className="flex gap-2 items-center animate-in fade-in">
                <Input
                  placeholder="Nome da tarefa principal..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="h-9"
                  autoFocus
                />
                <Button onClick={handleAddTask} size="sm" disabled={loadingTask}>
                   {loadingTask ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
                </Button>
                <Button onClick={() => setIsAddingTask(false)} variant="ghost" size="sm">Cancelar</Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingTask(true)}
                className="text-muted-foreground hover:text-primary -ml-2 h-8"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa Principal
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function TaskItem({ task, onUpdate }: { task: TaskType, onUpdate: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [loadingSub, setLoadingSub] = useState(false)
  
  // Auth state for comments
  const [user, setUser] = useState<any>(null)
  const [newComment, setNewComment] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const handleToggleTask = async () => {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, completed: !task.completed })
    })
    onUpdate()
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return
    setLoadingSub(true)

    try {
      const res = await fetch('/api/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          title: newSubtaskTitle
        })
      })

      if(!res.ok) throw new Error("Erro na API")

      setNewSubtaskTitle('')
      setIsAddingSubtask(false)
      onUpdate()
      // Manter expandido para ver a nova subtask
      if(!isExpanded) setIsExpanded(true)
    } catch (err) {
      toast.error("Erro ao criar subtarefa. Verifique sua conexão.")
    } finally {
      setLoadingSub(false)
    }
  }

  const handleToggleSubtask = async (sub: any) => {
    await fetch('/api/subtasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sub.id, completed: !sub.completed })
    })
    onUpdate()
  }

  const handleSendComment = async () => {
    if(!user) {
      toast.error("Faça login para comentar")
      return router.push('/login')
    }
    if(!newComment.trim()) return

    await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          content: newComment,
          author: user.email || 'Usuário'
        })
    })
    setNewComment('')
    onUpdate()
  }

  return (
    <div className={`rounded-lg border border-border/50 bg-background/40 transition-all ${task.completed ? 'opacity-60' : 'hover:border-primary/30'}`}>
      <div className="flex items-center gap-3 p-3">
        <Checkbox checked={task.completed} onCheckedChange={handleToggleTask} />
        
        <div className="flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
             {task.deadline && (
               <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(task.deadline).toLocaleDateString('pt-BR')}</span>
             )}
             {(task.subtasks?.length || 0) > 0 && (
               <span>{task.subtasks?.filter(s => s.completed).length}/{task.subtasks?.length} sub</span>
             )}
          </div>
        </div>

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsExpanded(!isExpanded)}>
            <MessageSquare className="w-3.5 h-3.5" />
        </Button>
      </div>

      {isExpanded && (
        <div className="border-t border-border/50 bg-muted/20 p-3 space-y-3">
          
          {/* Subtasks Section */}
          <div className="space-y-2">
            {task.subtasks?.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 pl-2">
                 <Checkbox 
                    className="h-3.5 w-3.5" 
                    checked={sub.completed} 
                    onCheckedChange={() => handleToggleSubtask(sub)} 
                 />
                 <span className={`text-sm ${sub.completed ? 'line-through text-muted-foreground' : ''}`}>{sub.title}</span>
              </div>
            ))}

            {isAddingSubtask ? (
               <div className="flex gap-2 items-center pl-2 pt-1">
                 <Input 
                   value={newSubtaskTitle} 
                   onChange={e => setNewSubtaskTitle(e.target.value)} 
                   placeholder="Nova subtarefa..." 
                   className="h-7 text-xs"
                   autoFocus
                   onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                 />
                 <Button size="icon" className="h-7 w-7" onClick={handleAddSubtask} disabled={loadingSub}>
                    {loadingSub ? <Loader2 className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/>}
                 </Button>
               </div>
            ) : (
               <button 
                 onClick={() => setIsAddingSubtask(true)}
                 className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 pl-2 pt-1"
               >
                 <Plus className="w-3 h-3" /> Adicionar subtarefa
               </button>
            )}
          </div>

          {/* Comments Section */}
          <div className="pt-3 mt-3 border-t border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Comentários</h4>
            <div className="space-y-2 mb-3">
              {task.comments?.length === 0 && <p className="text-xs text-muted-foreground/50 italic">Nenhum comentário.</p>}
              {task.comments?.map(comment => (
                <div key={comment.id} className="bg-background/80 p-2 rounded text-xs border border-border/30">
                  <div className="flex justify-between mb-1 opacity-70">
                    <span className="font-semibold">{comment.author}</span>
                    <span>{new Date(comment.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>

            {user ? (
              <div className="flex gap-2">
                <Input 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  placeholder="Escreva um comentário..." 
                  className="h-8 text-xs"
                  onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                />
                <Button size="icon" className="h-8 w-8" onClick={handleSendComment}>
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-2" onClick={() => router.push('/login')}>
                <LogIn className="w-3 h-3" /> Entrar para comentar
              </Button>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
