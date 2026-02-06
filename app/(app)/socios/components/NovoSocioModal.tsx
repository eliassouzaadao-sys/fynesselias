"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, User } from "lucide-react"

interface NovoSocioModalProps {
  socio?: {
    id: number
    nome: string
    sigla: string
    cpfSocio: string
    previsto: number
  } | null
  onClose: () => void
  onSuccess: () => void
}

export function NovoSocioModal({ socio, onClose, onSuccess }: NovoSocioModalProps) {
  const isEditing = !!socio

  const [nome, setNome] = useState(socio?.nome || "")
  const [sigla, setSigla] = useState(socio?.sigla || "")
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

    if (!nome.trim()) {
      setError("Nome do socio e obrigatorio")
      return
    }

    const cpfClean = cpf.replace(/\D/g, "")
    if (!cpfClean || cpfClean.length !== 11) {
      setError("CPF deve ter 11 digitos")
      return
    }

    if (!proLaboreBase || proLaboreBase <= 0) {
      setError("Informe o valor do pro-labore base")
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        id: socio?.id,
        nome: nome.trim(),
        sigla: sigla.trim() || undefined,
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
        throw new Error(errorData.error || "Erro ao salvar socio")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar socio")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Socio" : "Novo Socio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[50vh] px-6">
            <div className="space-y-6 pb-4">
              {/* Secao: Dados Pessoais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Dados Pessoais</span>
              <Separator className="flex-1" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome do Socio *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Joao Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="sigla">Sigla</Label>
                <Input
                  id="sigla"
                  placeholder="PL"
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                  disabled={isSaving}
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Codigo do pro-labore
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                disabled={isSaving}
                maxLength={14}
              />
            </div>
          </div>

          {/* Secao: Remuneracao */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Remuneracao</span>
              <Separator className="flex-1" />
            </div>

            <div>
              <Label htmlFor="prolabore">Pro-labore Base Mensal *</Label>
              <CurrencyInput
                value={proLaboreBase}
                onValueChange={setProLaboreBase}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Valor fixo mensal antes dos descontos
              </p>
            </div>
          </div>

              {/* Erro */}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar Alteracoes"
              ) : (
                "Criar Socio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
