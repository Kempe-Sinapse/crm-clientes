import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: subtask, error } = await supabase
    .from('subtasks')
    .insert({
      task_id: body.task_id,
      title: body.title
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subtask })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: subtask, error } = await supabase
    .from('subtasks')
    .update({
      completed: body.completed,
      title: body.title
    })
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subtask })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
