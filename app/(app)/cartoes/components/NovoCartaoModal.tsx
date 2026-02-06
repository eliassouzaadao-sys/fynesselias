"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, CreditCard } from "lucide-react"
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

    if (!nome.trim()) {
      setError("Nome do cartao e obrigatorio")
      return
    }

    if (!bandeira) {
      setError("Selecione a bandeira do cartao")
      return
    }

    if (!ultimos4Digitos || ultimos4Digitos.length !== 4) {
      setError("Informe os ultimos 4 digitos do cartao")
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
      setError("Informe o limite do cartao")
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
        throw new Error(errorData.error || "Erro ao salvar cartao")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar cartao")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {isEditing ? "Editar Cartao" : "Novo Cartao de Credito"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[50vh] px-6">
            <div className="space-y-6 pb-4">
              {/* Secao: Identificacao do Cartao */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Identificacao</span>
              <Separator className="flex-1" />
            </div>

            <div>
              <Label htmlFor="nome">Nome do Cartao *</Label>
              <Input
                id="nome"
                placeholder="Ex: Nubank Pessoal"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bandeira">Bandeira *</Label>
                <Select value={bandeira} onValueChange={setBandeira} disabled={isSaving}>
                  <SelectTrigger id="bandeira">
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

              <div>
                <Label htmlFor="digitos">Ultimos 4 Digitos *</Label>
                <Input
                  id="digitos"
                  placeholder="1234"
                  value={ultimos4Digitos}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                    setUltimos4Digitos(value)
                  }}
                  disabled={isSaving}
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          {/* Secao: Ciclo de Fatura */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Ciclo de Fatura</span>
              <Separator className="flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechamento">Dia de Fechamento *</Label>
                <Select value={diaFechamento} onValueChange={setDiaFechamento} disabled={isSaving}>
                  <SelectTrigger id="fechamento">
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
                <p className="text-xs text-muted-foreground mt-1">Dia que a fatura fecha</p>
              </div>

              <div>
                <Label htmlFor="vencimento">Dia de Vencimento *</Label>
                <Select value={diaVencimento} onValueChange={setDiaVencimento} disabled={isSaving}>
                  <SelectTrigger id="vencimento">
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
                <p className="text-xs text-muted-foreground mt-1">Dia que a fatura vence</p>
              </div>
            </div>
          </div>

          {/* Secao: Limite e Banco */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Limite e Banco</span>
              <Separator className="flex-1" />
            </div>

            <div>
              <Label htmlFor="limite">Limite do Cartao *</Label>
              <CurrencyInput
                value={limite}
                onValueChange={setLimite}
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="banco">Banco (opcional)</Label>
              <Select value={bancoId} onValueChange={setBancoId} disabled={isSaving || loadingBancos}>
                <SelectTrigger id="banco">
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
                "Criar Cartao"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
