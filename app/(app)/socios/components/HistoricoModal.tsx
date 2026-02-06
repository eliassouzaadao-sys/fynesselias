"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/format"
import { Loader2, Calendar, TrendingDown, Wallet, CheckCircle, Clock, ChevronDown, ChevronUp, History } from "lucide-react"

interface HistoricoItem {
  id: number
  mesReferencia: number
  anoReferencia: number
  periodo: string
  socioId: number
  socioNome: string
  socioCpf: string | null
  proLaboreBase: number
  totalDescontos: number
  proLaboreLiquido: number
  descontos: Array<{
    id: number
    descricao: string
    valor: number
    dataPagamento: string
  }>
  contaGeradaId: number | null
  pago: boolean
  dataPagamento: string | null
  criadoEm: string
}

interface HistoricoModalProps {
  onClose: () => void
}

const meses = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function HistoricoModal({ onClose }: HistoricoModalProps) {
  const [loading, setLoading] = useState(true)
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [porMes, setPorMes] = useState<{ [key: string]: HistoricoItem[] }>({})
  const [totais, setTotais] = useState({
    totalBase: 0,
    totalDescontos: 0,
    totalLiquido: 0,
    quantidadeRegistros: 0,
  })
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear().toString())
  const [expandido, setExpandido] = useState<string | null>(null)

  const loadHistorico = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/socios/historico?ano=${anoSelecionado}`)
      const data = await res.json()

      setHistorico(data.historico || [])
      setPorMes(data.porMes || {})
      setTotais(data.totais || { totalBase: 0, totalDescontos: 0, totalLiquido: 0, quantidadeRegistros: 0 })
    } catch (e) {
      console.error("Erro ao carregar historico:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistorico()
  }, [anoSelecionado])

  const toggleExpandir = (periodo: string) => {
    setExpandido(expandido === periodo ? null : periodo)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historico de Pro-labore
          </DialogTitle>
          <DialogDescription>
            Pagamentos gerados por mes
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="px-6 py-3 border-y bg-muted/30 flex items-center gap-4">
          <Label htmlFor="ano" className="text-sm">Ano:</Label>
          <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
            <SelectTrigger id="ano" className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(ano => (
                <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Body */}
        <ScrollArea className="h-[50vh] px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(porMes).length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum historico encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Nao ha registros de pro-labore para {anoSelecionado}
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Totais do Ano */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-xs text-green-600/80 dark:text-green-400/80">Total Bruto</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(totais.totalBase)}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80">Total Descontos</p>
                      <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(totais.totalDescontos)}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Total Liquido</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totais.totalLiquido)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Lista por Mes */}
              {Object.entries(porMes)
                .sort(([a], [b]) => {
                  const [mesA, anoA] = a.split('/').map(Number)
                  const [mesB, anoB] = b.split('/').map(Number)
                  return (anoB * 100 + mesB) - (anoA * 100 + mesA)
                })
                .map(([periodo, items]) => {
                  const [mes] = periodo.split('/').map(Number)
                  const mesNome = meses[mes - 1]
                  const totalMesBase = items.reduce((acc, h) => acc + h.proLaboreBase, 0)
                  const totalMesDescontos = items.reduce((acc, h) => acc + h.totalDescontos, 0)
                  const totalMesLiquido = items.reduce((acc, h) => acc + h.proLaboreLiquido, 0)
                  const isExpanded = expandido === periodo

                  return (
                    <Collapsible
                      key={periodo}
                      open={isExpanded}
                      onOpenChange={() => toggleExpandir(periodo)}
                    >
                      <Card className="overflow-hidden">
                        {/* Header do Mes */}
                        <CollapsibleTrigger asChild>
                          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Calendar className="h-4 w-4 text-primary" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-foreground">{mesNome} {periodo.split('/')[1]}</p>
                                <p className="text-xs text-muted-foreground">{items.length} socio(s)</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Liquido Total</p>
                                <p className="font-semibold text-foreground">{formatCurrency(totalMesLiquido)}</p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        {/* Detalhes Expandidos */}
                        <CollapsibleContent>
                          <div className="border-t border-border p-4 bg-muted/20 space-y-3">
                            {items.map(item => (
                              <div key={item.id} className="p-3 bg-background rounded-lg border border-border">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{item.socioNome}</span>
                                    {item.pago ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-800/50 dark:text-green-300 rounded-full">
                                        <CheckCircle className="h-3 w-3" />
                                        Pago
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-800/50 dark:text-yellow-300 rounded-full">
                                        <Clock className="h-3 w-3" />
                                        Pendente
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-semibold text-primary">{formatCurrency(item.proLaboreLiquido)}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">Base</p>
                                    <p className="font-medium">{formatCurrency(item.proLaboreBase)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Descontos</p>
                                    <p className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(item.totalDescontos)}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Liquido</p>
                                    <p className="font-medium text-green-600 dark:text-green-400">{formatCurrency(item.proLaboreLiquido)}</p>
                                  </div>
                                </div>

                                {/* Detalhes dos Descontos */}
                                {item.descontos.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Detalhes dos Descontos:</p>
                                    <div className="space-y-1">
                                      {item.descontos.map((d, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                          <span className="text-muted-foreground truncate max-w-[200px]">{d.descricao}</span>
                                          <span className="text-red-600 dark:text-red-400">-{formatCurrency(d.valor)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Resumo do Mes */}
                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-foreground">Resumo do Mes</span>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">Base: <span className="font-medium text-foreground">{formatCurrency(totalMesBase)}</span></span>
                                  <span className="text-muted-foreground">Desc: <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(totalMesDescontos)}</span></span>
                                  <span className="text-muted-foreground">Liquido: <span className="font-semibold text-primary">{formatCurrency(totalMesLiquido)}</span></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  )
                })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
