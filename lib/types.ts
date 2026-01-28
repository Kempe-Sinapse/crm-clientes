export type ClientStatus = 'setup' | 'follow-up' | 'completed'

export interface Client {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  status: ClientStatus
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  client_id: string
  title: string
  description: string | null
  is_completed: boolean
  deadline: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  position: number
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  content: string
  author: string
  created_at: string
}

export interface TaskWithDetails extends Task {
  subtasks: Subtask[]
  comments: Comment[]
}

export interface ClientWithTasks extends Client {
  tasks: TaskWithDetails[]
}
