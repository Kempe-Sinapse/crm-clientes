'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Plus, Trash2, Calendar, MessageSquare } from 'lucide-react'
import type { Client, Task as TaskType } from '@/lib/types'

interface ClientCardProps {
  client: Client
  onUpdate: () => void
}

export function ClientCard({ client, onUpdate }: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: client.id,
        title: newTaskTitle,
        description: newTaskDescription,
        deadline: newTaskDeadline || null
      })
    })

    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskDeadline('')
    setIsAddingTask(false)
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
        title: task.title,
        description: task.description,
        deadline: task.deadline
      })
    })

    // Check if all tasks are completed
    const allTasksCompleted = client.tasks?.every(t => 
      t.id === task.id ? newCompleted : t.completed
    )

    if (allTasksCompleted && client.status === 'setup') {
      await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'follow_up' })
      })
    }

    onUpdate()
  }

  const handleDeleteClient = async () => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      onUpdate()
    }
  }

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const allTasksCompleted = client.tasks?.length > 0 && client.tasks.every(t => t.completed)

  return (
    <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-start gap-3 flex-1 text-left group"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {client.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{client.email}</p>
              {client.tasks && client.tasks.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="text-xs text-muted-foreground">
                    {client.tasks.filter(t => t.completed).length} / {client.tasks.length} tarefas
                  </div>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ 
                        width: `${(client.tasks.filter(t => t.completed).length / client.tasks.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </button>
          <div className="flex items-center gap-2">
            {allTasksCompleted && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Completo
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteClient}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 ml-8 space-y-3">
            {client.tasks?.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => handleToggleTask(task)}
                onUpdate={onUpdate}
                isOverdue={isOverdue(task.deadline)}
              />
            ))}

            {isAddingTask ? (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
                <Input
                  placeholder="Título da tarefa"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="bg-background"
                />
                <Textarea
                  placeholder="Descrição (opcional)"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="bg-background min-h-20"
                />
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddTask} size="sm">Adicionar</Button>
                  <Button onClick={() => setIsAddingTask(false)} variant="ghost" size="sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingTask(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar tarefa
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function TaskItem({ 
  task, 
  onToggle, 
  onUpdate,
  isOverdue 
}: { 
  task: TaskType
  onToggle: () => void
  onUpdate: () => void
  isOverdue: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [newComment, setNewComment] = useState('')

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return

    await fetch('/api/subtasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: task.id,
        title: newSubtaskTitle
      })
    })

    setNewSubtaskTitle('')
    setIsAddingSubtask(false)
    onUpdate()
  }

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    await fetch('/api/subtasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: subtaskId,
        completed: !completed
      })
    })

    onUpdate()
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: task.id,
        content: newComment
      })
    })

    setNewComment('')
    setIsAddingComment(false)
    onUpdate()
  }

  const handleDeleteTask = async () => {
    if (confirm('Excluir esta tarefa?')) {
      await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' })
      onUpdate()
    }
  }

  return (
    <div className="border border-border/50 rounded-lg p-3 bg-background/50">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-start gap-2 w-full text-left group"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {task.deadline && (
                  <div className={`flex items-center gap-1.5 text-xs ${isOverdue && !task.completed ? 'text-destructive' : 'text-muted-foreground'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(task.deadline).toLocaleDateString('pt-BR')}
                  </div>
                )}
                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtarefas
                  </span>
                )}
                {task.comments && task.comments.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {task.comments.length}
                  </div>
                )}
              </div>
            </div>
          </button>

          {isExpanded && (
            <div className="mt-3 ml-6 space-y-3">
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-2">
                  {task.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(subtask.id, subtask.completed)}
                      />
                      <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isAddingSubtask ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova subtarefa"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    className="text-sm"
                  />
                  <Button onClick={handleAddSubtask} size="sm">OK</Button>
                  <Button onClick={() => setIsAddingSubtask(false)} variant="ghost" size="sm">
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar subtarefa
                </Button>
              )}

              {task.comments && task.comments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {task.comments.map(comment => (
                    <div key={comment.id} className="text-sm bg-muted/30 rounded p-2">
                      <p className="text-foreground">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {isAddingComment ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Adicionar comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="text-sm min-h-20"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddComment} size="sm">Comentar</Button>
                    <Button onClick={() => setIsAddingComment(false)} variant="ghost" size="sm">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingComment(true)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Adicionar comentário
                </Button>
              )}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDeleteTask}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
