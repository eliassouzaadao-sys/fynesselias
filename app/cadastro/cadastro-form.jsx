"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff } from "lucide-react"

export function CadastroForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    password: "",
    confirmPassword: "",
  })

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function formatPhone(value) {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "")

    // Aplica máscara brasileira
    if (numbers.length <= 10) {
      // Formato: (99) 9999-9999
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
    } else {
      // Formato: (99) 99999-9999
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15)
    }
  }

  function handlePhoneChange(e) {
    const formatted = formatPhone(e.target.value)
    setFormData((prev) => ({ ...prev, phone: formatted }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Validações
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    if (!formData.email.trim()) {
      toast.error("Email é obrigatório")
      return
    }

    if (!formData.password) {
      toast.error("Senha é obrigatória")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Erro ao criar conta")
        setLoading(false)
        return
      }

      toast.success("Conta criada com sucesso! Faça login para continuar.")
      router.push("/login")
    } catch (error) {
      toast.error("Erro ao criar conta")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-fyn-text"
        >
          Nome completo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text placeholder:text-fyn-muted focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
          placeholder="Seu nome completo"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-fyn-text"
        >
          E-mail <span className="text-red-500">*</span>
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
          htmlFor="phone"
          className="mb-1 block text-sm font-medium text-fyn-text"
        >
          Telefone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handlePhoneChange}
          className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text placeholder:text-fyn-muted focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
          placeholder="(99) 99999-9999"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="company"
          className="mb-1 block text-sm font-medium text-fyn-text"
        >
          Empresa
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text placeholder:text-fyn-muted focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
          placeholder="Nome da sua empresa"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-fyn-text"
        >
          Senha <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 pr-10 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            placeholder="Mínimo 6 caracteres"
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
          Confirmar senha <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 pr-10 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            placeholder="Repita a senha"
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
            Criando conta...
          </>
        ) : (
          "Criar conta"
        )}
      </Button>

      <div className="text-center text-sm text-fyn-muted">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-fyn-accent hover:underline">
          Faça login
        </Link>
      </div>
    </form>
  )
}
