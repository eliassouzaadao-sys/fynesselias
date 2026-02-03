"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/format"
import { X, Loader2, Calendar, CheckCircle, CreditCard } from "lucide-react"

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
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
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

  // Carregar detalhes da fatura
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

  // Carregar bancos quando abrir modal de pagamento
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
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-4 border-b border-fyn-border ${fatura.pago ? "bg-green-50" : "bg-yellow-50"}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-5 w-5 text-fyn-text" />
                <h2 className="text-lg font-semibold text-fyn-text">
                  Fatura {mesNome}/{fatura.anoReferencia}
                </h2>
              </div>
              {fatura.cartao && (
                <p className="text-sm text-fyn-muted">
                  {fatura.cartao.nome} (**** {fatura.cartao.ultimos4Digitos})
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Status e Valor */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-fyn-muted">Valor Total</p>
              <p className="text-2xl font-bold text-fyn-text">
                {formatCurrency(fatura.valorTotal)}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                fatura.pago
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
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
              <p className="text-xs text-fyn-muted mt-1">
                Vencimento: {formatDate(new Date(fatura.dataVencimento))}
              </p>
            </div>
          </div>
        </div>

        {/* Lançamentos */}
        <div className="p-4 overflow-y-auto flex-1">
          <h3 className="text-sm font-medium text-fyn-text mb-3">Lançamentos</h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-fyn-muted" />
            </div>
          ) : lancamentos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-fyn-muted">Nenhum lançamento nesta fatura</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lancamentos.map((lanc) => (
                <div
                  key={lanc.id}
                  className="flex items-center justify-between p-3 bg-fyn-surface rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-fyn-text">{lanc.descricao}</p>
                    <p className="text-xs text-fyn-muted">
                      {lanc.beneficiario && `${lanc.beneficiario} • `}
                      {lanc.numeroParcela && `Parcela ${lanc.numeroParcela} • `}
                      {formatDate(new Date(lanc.criadoEm))}
                    </p>
                  </div>
                  <p className="font-medium text-fyn-text">{formatCurrency(lanc.valor)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!fatura.pago && (
          <div className="border-t border-fyn-border p-4">
            <Button className="w-full" onClick={() => setShowPagarModal(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Pagar Fatura
            </Button>
          </div>
        )}

        {fatura.pago && fatura.dataPagamento && (
          <div className="border-t border-fyn-border p-4 bg-green-50">
            <p className="text-sm text-center text-green-700">
              Paga em {formatDate(new Date(fatura.dataPagamento))}
            </p>
          </div>
        )}
      </Card>

      {/* Modal de Confirmação de Pagamento */}
      {showPagarModal && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-fyn-text mb-4">Confirmar Pagamento</h3>

            <p className="text-sm text-fyn-muted mb-4">
              Você está prestes a pagar a fatura de <strong>{mesNome}/{fatura.anoReferencia}</strong> no valor de{" "}
              <strong>{formatCurrency(fatura.valorTotal)}</strong>.
            </p>

            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-fyn-text">
                  Banco de Pagamento (opcional)
                </label>
                <Select value={bancoSelecionado} onValueChange={setBancoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
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
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPagarModal(false)}
                disabled={isPaying}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handlePagar}
                disabled={isPaying}
              >
                {isPaying ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Pagando...
                  </>
                ) : (
                  "Confirmar Pagamento"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
