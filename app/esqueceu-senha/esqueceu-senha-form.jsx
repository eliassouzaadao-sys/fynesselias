"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Mail } from "lucide-react"

export function EsqueceuSenhaForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()

    if (!email.trim()) {
      toast.error("Digite seu email")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erro ao enviar email")
        setLoading(false)
        return
      }

      setSubmitted(true)
      toast.success("Verifique seu email!")
    } catch (error) {
      toast.error("Erro ao enviar email")
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Mail className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-fyn-text">
            Se o email <span className="font-medium">{email}</span> estiver
            cadastrado, voce recebera um link para redefinir sua senha.
          </p>
        </div>
        <p className="text-sm text-fyn-muted">
          Nao recebeu o email? Verifique a caixa de spam ou{" "}
          <button
            onClick={() => {
              setSubmitted(false)
              setLoading(false)
            }}
            className="text-fyn-accent hover:underline"
          >
            tente novamente
          </button>
        </p>
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-fyn-accent hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    )
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text placeholder:text-fyn-muted focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
          placeholder="seu@email.com"
          disabled={loading}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar link de recuperacao"
        )}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-fyn-accent hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    </form>
  )
}
