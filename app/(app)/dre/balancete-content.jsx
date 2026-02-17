"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/format"
import { Download, ChevronDown, ChevronRight, RefreshCw, Calendar } from "lucide-react"

// Componente para exibir uma conta individual no balancete
function ContaRow({ conta, isSubconta = false }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-1.5 text-sm hover:bg-muted/30 ${isSubconta ? "pl-8" : ""}`}
    >
      <div className="flex items-center gap-2 flex-1">
        <span className="text-muted-foreground font-mono text-xs w-12">{conta.codigo}</span>
        <span className="text-muted-foreground">-</span>
        <span className="truncate">
          {conta.nome}
          {conta.fornecedor && conta.fornecedor !== "Outros" && (
            <span className="ml-1 text-muted-foreground">- {conta.fornecedor}</span>
          )}
        </span>
      </div>
      <span className="w-32 text-right font-medium shrink-0">
        {formatCurrency(conta.valor)}
      </span>
    </div>
  )
}

// Componente para exibir uma categoria do balancete (com expansao)
function CategoriaRow({ categoria, isExpanded, onToggle }) {
  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/50 cursor-pointer border-b border-border/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 flex-1">
          {categoria.contas.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )
          ) : (
            <span className="w-4" />
          )}
          <span className="text-muted-foreground font-mono text-xs w-10">{categoria.codigo}</span>
          <span className="text-muted-foreground">-</span>
          <span className="font-medium">{categoria.nome}</span>
        </div>
        <span className="w-32 text-right font-semibold shrink-0">
          {formatCurrency(categoria.total)}
        </span>
      </div>

      {/* Contas da categoria */}
      {isExpanded && categoria.contas.length > 0 && (
        <div className="bg-muted/20 border-b border-border/30">
          {categoria.contas.map((conta, idx) => (
            <ContaRow key={idx} conta={conta} isSubconta />
          ))}
        </div>
      )}
    </>
  )
}

// Componente para exibir uma secao (RECEITAS ou DESPESAS)
function SecaoBalancete({ titulo, categorias, cor, expandedItems, setExpandedItems, secaoKey }) {
  const total = categorias.reduce((acc, cat) => acc + cat.total, 0)
  const isSecaoExpanded = expandedItems[`secao-${secaoKey}`] !== false // default expanded

  const toggleSecao = () => {
    setExpandedItems(prev => ({
      ...prev,
      [`secao-${secaoKey}`]: !isSecaoExpanded
    }))
  }

  const toggleCategoria = (codigo) => {
    setExpandedItems(prev => ({
      ...prev,
      [codigo]: !prev[codigo]
    }))
  }

  if (categorias.length === 0) return null

  return (
    <div className="border-b border-border">
      {/* Header da secao */}
      <button
        onClick={toggleSecao}
        className={`flex w-full items-center justify-between px-4 py-3 text-left hover:opacity-90 ${cor} font-bold`}
      >
        <div className="flex items-center gap-2">
          {isSecaoExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="text-sm uppercase tracking-wide">{titulo}</span>
        </div>
      </button>

      {/* Categorias */}
      {isSecaoExpanded && (
        <div>
          {categorias.map((categoria, idx) => (
            <CategoriaRow
              key={idx}
              categoria={categoria}
              isExpanded={expandedItems[categoria.codigo]}
              onToggle={() => toggleCategoria(categoria.codigo)}
            />
          ))}
          {/* Total da secao */}
          <div className={`flex items-center justify-between px-4 py-2 ${cor} font-bold`}>
            <span className="text-sm">TOTAL DE {titulo}</span>
            <span className="w-32 text-right text-sm">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function BalanceteContent() {
  // Inicializar com o primeiro e ultimo dia do mes atual
  const hoje = new Date()
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split("T")[0]
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split("T")[0]

  const [loading, setLoading] = useState(true)
  const [balanceteData, setBalanceteData] = useState(null)
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes)
  const [dataFim, setDataFim] = useState(ultimoDiaMes)
  const [expandedItems, setExpandedItems] = useState({})

  async function fetchBalanceteData() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dataInicio) params.append("dataInicio", dataInicio)
      if (dataFim) params.append("dataFim", dataFim)
      const res = await fetch(`/api/balancete?${params.toString()}`)
      const data = await res.json()
      setBalanceteData(data)
    } catch (error) {
      console.error("Erro ao buscar dados do Balancete:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalanceteData()
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

  if (!balanceteData) {
    return (
      <div className="space-y-4">
        <div className="text-center py-20 text-muted-foreground">
          Nao foi possivel carregar os dados do Balancete.
          <Button variant="outline" size="sm" className="ml-4" onClick={fetchBalanceteData}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const { periodo, receitas, despesas, totais } = balanceteData

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
        <Button variant="ghost" size="sm" onClick={fetchBalanceteData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button variant="secondary" size="sm">
          <Download className="mr-1 h-3.5 w-3.5" />
          Exportar
        </Button>
      </div>

      {/* Aviso sobre validade gerencial */}
      <div className="text-xs text-gray-400 px-1 italic">
        Periodo: {periodo} - Este e um balancete gerencial, sem validade fiscal ou contabil.
      </div>

      <div className="rounded border border-border bg-card overflow-hidden">
        {/* RECEITAS */}
        <SecaoBalancete
          titulo="RECEITAS"
          categorias={receitas}
          cor="bg-green-600/90 text-white"
          expandedItems={expandedItems}
          setExpandedItems={setExpandedItems}
          secaoKey="receitas"
        />

        {/* DESPESAS */}
        <SecaoBalancete
          titulo="DESPESAS"
          categorias={despesas}
          cor="bg-red-600/90 text-white"
          expandedItems={expandedItems}
          setExpandedItems={setExpandedItems}
          secaoKey="despesas"
        />

        {/* SALDO FINAL */}
        <div className={`flex items-center justify-between px-4 py-3 font-bold ${totais.saldo >= 0 ? "bg-primary text-white" : "bg-red-700 text-white"}`}>
          <span className="text-sm uppercase tracking-wide">
            {totais.saldo >= 0 ? "SUPERAVIT" : "DEFICIT"} DO PERIODO
          </span>
          <span className="w-32 text-right text-sm">{formatCurrency(Math.abs(totais.saldo))}</span>
        </div>
      </div>

      {/* Mensagem quando vazio */}
      {receitas.length === 0 && despesas.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <p className="mb-2">Nenhuma movimentacao encontrada no periodo.</p>
          <p className="text-xs">Adicione movimentacoes no Fluxo de Caixa para visualizar o Balancete.</p>
        </div>
      )}
    </div>
  )
}
