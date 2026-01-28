import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  // 1. Descobrir a última posição para adicionar no final
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
      position: count || 0 // Define posição sempre no final
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
  
  // Atualização dinâmica
  const updates: any = {}
  if (body.is_completed !== undefined) updates.is_completed = body.is_completed
  if (body.title !== undefined) updates.title = body.title
  if (body.position !== undefined) updates.position = body.position // Suporte a reordenar

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

// ... DELETE function (mantenha como está)
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
