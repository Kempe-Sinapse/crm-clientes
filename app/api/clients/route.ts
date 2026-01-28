import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  // Ordenar as tasks por posição (se existir) ou criação dentro do objeto
  const processedClients = clients.map((client: any) => ({
    ...client,
    tasks: client.tasks ? client.tasks.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)) : []
  }))

  return NextResponse.json({ clients: processedClients })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
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

  return NextResponse.json({ client })
}
