import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      tasks (*)
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
  
  // 1. Criar o Cliente
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

  // 2. Criar automaticamente o Checklist Padrão
  if (client) {
    const tasksToInsert = STANDARD_CHECKLIST.map((title, index) => ({
      client_id: client.id,
      title: title,
      position: index,
      is_completed: false,
      deadline: null 
    }))

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      
    if (tasksError) {
      console.error("Erro ao criar checklist:", tasksError)
    }
  }

  return NextResponse.json({ client })
}
