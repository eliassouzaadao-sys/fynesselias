"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error("Preencha todos os campos")
      return
    }

    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
        return
      }

      toast.success("Login realizado com sucesso!")
      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      toast.error("Erro ao fazer login")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-fyn-text"
        >
          E-mail
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text placeholder:text-fyn-muted focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
          placeholder="seu@email.com"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-fyn-text"
        >
          Senha
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 pr-10 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            placeholder="Sua senha"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fyn-muted hover:text-fyn-text"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Link
          href="/esqueceu-senha"
          className="text-sm text-fyn-accent hover:underline"
        >
          Esqueceu a senha?
        </Link>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>

      <div className="text-center text-sm text-fyn-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-fyn-accent hover:underline">
          Cadastre-se
        </Link>
      </div>
    </form>
  )
}
