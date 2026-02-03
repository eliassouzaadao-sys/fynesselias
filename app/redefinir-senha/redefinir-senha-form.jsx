"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"

export function RedefinirSenhaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!token) {
      toast.error("Token invalido")
      return
    }

    if (!formData.password) {
      toast.error("Digite a nova senha")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Senha deve ter no minimo 6 caracteres")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas nao coincidem")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erro ao redefinir senha")
        setLoading(false)
        return
      }

      setSuccess(true)
      toast.success("Senha redefinida com sucesso!")
    } catch (error) {
      toast.error("Erro ao redefinir senha")
      setLoading(false)
    }
  }

  // Token inválido
  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm text-fyn-text">
            Link invalido ou expirado.
          </p>
          <p className="mt-2 text-sm text-fyn-muted">
            Solicite um novo link de recuperacao de senha.
          </p>
        </div>
        <Link href="/esqueceu-senha">
          <Button className="w-full">Solicitar novo link</Button>
        </Link>
      </div>
    )
  }

  // Sucesso
  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-fyn-text">
            Sua senha foi redefinida com sucesso!
          </p>
          <p className="mt-2 text-sm text-fyn-muted">
            Agora voce pode fazer login com sua nova senha.
          </p>
        </div>
        <Link href="/login">
          <Button className="w-full">Ir para o login</Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-fyn-text"
        >
          Nova senha
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 pr-10 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            placeholder="Minimo 6 caracteres"
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

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1 block text-sm font-medium text-fyn-text"
        >
          Confirmar nova senha
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 pr-10 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            placeholder="Repita a nova senha"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fyn-muted hover:text-fyn-text"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redefinindo...
          </>
        ) : (
          "Redefinir senha"
        )}
      </Button>
    </form>
  )
}
