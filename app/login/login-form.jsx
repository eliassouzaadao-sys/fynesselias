"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-fyn-text">
          E-mail
        </label>
        <input
          type="email"
          id="email"
          name="email"
          defaultValue="admin@fynness.com"
          className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text placeholder:text-fyn-muted focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-fyn-text">
          Senha
        </label>
        <input
          type="password"
          id="password"
          name="password"
          defaultValue="123456"
          className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  )
}
