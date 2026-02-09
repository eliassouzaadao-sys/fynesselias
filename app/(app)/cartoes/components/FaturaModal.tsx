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
import { Loader2, Calendar, CheckCircle, CreditCard, Receipt, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react"

interface Fatura {
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

interface FaturaModalProps {
  fatura: Fatura
  cartaoId: number
  onClose: () => void
  onPago: () => void
}

const meses = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function FaturaModal({ fatura: faturaInicial, cartaoId, onClose, onPago }: FaturaModalProps) {
  const [faturaAtual, setFaturaAtual] = useState<Fatura>(faturaInicial)
  const [faturas, setFaturas] = useState<Fatura[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFaturas, setLoadingFaturas] = useState(true)
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [totalLancamentos, setTotalLancamentos] = useState(0)
  const [quantidadeLancamentos, setQuantidadeLancamentos] = useState(0)
  const [showPagarModal, setShowPagarModal] = useState(false)
  const [bancos, setBancos] = useState<any[]>([])
  const [bancoSelecionado, setBancoSelecionado] = useState("")
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mesNome = meses[faturaAtual.mesReferencia - 1]

  // Carregar todas as faturas do cartão
  useEffect(() => {
    const fetchFaturas = async () => {
      try {
        setLoadingFaturas(true)
        const res = await fetch(`/api/cartoes/${cartaoId}/faturas`)
        const data = await res.json()
        const faturasCarregadas = Array.isArray(data) ? data : []
        setFaturas(faturasCarregadas)

        // Sincronizar a fatura atual com os dados atualizados da lista
        const faturaAtualizada = faturasCarregadas.find((f: Fatura) => f.id === faturaAtual.id)
        if (faturaAtualizada) {
          setFaturaAtual(faturaAtualizada)
        }
      } catch (err) {
        console.error("Erro ao carregar faturas:", err)
        setFaturas([])
      } finally {
        setLoadingFaturas(false)
      }
    }
    fetchFaturas()
  }, [cartaoId])

  // Carregar detalhes da fatura atual
  useEffect(() => {
    const fetchFatura = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/faturas/${faturaAtual.id}`)
        const data = await res.json()
        setLancamentos(data.lancamentos || [])
        setTotalLancamentos(data.totalLancamentos || 0)
        setQuantidadeLancamentos(data.quantidadeLancamentos || 0)
      } catch (err) {
        console.error("Erro ao carregar fatura:", err)
        setLancamentos([])
        setTotalLancamentos(0)
        setQuantidadeLancamentos(0)
      } finally {
        setLoading(false)
      }
    }
    fetchFatura()
  }, [faturaAtual.id])

  // Encontrar índice atual e navegar
  // As faturas vêm ordenadas do mais recente para o mais antigo (desc)
  // Então índice 0 = mais recente, último índice = mais antigo
  const faturaIndex = faturas.findIndex(f => f.id === faturaAtual.id)

  // temAnterior = há meses mais antigos (índices maiores)
  const temAnterior = faturas.length > 1 && faturaIndex >= 0 && faturaIndex < faturas.length - 1
  // temProxima = há meses mais recentes (índices menores)
  const temProxima = faturas.length > 1 && faturaIndex > 0

  const navegarAnterior = () => {
    if (faturaIndex >= 0 && faturaIndex < faturas.length - 1) {
      setFaturaAtual(faturas[faturaIndex + 1])
    }
  }

  const navegarProxima = () => {
    if (faturaIndex > 0) {
      setFaturaAtual(faturas[faturaIndex - 1])
    }
  }

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
      const response = await fetch(`/api/faturas/${faturaAtual.id}`, {
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
          <div className={`p-6 ${faturaAtual.pago ? "bg-green-50 dark:bg-green-950/30" : "bg-yellow-50 dark:bg-yellow-950/30"}`}>
            <DialogHeader className="space-y-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-foreground" />
                    Fatura
                  </DialogTitle>
                  {faturaAtual.cartao && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {faturaAtual.cartao.nome} (**** {faturaAtual.cartao.ultimos4Digitos})
                    </p>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Navegação de Meses */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={navegarAnterior}
                disabled={!temAnterior || loadingFaturas}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[160px] text-center">
                <span className="text-lg font-semibold">
                  {mesNome}/{faturaAtual.anoReferencia}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={navegarProxima}
                disabled={!temProxima || loadingFaturas}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Status e Valor */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Valor do Mês</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalLancamentos)}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  faturaAtual.pago
                    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                }`}>
                  {faturaAtual.pago ? (
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
                  Vencimento: {formatDate(new Date(faturaAtual.dataVencimento))}
                </p>
              </div>
            </div>
          </div>

          {/* Resumo dos Lancamentos */}
          <div className="px-6 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Detalhamento da Fatura</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">{quantidadeLancamentos} lançamento{quantidadeLancamentos !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Lista de Lancamentos */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[280px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : lancamentos.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum lancamento nesta fatura</p>
                  <p className="text-xs text-muted-foreground mt-1">Compras feitas no cartao aparecerao aqui</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {lancamentos.map((lanc) => (
                    <div
                      key={lanc.id}
                      className="flex items-start justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{lanc.descricao}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          {(lanc.beneficiario || lanc.pessoa?.nome) && (
                            <span className="text-xs text-muted-foreground">
                              {lanc.pessoa?.nome || lanc.beneficiario}
                            </span>
                          )}
                          {lanc.numeroParcela && (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                              Parcela {lanc.numeroParcela}
                            </span>
                          )}
                          {lanc.codigoTipo && (
                            <span className="text-xs text-muted-foreground">
                              {lanc.codigoTipo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Data: {formatDate(new Date(lanc.vencimento))}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-foreground">{formatCurrency(lanc.valor)}</p>
                        {lanc.pago && (
                          <span className="text-xs text-green-600">Pago</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Total da Fatura */}
          {!loading && lancamentos.length > 0 && (
            <div className="px-6 py-3 border-t border-border bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total dos Lancamentos</span>
                <span className="text-lg font-bold text-foreground">{formatCurrency(totalLancamentos)}</span>
              </div>
              {Math.abs(totalLancamentos - faturaAtual.valorTotal) > 0.01 && (
                <p className="text-xs text-amber-600 mt-1">
                  * O valor total da fatura ({formatCurrency(faturaAtual.valorTotal)}) pode incluir encargos ou ajustes
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          {!faturaAtual.pago ? (
            <DialogFooter className="border-t border-border p-4">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button onClick={() => setShowPagarModal(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Pagar Fatura
              </Button>
            </DialogFooter>
          ) : faturaAtual.dataPagamento ? (
            <div className="border-t border-border p-4 bg-green-50 dark:bg-green-950/30">
              <p className="text-sm text-center text-green-700 dark:text-green-300">
                Paga em {formatDate(new Date(faturaAtual.dataPagamento))}
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
              Voce esta prestes a pagar a fatura de <strong>{mesNome}/{faturaAtual.anoReferencia}</strong> no valor de{" "}
              <strong>{formatCurrency(faturaAtual.valorTotal)}</strong>.
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
