'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isQb, setIsQb] = useState(false) // Alternar entre Login/Cadastro
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isQb) {
        // Cadastro (Sign Up)
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        toast.success('Conta criada! Verifique seu email ou faça login.')
      } else {
        // Login (Sign In)
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        toast.success('Login realizado com sucesso!')
        router.push('/')
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      <Card className="w-full max-w-md border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Bem-vindo(a)</CardTitle>
          <CardDescription>
            {isQb ? 'Crie sua conta para começar' : 'Entre para gerenciar seus clientes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-muted/50"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isQb ? 'Criar Conta' : 'Entrar')}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <button 
              onClick={() => setIsQb(!isQb)}
              className="hover:text-primary hover:underline transition-all"
            >
              {isQb ? 'Já tem conta? Faça Login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
