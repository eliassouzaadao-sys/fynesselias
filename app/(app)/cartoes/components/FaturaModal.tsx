"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { formatCurrency, formatDate } from "@/lib/format"
import { Loader2, Calendar, CheckCircle, CreditCard } from "lucide-react"

interface FaturaModalProps {
  fatura: {
    id: number
    mesReferencia: number
    anoReferencia: number
    valorTotal: number
    pago: boolean
    dataPagamento?: string | null
    dataVencimento: string
    dataFechamento: string
    cartao?: {
      id: number
      nome: string
      bandeira: string
      ultimos4Digitos: string
    }
  }
  onClose: () => void
  onPago: () => void
}

const meses = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function FaturaModal({ fatura, onClose, onPago }: FaturaModalProps) {
  const [loading, setLoading] = useState(true)
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [showPagarModal, setShowPagarModal] = useState(false)
  const [bancos, setBancos] = useState<any[]>([])
  const [bancoSelecionado, setBancoSelecionado] = useState("")
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mesNome = meses[fatura.mesReferencia - 1]

  useEffect(() => {
    const fetchFatura = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/faturas/${fatura.id}`)
        const data = await res.json()
        setLancamentos(data.lancamentos || [])
      } catch (err) {
        console.error("Erro ao carregar fatura:", err)
        setLancamentos([])
      } finally {
        setLoading(false)
      }
    }
    fetchFatura()
  }, [fatura.id])

  useEffect(() => {
    if (showPagarModal) {
      const fetchBancos = async () => {
        try {
          const res = await fetch("/api/bancos")
          const data = await res.json()
          setBancos(Array.isArray(data) ? data : [])
        } catch (err) {
          console.error("Erro ao carregar bancos:", err)
          setBancos([])
        }
      }
      fetchBancos()
    }
  }, [showPagarModal])

  const handlePagar = async () => {
    setError(null)
    setIsPaying(true)

    try {
      const response = await fetch(`/api/faturas/${fatura.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bancoId: bancoSelecionado && bancoSelecionado !== "none" ? bancoSelecionado : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao pagar fatura")
      }

      onPago()
    } catch (err: any) {
      setError(err.message || "Erro ao pagar fatura")
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          {/* Header com cor de status */}
          <div className={`p-6 ${fatura.pago ? "bg-green-50 dark:bg-green-950/30" : "bg-yellow-50 dark:bg-yellow-950/30"}`}>
            <DialogHeader className="space-y-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-foreground" />
                    Fatura {mesNome}/{fatura.anoReferencia}
                  </DialogTitle>
                  {fatura.cartao && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {fatura.cartao.nome} (**** {fatura.cartao.ultimos4Digitos})
                    </p>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Status e Valor */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(fatura.valorTotal)}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  fatura.pago
                    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                }`}>
                  {fatura.pago ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Paga
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Aberta
                    </>
                  )}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Vencimento: {formatDate(new Date(fatura.dataVencimento))}
                </p>
              </div>
            </div>
          </div>

          {/* Lancamentos */}
          <div className="flex-1 overflow-hidden">
            <div className="px-6 pt-4 pb-2">
              <h3 className="text-sm font-medium text-foreground">Lancamentos</h3>
            </div>

            <ScrollArea className="h-[300px] px-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : lancamentos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhum lancamento nesta fatura</p>
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {lancamentos.map((lanc) => (
                    <div
                      key={lanc.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{lanc.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {lanc.beneficiario && `${lanc.beneficiario} - `}
                          {lanc.numeroParcela && `Parcela ${lanc.numeroParcela} - `}
                          {formatDate(new Date(lanc.criadoEm))}
                        </p>
                      </div>
                      <p className="font-medium text-foreground">{formatCurrency(lanc.valor)}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Footer */}
          {!fatura.pago ? (
            <DialogFooter className="border-t border-border p-4">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button onClick={() => setShowPagarModal(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Pagar Fatura
              </Button>
            </DialogFooter>
          ) : fatura.dataPagamento ? (
            <div className="border-t border-border p-4 bg-green-50 dark:bg-green-950/30">
              <p className="text-sm text-center text-green-700 dark:text-green-300">
                Paga em {formatDate(new Date(fatura.dataPagamento))}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmacao de Pagamento */}
      <AlertDialog open={showPagarModal} onOpenChange={setShowPagarModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Voce esta prestes a pagar a fatura de <strong>{mesNome}/{fatura.anoReferencia}</strong> no valor de{" "}
              <strong>{formatCurrency(fatura.valorTotal)}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="banco">Banco de Pagamento (opcional)</Label>
              <Select value={bancoSelecionado} onValueChange={setBancoSelecionado}>
                <SelectTrigger id="banco">
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nao informar</SelectItem>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id.toString()}>
                      {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPaying}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePagar} disabled={isPaying}>
              {isPaying ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Pagando...
                </>
              ) : (
                "Confirmar Pagamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
