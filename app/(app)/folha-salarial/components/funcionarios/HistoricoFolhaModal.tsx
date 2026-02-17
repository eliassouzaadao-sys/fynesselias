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
import { Loader2, Calendar, Wallet, TrendingDown, Building2, CheckCircle, Clock, Briefcase } from "lucide-react"

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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-orange-600" />
            Histórico de Folha - {funcionario.nome}
          </DialogTitle>
          <DialogDescription>
            CPF: {formatCPF(funcionario.cpf)}
            {funcionario.cargo && ` • ${funcionario.cargo}`}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo atual */}
        <div className="px-6 py-4 bg-muted/30 border-y">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-muted-foreground">Salário Atual</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs text-muted-foreground">Bruto</span>
              </div>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                {formatCurrency(funcionario.salarioBruto)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-muted-foreground">Líquido Est.</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {formatCurrency(historico[0]?.salarioLiquido || funcionario.salarioBruto * 0.85)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-xs text-muted-foreground">Custo Empresa</span>
              </div>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                {formatCurrency(historico[0]?.custoEmpresa || funcionario.salarioBruto * 1.35)}
              </p>
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className="flex-1 overflow-hidden">
          <div className="px-6 pt-4 pb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Histórico de Pagamentos</span>
          </div>

          <ScrollArea className="h-[280px] px-6">
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
              <div className="space-y-3 pb-4">
                {historico.map((item) => (
                  <Card
                    key={item.id}
                    className={`p-4 ${item.pago ? "bg-green-50 dark:bg-green-900/20" : "bg-yellow-50 dark:bg-yellow-900/20"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
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

                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Bruto</p>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          {formatCurrency(item.salarioBruto)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Descontos</p>
                        <p className="font-medium text-red-700 dark:text-red-400">
                          -{formatCurrency(item.inss + item.irrf + item.outrosDescontos)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Líquido</p>
                        <p className="font-bold text-blue-700 dark:text-blue-400">
                          {formatCurrency(item.salarioLiquido)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Custo Emp.</p>
                        <p className="font-medium text-orange-700 dark:text-orange-400">
                          {formatCurrency(item.custoEmpresa)}
                        </p>
                      </div>
                    </div>

                    {/* Detalhes dos encargos */}
                    <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">INSS:</span>
                        <span className="text-red-600">-{formatCurrency(item.inss)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IRRF:</span>
                        <span className="text-red-600">-{formatCurrency(item.irrf)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">FGTS:</span>
                        <span className="text-orange-600">{formatCurrency(item.fgts)}</span>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Totais */}
                {historico.length > 0 && (
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Total do Período</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Bruto: <span className="font-medium text-green-600">{formatCurrency(totais.totalBruto)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Líquido: <span className="font-medium text-blue-600">{formatCurrency(totais.totalLiquido)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Custo: <span className="font-bold text-orange-600">{formatCurrency(totais.totalCusto)}</span>
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

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
