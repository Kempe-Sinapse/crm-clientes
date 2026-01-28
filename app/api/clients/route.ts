import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      tasks (
        *,
        subtasks (*),
        comments (*)
      )
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
  
  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      name: body.name,
      email: body.email,
      status: 'setup'
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ client })
}
