import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Lista padrão de tarefas (que na sua visão são as subtarefas do cliente)
const STANDARD_CHECKLIST = [
  "Grupo/Boas Vindas (Coleta Dados)",
  "Acesso Checkout",
  "Workflow N8N",
  "Afiliação/Webhooks",
  "Setup Sinapse (Prod/Base Conhec.)",
  "Aprovação Base Conhecimento",
  "Chip/Meta API Oficial",
  "Modelos Msg API",
  "Config/Testes Finais",
  "Go-Live (No Ar)"
]

export async function GET() {
  const supabase = await createClient()
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      tasks (
        *,
        subtasks (*),
        comments (*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ clients })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  // 1. Criar o Cliente (Tarefa Mãe)
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      name: body.name,
      email: body.email,
      status: 'setup'
    })
    .select()
    .single()

  if (clientError) {
    return NextResponse.json({ error: clientError.message }, { status: 500 })
  }

  // 2. Criar automaticamente as tarefas padrão (Checklist)
  if (client) {
    const tasksToInsert = STANDARD_CHECKLIST.map((title, index) => ({
      client_id: client.id,
      title: title,
      position: index,
      is_completed: false,
      // Define um deadline padrão igual ao do cliente (7 dias) se desejar, ou nulo
      deadline: null 
    }))

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      
    if (tasksError) {
      console.error("Erro ao criar checklist padrão:", tasksError)
    }
  }

  return NextResponse.json({ client })
}
