'use client'

import React from "react"

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
  const [isSignUp, setIsSignUp] = useState(false) // Mudei o nome de isQb para isSignUp para clareza
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Limpa espaços em branco acidentais
    const cleanEmail = email.trim()

    try {
      if (isSignUp) {
        // Cadastro (Sign Up)
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            // Isso garante que o usuário seja redirecionado de volta pra home após confirmar o email
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })
        
        if (error) throw error
        
        // Se o autoconfirm estiver ligado no Supabase, ele já loga direto. 
        // Se não, ele avisa para checar o email.
        if (data.user && !data.session) {
            toast.success('Conta criada! Verifique seu e-mail para confirmar.')
        } else {
            toast.success('Conta criada com sucesso!')
            router.push('/')
            router.refresh()
        }

      } else {
        // Login (Sign In)
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })
        if (error) throw error
        
        toast.success('Login realizado com sucesso!')
        router.push('/')
        router.refresh()
      }
    } catch (error: any) {
      console.error(error)
      // Tratamento de mensagens de erro comuns do Supabase
      if (error.message.includes('Invalid login credentials')) {
        toast.error('E-mail ou senha incorretos.')
      } else if (error.message.includes('invalid email')) {
        toast.error('O formato do e-mail é inválido. Verifique se há espaços ou erros.')
      } else if (error.message.includes('rate limit') || error.message.includes('Email rate limit exceeded')) {
        toast.error('Limite de tentativas excedido. Por favor, aguarde alguns minutos antes de tentar novamente.', {
          duration: 5000,
        })
      } else if (error.message.includes('User already registered')) {
        toast.error('Este e-mail já está cadastrado. Faça login ao invés de criar uma nova conta.')
        setIsSignUp(false)
      } else {
        toast.error(error.message || 'Erro ao autenticar')
      }
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
            {isSignUp ? 'Crie sua conta para começar' : 'Entre para gerenciar seus clientes'}
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
                minLength={6} // Supabase exige mínimo de 6 caracteres por padrão
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="hover:text-primary hover:underline transition-all"
            >
              {isSignUp ? 'Já tem conta? Faça Login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
