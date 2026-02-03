"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatPercentage } from "@/lib/format"
import { Download, ChevronDown, ChevronRight, RefreshCw } from "lucide-react"

function DreSection({ title, items, isExpanded, onToggle }) {
  const total = items.reduce((acc, item) => acc + item.atual, 0)
  const totalAnterior = items.reduce((acc, item) => acc + item.anterior, 0)
  const variacao = totalAnterior !== 0 ? ((total - totalAnterior) / Math.abs(totalAnterior)) * 100 : 0

  if (items.length === 0) return null

  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted bg-muted/50 font-medium"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <span className={`w-24 sm:w-28 text-right font-semibold ${total < 0 ? "text-red-600" : ""}`}>
            {formatCurrency(total)}
          </span>
          <span className="w-24 sm:w-28 text-right text-muted-foreground hidden sm:block">
            {formatCurrency(totalAnterior)}
          </span>
          <span className={`w-16 sm:w-20 text-right ${variacao >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {variacao >= 0 ? "+" : ""}
            {formatPercentage(variacao)}
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="border-l-2 border-border ml-4">
          {items.map((item, idx) => {
            const itemVariacao =
              item.anterior !== 0 ? ((item.atual - item.anterior) / Math.abs(item.anterior)) * 100 : 0
            return (
              <div key={idx} className="flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50">
                <span className="pl-4 text-foreground truncate flex-1">
                  <span className="text-muted-foreground mr-2">{item.sigla}</span>
                  {item.name}
                </span>
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <span className={`w-24 sm:w-28 text-right ${item.atual < 0 ? "text-red-600" : ""}`}>
                    {formatCurrency(item.atual)}
                  </span>
                  <span className="w-24 sm:w-28 text-right text-muted-foreground hidden sm:block">
                    {formatCurrency(item.anterior)}
                  </span>
                  <span className={`w-16 sm:w-20 text-right ${itemVariacao >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {itemVariacao >= 0 ? "+" : ""}
                    {formatPercentage(itemVariacao)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ResultRow({ title, atual, anterior, isFinal = false }) {
  const variacao = anterior !== 0 ? ((atual - anterior) / Math.abs(anterior)) * 100 : 0

  if (isFinal) {
    return (
      <div className="flex items-center justify-between bg-primary px-3 py-3 text-white">
        <span className="text-sm font-bold">{title}</span>
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-bold">
          <span className="w-24 sm:w-28 text-right">{formatCurrency(atual)}</span>
          <span className="w-24 sm:w-28 text-right opacity-70 hidden sm:block">{formatCurrency(anterior)}</span>
          <span className={`w-16 sm:w-20 text-right ${variacao >= 0 ? "text-green-300" : "text-red-300"}`}>
            {variacao >= 0 ? "+" : ""}
            {formatPercentage(variacao)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-2">
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold">
        <span className={`w-24 sm:w-28 text-right ${atual < 0 ? "text-red-600" : ""}`}>
          {formatCurrency(atual)}
        </span>
        <span className="w-24 sm:w-28 text-right text-muted-foreground hidden sm:block">
          {formatCurrency(anterior)}
        </span>
        <span className={`w-16 sm:w-20 text-right ${variacao >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {variacao >= 0 ? "+" : ""}
          {formatPercentage(variacao)}
        </span>
      </div>
    </div>
  )
}

export function DreContent() {
  const [loading, setLoading] = useState(true)
  const [dreData, setDreData] = useState(null)
  const [expanded, setExpanded] = useState({
    receitaBruta: true,
    despesasOperacionais: true,
  })

  async function fetchDreData() {
    try {
      setLoading(true)
      const res = await fetch("/api/dre")
      const data = await res.json()
      setDreData(data)
    } catch (error) {
      console.error("Erro ao buscar dados da DRE:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDreData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="DRE - Demonstracao do Resultado"
          description="Carregando dados..."
        />
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!dreData) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="DRE - Demonstracao do Resultado"
          description="Erro ao carregar dados"
        />
        <div className="text-center py-20 text-muted-foreground">
          Nao foi possivel carregar os dados da DRE.
          <Button variant="outline" size="sm" className="ml-4" onClick={fetchDreData}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const { mesAtual, mesAnterior, receitaBruta, despesasOperacionais, totais } = dreData

  return (
    <div className="space-y-4">
      <PageHeader
        title="DRE - Demonstracao do Resultado"
        description={`${mesAtual} vs ${mesAnterior}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={fetchDreData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm">
              <Download className="mr-1 h-3.5 w-3.5" />
              Exportar
            </Button>
          </div>
        }
      />

      {/* Aviso sobre validade gerencial */}
      <div className="text-xs text-gray-400 px-1 italic">
        Esta e uma DRE apenas gerencial, sem validade fiscal ou contabil.
      </div>

      <div className="rounded border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-primary px-3 py-2 text-white">
          <span className="text-sm font-medium">Conta</span>
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <span className="w-24 sm:w-28 text-right">{mesAtual}</span>
            <span className="w-24 sm:w-28 text-right hidden sm:block">{mesAnterior}</span>
            <span className="w-16 sm:w-20 text-right">Var. %</span>
          </div>
        </div>

        {/* Receita Bruta */}
        <DreSection
          title="(+) Receita Bruta"
          items={receitaBruta}
          isExpanded={expanded.receitaBruta}
          onToggle={() => setExpanded({ ...expanded, receitaBruta: !expanded.receitaBruta })}
        />

        {/* Receita Líquida (por enquanto igual à bruta, sem deduções) */}
        <ResultRow
          title="(=) Receita Liquida"
          atual={totais.receitaBruta.atual}
          anterior={totais.receitaBruta.anterior}
        />

        {/* Despesas Operacionais */}
        <DreSection
          title="(-) Despesas Operacionais"
          items={despesasOperacionais}
          isExpanded={expanded.despesasOperacionais}
          onToggle={() => setExpanded({ ...expanded, despesasOperacionais: !expanded.despesasOperacionais })}
        />

        {/* Resultado Líquido */}
        <ResultRow
          title="(=) RESULTADO LIQUIDO"
          atual={totais.resultado.atual}
          anterior={totais.resultado.anterior}
          isFinal
        />
      </div>

      {/* Resumo visual */}
      {receitaBruta.length === 0 && despesasOperacionais.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <p className="mb-2">Nenhuma movimentacao encontrada no periodo.</p>
          <p className="text-xs">Adicione movimentacoes no Fluxo de Caixa com centros de custo para visualizar a DRE.</p>
        </div>
      )}
    </div>
  )
}
