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

  // 2. Se moveu para Carteira ('follow-up'), cria a tarefa de 15 dias
  if (body.status === 'follow-up') {
    // Remove tarefas antigas do setup (opcional, se quiser limpar a lista)
    // await supabase.from('tasks').delete().eq('client_id', id)

    const deadline = addDays(new Date(), 15).toISOString()
    
    await supabase.from('tasks').insert({
      client_id: id,
      title: 'Follow-up de Manutenção',
      description: 'Contato quinzenal de carteira.',
      deadline: deadline, // Define o prazo para 15 dias
      position: 0,
      is_completed: false
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
