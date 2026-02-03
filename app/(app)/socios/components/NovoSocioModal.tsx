"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { X, Loader2, User } from "lucide-react"

interface NovoSocioModalProps {
  socio?: {
    id: number
    nome: string
    cpfSocio: string
    previsto: number
  } | null
  onClose: () => void
  onSuccess: () => void
}

export function NovoSocioModal({ socio, onClose, onSuccess }: NovoSocioModalProps) {
  const isEditing = !!socio

  const [nome, setNome] = useState(socio?.nome || "")
  const [cpf, setCpf] = useState(socio?.cpfSocio || "")
  const [proLaboreBase, setProLaboreBase] = useState(socio?.previsto || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11)
    let formatted = cleaned
    if (cleaned.length > 3) {
      formatted = cleaned.slice(0, 3) + "." + cleaned.slice(3)
    }
    if (cleaned.length > 6) {
      formatted = cleaned.slice(0, 3) + "." + cleaned.slice(3, 6) + "." + cleaned.slice(6)
    }
    if (cleaned.length > 9) {
      formatted = cleaned.slice(0, 3) + "." + cleaned.slice(3, 6) + "." + cleaned.slice(6, 9) + "-" + cleaned.slice(9)
    }
    return formatted
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (!nome.trim()) {
      setError("Nome do sócio é obrigatório")
      return
    }

    const cpfClean = cpf.replace(/\D/g, "")
    if (!cpfClean || cpfClean.length !== 11) {
      setError("CPF deve ter 11 dígitos")
      return
    }

    if (!proLaboreBase || proLaboreBase <= 0) {
      setError("Informe o valor do pró-labore base")
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        id: socio?.id,
        nome: nome.trim(),
        cpf: cpfClean,
        proLaboreBase,
      }

      const response = await fetch("/api/socios", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar sócio")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar sócio")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? "Editar Sócio" : "Novo Sócio"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome do Sócio *</label>
              <Input
                placeholder="Ex: João Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CPF *</label>
              <Input
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                disabled={isSaving}
                maxLength={14}
                required
              />
            </div>

            {/* Pró-labore Base */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Pró-labore Base Mensal *</label>
              <CurrencyInput
                value={proLaboreBase}
                onValueChange={setProLaboreBase}
                disabled={isSaving}
                required
              />
              <p className="text-xs text-muted-foreground">
                Valor fixo mensal antes dos descontos
              </p>
            </div>

            {/* Info sobre descontos */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-900">
                <strong>Como funciona:</strong> Ao lançar uma conta a pagar, você pode marcar qual sócio é responsável pelo gasto.
                O valor será automaticamente descontado do pró-labore dele.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar Alterações"
              ) : (
                "Criar Sócio"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
