import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DEFAULT_SETUP_TASKS = [
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
  
  // Trazemos tudo ordenado por deadline (baseado no created_at do cliente)
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      tasks (*)
    `)
    .order('created_at', { ascending: true }) // Mais antigos (deadline mais próximo) primeiro

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ clients })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  // 1. Criar Cliente
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      name: body.name,
      email: body.email,
      status: 'setup'
    })
    .select()
    .single()

  if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 })

  // 2. Criar as 10 Subtarefas Padrão
  const tasksToCreate = DEFAULT_SETUP_TASKS.map((title, index) => ({
    client_id: client.id,
    title: title,
    position: index,
    is_completed: false
  }))

  const { error: tasksError } = await supabase
    .from('tasks')
    .insert(tasksToCreate)

  if (tasksError) {
    // Em produção, idealmente faria rollback, mas aqui apenas logamos
    console.error("Erro ao criar tarefas padrão:", tasksError)
  }

  return NextResponse.json({ client })
}
