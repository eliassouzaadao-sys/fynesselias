"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { X, Loader2, CreditCard } from "lucide-react"
import { BANDEIRAS_CARTAO, DIAS_MES } from "@/lib/constants"

interface NovoCartaoModalProps {
  cartao?: {
    id: number
    nome: string
    bandeira: string
    ultimos4Digitos: string
    diaVencimento: number
    diaFechamento: number
    limite: number
    bancoId?: number | null
  } | null
  onClose: () => void
  onSuccess: () => void
}

export function NovoCartaoModal({ cartao, onClose, onSuccess }: NovoCartaoModalProps) {
  const isEditing = !!cartao

  const [nome, setNome] = useState(cartao?.nome || "")
  const [bandeira, setBandeira] = useState(cartao?.bandeira || "")
  const [ultimos4Digitos, setUltimos4Digitos] = useState(cartao?.ultimos4Digitos || "")
  const [diaVencimento, setDiaVencimento] = useState(cartao?.diaVencimento?.toString() || "")
  const [diaFechamento, setDiaFechamento] = useState(cartao?.diaFechamento?.toString() || "")
  const [limite, setLimite] = useState(cartao?.limite || 0)
  const [bancoId, setBancoId] = useState(cartao?.bancoId?.toString() || "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bancos, setBancos] = useState<any[]>([])
  const [loadingBancos, setLoadingBancos] = useState(false)

  // Carregar bancos
  useEffect(() => {
    const fetchBancos = async () => {
      setLoadingBancos(true)
      try {
        const res = await fetch("/api/bancos")
        const data = await res.json()
        setBancos(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Erro ao carregar bancos:", err)
        setBancos([])
      } finally {
        setLoadingBancos(false)
      }
    }
    fetchBancos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (!nome.trim()) {
      setError("Nome do cartão é obrigatório")
      return
    }

    if (!bandeira) {
      setError("Selecione a bandeira do cartão")
      return
    }

    if (!ultimos4Digitos || ultimos4Digitos.length !== 4) {
      setError("Informe os últimos 4 dígitos do cartão")
      return
    }

    if (!diaVencimento) {
      setError("Selecione o dia de vencimento")
      return
    }

    if (!diaFechamento) {
      setError("Selecione o dia de fechamento")
      return
    }

    if (!limite || limite <= 0) {
      setError("Informe o limite do cartão")
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        id: cartao?.id,
        nome: nome.trim(),
        bandeira,
        ultimos4Digitos,
        diaVencimento: parseInt(diaVencimento),
        diaFechamento: parseInt(diaFechamento),
        limite,
        bancoId: bancoId && bancoId !== "none" ? parseInt(bancoId) : null
      }

      const response = await fetch("/api/cartoes", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar cartão")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar cartão")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-fyn-border">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-fyn-accent" />
            <h2 className="text-lg font-semibold text-fyn-text">
              {isEditing ? "Editar Cartão" : "Novo Cartão de Crédito"}
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
              <label className="text-sm font-medium text-fyn-text">Nome do Cartão *</label>
              <Input
                placeholder="Ex: Nubank Pessoal"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            {/* Bandeira e Últimos 4 Dígitos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-fyn-text">Bandeira *</label>
                <Select value={bandeira} onValueChange={setBandeira} disabled={isSaving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANDEIRAS_CARTAO.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-fyn-text">Últimos 4 Dígitos *</label>
                <Input
                  placeholder="1234"
                  value={ultimos4Digitos}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                    setUltimos4Digitos(value)
                  }}
                  disabled={isSaving}
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {/* Dias de Fechamento e Vencimento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-fyn-text">Dia de Fechamento *</label>
                <Select value={diaFechamento} onValueChange={setDiaFechamento} disabled={isSaving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_MES.map((d) => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        Dia {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-fyn-muted">Dia que a fatura fecha</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-fyn-text">Dia de Vencimento *</label>
                <Select value={diaVencimento} onValueChange={setDiaVencimento} disabled={isSaving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_MES.map((d) => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        Dia {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-fyn-muted">Dia que a fatura vence</p>
              </div>
            </div>

            {/* Limite */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-fyn-text">Limite do Cartão *</label>
              <CurrencyInput
                value={limite}
                onValueChange={setLimite}
                disabled={isSaving}
                required
              />
            </div>

            {/* Banco */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-fyn-text">Banco (opcional)</label>
              <Select value={bancoId} onValueChange={setBancoId} disabled={isSaving || loadingBancos}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingBancos ? "Carregando..." : "Selecione o banco"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id.toString()}>
                      {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-fyn-border p-4 flex gap-3">
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
                "Criar Cartão"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
