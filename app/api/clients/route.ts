import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DEFAULT_TASKS = [
  "Reunião de Kick-off",
  "Coleta de Dados Iniciais",
  "Configuração da Plataforma",
  "Importação de Base de Contatos",
  "Definição de Funis de Venda",
  "Integração com WhatsApp/E-mail",
  "Treinamento da Equipe",
  "Configuração de Automações",
  "Homologação do Ambiente",
  "Go-Live (Entrega Final)"
]

export async function GET() {
  const supabase = await createClient()
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      tasks (*),
      comments (*) 
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const processedClients = clients.map(client => ({
    ...client,
    tasks: client.tasks ? client.tasks.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)) : []
  }))

  return NextResponse.json({ clients: processedClients })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  // 1. Cria o Cliente
  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      name: body.name,
      email: body.email,
      status: 'setup'
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 2. Cria as 10 tarefas padrões automaticamente
  if (client) {
    const tasksToInsert = DEFAULT_TASKS.map((title, index) => ({
      client_id: client.id,
      title: title,
      position: index,
      is_completed: false
    }))

    await supabase.from('tasks').insert(tasksToInsert)
  }

  return NextResponse.json({ client })
}
