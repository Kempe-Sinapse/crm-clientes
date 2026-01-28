'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Bell, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationsNav() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fetchNotifications = async () => {
    // Busca os últimos comentários (incluindo o nome do cliente)
    const { data: comments } = await supabase
      .from('comments')
      .select(`
        *,
        clients (id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (comments) {
      setNotifications(comments)
      // Lógica simples: considera os 10 últimos como "recentes"
      setUnreadCount(comments.length)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Assina atualizações em tempo real na tabela de comentários
    const channel = supabase
      .channel('public:comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleNotificationClick = (clientId: string) => {
    setIsOpen(false)
    // Redireciona com parâmetros para abrir o card e a aba certa
    router.push(`/?client_id=${clientId}&tab=comments&t=${Date.now()}`) 
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notificações</span>
          {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} recentes</span>}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação recente.
            </div>
          ) : (
            <div className="grid">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  className="flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-0"
                  onClick={() => handleNotificationClick(notif.client_id)}
                >
                  <div className="mt-1 bg-primary/10 p-1.5 rounded-full text-primary shrink-0">
                    <MessageSquare className="h-3 w-3" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      <span className="font-bold">{notif.author || 'Alguém'}</span> em <span className="text-primary">{notif.clients?.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                      "{notif.content}"
                    </p>
                    <p className="text-[10px] text-muted-foreground opacity-70">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
