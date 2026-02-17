"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/format"
import { Loader2, Calendar, Wallet, TrendingDown, Building2, CheckCircle, Clock, Briefcase, Receipt, Gift } from "lucide-react"

interface Funcionario {
  id: number
  nome: string
  cpf: string
  cargo: string | null
  salarioBruto: number
  status: string
}

interface HistoricoItem {
  id: number
  mesReferencia: number
  anoReferencia: number
  salarioBruto: number
  inss: number
  irrf: number
  fgts: number
  valeTransporte: number
  valeRefeicao: number
  planoSaude: number
  outrosDescontos: number
  salarioLiquido: number
  custoEmpresa: number
  pago: boolean
  dataPagamento: string | null
}

interface HistoricoFolhaModalProps {
  funcionario: Funcionario
  onClose: () => void
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function HistoricoFolhaModal({ funcionario, onClose }: HistoricoFolhaModalProps) {
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/funcionarios/${funcionario.id}/folha`)
        const data = await res.json()
        setHistorico(data.historico || [])
      } catch (e) {
        console.error("Erro ao carregar histórico:", e)
        setHistorico([])
      } finally {
        setLoading(false)
      }
    }
    fetchHistorico()
  }, [funcionario.id])

  const formatCPF = (cpf: string) => {
    if (!cpf) return "-"
    const cleaned = cpf.replace(/\D/g, "")
    if (cleaned.length !== 11) return cpf
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }

  // Calcular totais do histórico
  const totais = historico.reduce(
    (acc, item) => ({
      totalBruto: acc.totalBruto + item.salarioBruto,
      totalLiquido: acc.totalLiquido + item.salarioLiquido,
      totalCusto: acc.totalCusto + item.custoEmpresa,
    }),
    { totalBruto: 0, totalLiquido: 0, totalCusto: 0 }
  )

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[80vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="p-3 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-orange-600" />
            Folha - {funcionario.nome}
          </DialogTitle>
          <DialogDescription className="text-xs">
            CPF: {formatCPF(funcionario.cpf)}
            {funcionario.cargo && ` • ${funcionario.cargo}`}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo atual */}
        <div className="px-4 py-2 bg-muted/30 border-y flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Resumo Atual</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Wallet className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-[10px] text-muted-foreground">Bruto</span>
              </div>
              <p className="text-sm font-bold text-green-700 dark:text-green-400 truncate">
                {formatCurrency(Number(funcionario.salarioBruto) || 0)}
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingDown className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] text-muted-foreground">Líquido</span>
              </div>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-400 truncate">
                {formatCurrency(Number(historico[0]?.salarioLiquido) || Number(funcionario.salarioBruto) * 0.85)}
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Building2 className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                <span className="text-[10px] text-muted-foreground">Custo Emp.</span>
              </div>
              <p className="text-sm font-bold text-orange-700 dark:text-orange-400 truncate">
                {formatCurrency(Number(historico[0]?.custoEmpresa) || Number(funcionario.salarioBruto) * 1.35)}
              </p>
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          <div className="px-4 pt-2 pb-1 flex items-center gap-2 flex-shrink-0">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Histórico de Pagamentos</span>
          </div>

          <ScrollArea className="flex-1 px-4" style={{ maxHeight: '240px' }}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : historico.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum histórico de folha registrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O histórico aparecerá quando a folha for processada
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {historico.map((item) => {
                  const totalDescontos = (Number(item.inss) || 0) + (Number(item.irrf) || 0) + (Number(item.outrosDescontos) || 0)
                  const totalEncargosEmpresa = (Number(item.fgts) || 0) + (Number(item.valeRefeicao) || 0) + (Number(item.planoSaude) || 0)

                  return (
                    <Card key={item.id} className="overflow-hidden border">
                      {/* Header do período */}
                      <div
                        className={`p-4 border-b ${
                          item.pago ? "bg-green-50 dark:bg-green-900/20" : "bg-yellow-50 dark:bg-yellow-900/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">
                              {MESES[item.mesReferencia - 1]}/{item.anoReferencia}
                            </span>
                            {item.pago ? (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-800/50 dark:text-green-300">
                                <CheckCircle className="h-3 w-3" />
                                Pago
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-800/50 dark:text-yellow-300">
                                <Clock className="h-3 w-3" />
                                Pendente
                              </span>
                            )}
                          </div>
                          {item.dataPagamento && (
                            <span className="text-xs text-muted-foreground">
                              Pago em: {new Date(item.dataPagamento).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>

                        {/* Resumo do balancete */}
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="text-center p-1.5 bg-white/50 dark:bg-white/10 rounded">
                            <p className="text-[10px] text-muted-foreground">Bruto</p>
                            <p className="font-semibold text-green-700 dark:text-green-400 truncate">
                              {formatCurrency(Number(item.salarioBruto) || 0)}
                            </p>
                          </div>
                          <div className="text-center p-1.5 bg-white/50 dark:bg-white/10 rounded">
                            <p className="text-[10px] text-muted-foreground">Descontos</p>
                            <p className="font-semibold text-red-700 dark:text-red-400 truncate">
                              -{formatCurrency(totalDescontos)}
                            </p>
                          </div>
                          <div className="text-center p-1.5 bg-white/50 dark:bg-white/10 rounded">
                            <p className="text-[10px] text-muted-foreground">Líquido</p>
                            <p className="font-bold text-blue-700 dark:text-blue-400 truncate">
                              {formatCurrency(Number(item.salarioLiquido) || 0)}
                            </p>
                          </div>
                          <div className="text-center p-1.5 bg-white/50 dark:bg-white/10 rounded">
                            <p className="text-[10px] text-muted-foreground">Custo Emp.</p>
                            <p className="font-semibold text-orange-700 dark:text-orange-400 truncate">
                              {formatCurrency(Number(item.custoEmpresa) || 0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Detalhamento sempre visível */}
                      <div className="p-2 bg-muted/20 space-y-2">
                        {/* Descontos do Funcionário */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Receipt className="h-3 w-3 text-red-600" />
                            <span className="text-[11px] font-medium text-foreground">
                              Descontos
                            </span>
                          </div>
                          <div className="space-y-0.5 pl-4">
                            <div className="flex justify-between items-center text-xs py-1 px-2 rounded bg-red-50 dark:bg-red-900/20">
                              <span className="text-foreground">INSS</span>
                              <span className="text-red-600 font-medium whitespace-nowrap">-{formatCurrency(Number(item.inss) || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs py-1 px-2 rounded bg-red-50 dark:bg-red-900/20">
                              <span className="text-foreground">IRRF</span>
                              <span className="text-red-600 font-medium whitespace-nowrap">-{formatCurrency(Number(item.irrf) || 0)}</span>
                            </div>
                            {(Number(item.valeTransporte) || 0) > 0 && (
                              <div className="flex justify-between items-center text-xs py-1 px-2 rounded bg-red-50 dark:bg-red-900/20">
                                <span className="text-foreground truncate">Vale Transporte</span>
                                <span className="text-red-600 font-medium whitespace-nowrap">-{formatCurrency(Number(item.valeTransporte) || 0)}</span>
                              </div>
                            )}
                            {(Number(item.outrosDescontos) || 0) > 0 && (
                              <div className="flex justify-between items-center text-xs py-1 px-2 rounded bg-red-50 dark:bg-red-900/20">
                                <span className="text-foreground truncate">Outros Descontos</span>
                                <span className="text-red-600 font-medium whitespace-nowrap">-{formatCurrency(Number(item.outrosDescontos) || 0)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-xs py-1.5 px-2 mt-1 border-t border-red-200 dark:border-red-800">
                              <span className="font-medium text-muted-foreground">Total</span>
                              <span className="font-semibold text-red-600 whitespace-nowrap">-{formatCurrency(totalDescontos)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Encargos da Empresa */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Gift className="h-3 w-3 text-orange-600" />
                            <span className="text-[11px] font-medium text-foreground">
                              Encargos Empresa
                            </span>
                          </div>
                          <div className="space-y-0.5 pl-4">
                            <div className="flex justify-between items-center text-xs py-1 px-2 rounded bg-orange-50 dark:bg-orange-900/20">
                              <span className="text-foreground">FGTS</span>
                              <span className="text-orange-600 font-medium whitespace-nowrap">{formatCurrency(Number(item.fgts) || 0)}</span>
                            </div>
                            {(Number(item.valeRefeicao) || 0) > 0 && (
                              <div className="flex justify-between items-center text-xs py-1 px-2 rounded bg-orange-50 dark:bg-orange-900/20">
                                <span className="text-foreground truncate">Vale Refeição</span>
                                <span className="text-orange-600 font-medium whitespace-nowrap">{formatCurrency(Number(item.valeRefeicao) || 0)}</span>
                              </div>
                            )}
                            {(Number(item.planoSaude) || 0) > 0 && (
                              <div className="flex justify-between items-center text-xs py-1 px-2 rounded bg-orange-50 dark:bg-orange-900/20">
                                <span className="text-foreground truncate">Plano de Saúde</span>
                                <span className="text-orange-600 font-medium whitespace-nowrap">{formatCurrency(Number(item.planoSaude) || 0)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-xs py-1.5 px-2 mt-1 border-t border-orange-200 dark:border-orange-800">
                              <span className="font-medium text-muted-foreground">Total</span>
                              <span className="font-semibold text-orange-600 whitespace-nowrap">{formatCurrency(totalEncargosEmpresa)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Resumo Final */}
                        <div className="flex items-center justify-between px-2 py-1.5 bg-primary/5 rounded border border-primary/20 text-[10px]">
                          <span className="text-muted-foreground">Resumo:</span>
                          <div className="flex gap-2">
                            <span className="text-green-600 font-semibold">{formatCurrency(Number(item.salarioBruto) || 0)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-blue-600 font-bold">{formatCurrency(Number(item.salarioLiquido) || 0)}</span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-orange-600 font-bold">{formatCurrency(Number(item.custoEmpresa) || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}

                {/* Totais */}
                {historico.length > 1 && (
                  <Card className="p-2 bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">Total</span>
                      <div className="flex items-center gap-3">
                        <span className="text-green-600 font-medium">{formatCurrency(totais.totalBruto)}</span>
                        <span className="text-blue-600 font-medium">{formatCurrency(totais.totalLiquido)}</span>
                        <span className="text-orange-600 font-bold">{formatCurrency(totais.totalCusto)}</span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full" size="sm">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
