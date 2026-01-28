'use client'

import { useState, useEffect } from 'react'
import { X, Send, User } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { createClient } from '@/lib/supabase/client'

export function ClientSidePanel({ client, onClose, onUpdate }: any) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading,SF] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchComments()
  }, [])

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return
    SF(true)
    await supabase.from('comments').insert({
      client_id: client.id,
      content: newComment,
      author: 'Eu' // Em um app real, pegar do session user
    })
    setNewComment('')
    fetchComments()
    SF(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{client.name}</h2>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Notes Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium uppercase text-muted-foreground tracking-wider">Descrição / Notas</h3>
            <Textarea 
              placeholder="Adicione detalhes sobre o setup deste cliente..." 
              className="min-h-[120px] bg-muted/30 resize-none focus:bg-background transition-colors"
              defaultValue={client.notes}
            />
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase text-muted-foreground tracking-wider">Atividade</h3>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg rounded-tl-none flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-semibold">{comment.author}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Input */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex gap-2">
            <Input 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              onKeyDown={e => e.key === 'Enter' && handleSendComment()}
            />
            <Button size="icon" onClick={handleSendComment} disabled={loading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
