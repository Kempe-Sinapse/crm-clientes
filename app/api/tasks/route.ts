import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addDays } from 'date-fns'

// ... POST e DELETE mantêm-se similares ...

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  // Atualiza a tarefa
  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      is_completed: body.is_completed, // Note: mudei de 'completed' para 'is_completed' para bater com o SQL
      title: body.title,
      description: body.description,
      deadline: body.deadline
    })
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // LÓGICA DE FOLLOW-UP
  // Se completou uma tarefa de follow-up, cria a próxima para daqui 15 dias
  if (task.is_follow_up && task.is_completed) {
    const nextDeadline = addDays(new Date(), 15)
    
    await supabase.from('tasks').insert({
      client_id: task.client_id,
      title: 'Follow-up Recorrente',
      is_follow_up: true,
      deadline: nextDeadline.toISOString(),
      is_completed: false
    })
  }

  return NextResponse.json({ task })
}
