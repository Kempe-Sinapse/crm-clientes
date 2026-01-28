import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  // Pegar a última posição para adicionar no final
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', body.client_id)

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      client_id: body.client_id,
      title: body.title,
      description: body.description,
      deadline: body.deadline,
      position: count || 0 // Define posição inicial
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  // Objeto dinâmico para permitir atualizar apenas o que for enviado
  const updates: any = {}
  if (body.completed !== undefined) updates.is_completed = body.completed // Mapeando para o nome correto do banco se necessário
  if (body.is_completed !== undefined) updates.is_completed = body.is_completed
  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.deadline !== undefined) updates.deadline = body.deadline
  if (body.position !== undefined) updates.position = body.position // Adicionado campo position

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
