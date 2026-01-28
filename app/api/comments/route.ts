import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      client_id: body.client_id, // Mudança aqui
      content: body.content,
      author: 'User' // Em um app real, pegue do auth user
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment })
}

// ... DELETE function mantém igual ...
