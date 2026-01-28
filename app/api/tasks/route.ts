import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      client_id: body.client_id,
      title: body.title,
      description: body.description,
      deadline: body.deadline
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
  
  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      completed: body.completed,
      title: body.title,
      description: body.description,
      deadline: body.deadline
    })
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
