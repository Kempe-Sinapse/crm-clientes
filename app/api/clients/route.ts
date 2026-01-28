import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addDays } from 'date-fns'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  const body = await request.json()
  
  // 1. Atualiza o cliente
  const { data: client, error } = await supabase
    .from('clients')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. Lógica Especial: Se moveu para Carteira (follow-up), cria a primeira tarefa de 15 dias
  if (body.status === 'follow-up') {
    const deadline = addDays(new Date(), 15).toISOString()
    
    await supabase.from('tasks').insert({
      client_id: id,
      title: 'Follow-up Quinzenal',
      description: 'Contato de manutenção de carteira.',
      deadline: deadline,
      position: 0
    })
  }

  return NextResponse.json({ client })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
