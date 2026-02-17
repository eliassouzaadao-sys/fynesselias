"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/format"
import { Download, ChevronDown, ChevronRight, RefreshCw, Calendar } from "lucide-react"

// Componente para exibir uma conta individual (nivel mais baixo)
function ContaRow({ conta, nivel = 3 }) {
  const paddingLeft = nivel * 16

  return (
    <div
      className="flex items-center justify-between px-3 py-1 text-xs hover:bg-muted/30"
      style={{ paddingLeft: `${paddingLeft}px` }}
    >
      <span className="text-muted-foreground truncate flex-1">
        {conta.fornecedor}
        {conta.descricao && <span className="ml-1 text-gray-400">- {conta.descricao}</span>}
      </span>
      <span className={`w-28 text-right shrink-0 ${conta.atual < 0 ? "text-red-600" : ""}`}>
        {formatCurrency(conta.atual)}
      </span>
    </div>
  )
}

// Componente para exibir um centro ou subcentro (com expansao)
function CentroRow({ item, nivel = 1, expandedItems, setExpandedItems }) {
  const hasDetails = (item.contas && item.contas.length > 0) || (item.subcentros && item.subcentros.length > 0)
  const isExpanded = expandedItems[`${nivel}-${item.sigla}`]
  const paddingLeft = nivel * 16

  const toggleExpand = () => {
    if (hasDetails) {
      setExpandedItems(prev => ({
        ...prev,
        [`${nivel}-${item.sigla}`]: !prev[`${nivel}-${item.sigla}`]
      }))
    }
  }

  return (
    <>
      <div
        className={`flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 ${hasDetails ? "cursor-pointer" : ""}`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-2 flex-1 truncate">
          {hasDetails && (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            )
          )}
          {!hasDetails && <span className="w-3" />}
          <span className="text-muted-foreground mr-2 shrink-0">{item.sigla}</span>
          <span className="truncate">{item.name}</span>
        </div>
        <span className={`w-28 text-right font-medium shrink-0 ${item.atual < 0 ? "text-red-600" : ""}`}>
          {formatCurrency(item.atual)}
        </span>
      </div>

      {/* Subcentros */}
      {isExpanded && item.subcentros && item.subcentros.length > 0 && (
        <div className="border-l border-border/50 ml-6">
          {item.subcentros.map((sub, idx) => (
            <CentroRow
              key={idx}
              item={sub}
              nivel={nivel + 1}
              expandedItems={expandedItems}
              setExpandedItems={setExpandedItems}
            />
          ))}
        </div>
      )}

      {/* Contas individuais */}
      {isExpanded && item.contas && item.contas.length > 0 && (
        <div className="border-l border-dashed border-border/30 ml-6 bg-muted/20">
          {item.contas.map((conta, idx) => (
            <ContaRow key={idx} conta={conta} nivel={nivel + 1} />
          ))}
        </div>
      )}
    </>
  )
}

function DreSection({ title, items, isExpanded, onToggle, expandedItems, setExpandedItems }) {
  const total = items.reduce((acc, item) => acc + item.atual, 0)

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
        <span className={`w-28 text-right text-sm font-semibold ${total < 0 ? "text-red-600" : ""}`}>
          {formatCurrency(total)}
        </span>
      </button>
      {isExpanded && (
        <div className="border-l-2 border-border ml-4">
          {items.map((item, idx) => (
            <CentroRow
              key={idx}
              item={item}
              nivel={1}
              expandedItems={expandedItems}
              setExpandedItems={setExpandedItems}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ResultRow({ title, atual, isFinal = false }) {
  if (isFinal) {
    return (
      <div className="flex items-center justify-between bg-primary px-3 py-3 text-white">
        <span className="text-sm font-bold">{title}</span>
        <span className="w-28 text-right text-sm font-bold">{formatCurrency(atual)}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-2">
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className={`w-28 text-right text-sm font-semibold ${atual < 0 ? "text-red-600" : ""}`}>
        {formatCurrency(atual)}
      </span>
    </div>
  )
}

export function DreContent() {
  // Inicializar com o primeiro e último dia do mês atual
  const hoje = new Date()
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split("T")[0]
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split("T")[0]

  const [loading, setLoading] = useState(true)
  const [dreData, setDreData] = useState(null)
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes)
  const [dataFim, setDataFim] = useState(ultimoDiaMes)
  const [expanded, setExpanded] = useState({
    receitaBruta: true,
    despesasOperacionais: true,
  })
  const [expandedItems, setExpandedItems] = useState({})

  async function fetchDreData() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dataInicio) params.append("dataInicio", dataInicio)
      if (dataFim) params.append("dataFim", dataFim)
      const res = await fetch(`/api/dre?${params.toString()}`)
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
  }, [dataInicio, dataFim])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!dreData) {
    return (
      <div className="space-y-4">
        <div className="text-center py-20 text-muted-foreground">
          Nao foi possivel carregar os dados da DRE.
          <Button variant="outline" size="sm" className="ml-4" onClick={fetchDreData}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const { mesAtual, receitaBruta, despesasOperacionais, totais } = dreData

  return (
    <div className="space-y-4">
      {/* Filtros de data */}
      <div className="flex items-center gap-3 flex-wrap">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">De:</span>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ate:</span>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="w-40"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={fetchDreData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button variant="secondary" size="sm">
          <Download className="mr-1 h-3.5 w-3.5" />
          Exportar
        </Button>
      </div>

      {/* Aviso sobre validade gerencial */}
      <div className="text-xs text-gray-400 px-1 italic">
        Periodo: {mesAtual} - Esta e uma DRE apenas gerencial, sem validade fiscal ou contabil.
      </div>

      <div className="rounded border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-primary px-3 py-2 text-white">
          <span className="text-sm font-medium">Conta</span>
          <span className="w-28 text-right text-sm">Valor</span>
        </div>

        {/* Receita Bruta */}
        <DreSection
          title="(+) Receita Bruta"
          items={receitaBruta}
          isExpanded={expanded.receitaBruta}
          onToggle={() => setExpanded({ ...expanded, receitaBruta: !expanded.receitaBruta })}
          expandedItems={expandedItems}
          setExpandedItems={setExpandedItems}
        />

        {/* Receita Líquida (por enquanto igual à bruta, sem deduções) */}
        <ResultRow
          title="(=) Receita Liquida"
          atual={totais.receitaBruta.atual}
        />

        {/* Despesas Operacionais */}
        <DreSection
          title="(-) Despesas Operacionais"
          items={despesasOperacionais}
          isExpanded={expanded.despesasOperacionais}
          onToggle={() => setExpanded({ ...expanded, despesasOperacionais: !expanded.despesasOperacionais })}
          expandedItems={expandedItems}
          setExpandedItems={setExpandedItems}
        />

        {/* Resultado Líquido */}
        <ResultRow
          title="(=) RESULTADO LIQUIDO"
          atual={totais.resultado.atual}
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
