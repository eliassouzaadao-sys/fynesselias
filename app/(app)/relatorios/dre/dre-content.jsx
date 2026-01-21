"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatPercentage } from "@/lib/format"
import { Download, ChevronDown, ChevronRight } from "lucide-react"

const dreData = {
  receitaBruta: [
    { name: "Vendas de Produtos", atual: 65000, anterior: 58000 },
    { name: "Prestação de Serviços", atual: 23000, anterior: 20000 },
  ],
  deducoes: [
    { name: "Impostos sobre Vendas", atual: -8800, anterior: -7800 },
    { name: "Devoluções", atual: -1200, anterior: -800 },
  ],
  custosVendas: [
    { name: "CMV - Custo Mercadorias", atual: -32000, anterior: -30000 },
    { name: "Custo Serviços Prestados", atual: -8000, anterior: -7500 },
  ],
  despesasOperacionais: [
    { name: "Despesas Administrativas", atual: -12500, anterior: -11000 },
    { name: "Despesas Comerciais", atual: -8000, anterior: -7000 },
    { name: "Despesas com Pessoal", atual: -15000, anterior: -14500 },
  ],
  outrasReceitas: [
    { name: "Receitas Financeiras", atual: 850, anterior: 720 },
    { name: "Outras Receitas", atual: 350, anterior: 280 },
  ],
  outrasDespesas: [
    { name: "Despesas Financeiras", atual: -1200, anterior: -1100 },
    { name: "Outras Despesas", atual: -500, anterior: -400 },
  ],
}

function DreSection({ title, items, isExpanded, onToggle, level = 0 }) {
  const total = items.reduce((acc, item) => acc + item.atual, 0)
  const totalAnterior = items.reduce((acc, item) => acc + item.anterior, 0)
  const variacao = totalAnterior !== 0 ? ((total - totalAnterior) / Math.abs(totalAnterior)) * 100 : 0

  return (
    <div className={`${level === 0 ? "border-b border-fyn-border" : ""}`}>
      <button
        onClick={onToggle}
        className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-fyn-surface ${
          level === 0 ? "bg-fyn-surface font-medium" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-fyn-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-fyn-muted" />
          )}
          <span className={`text-sm ${level === 0 ? "font-medium text-fyn-text" : "text-fyn-text"}`}>{title}</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span className={`w-28 text-right ${total < 0 ? "text-fyn-danger" : ""}`}>{formatCurrency(total)}</span>
          <span className="w-28 text-right text-fyn-muted">{formatCurrency(totalAnterior)}</span>
          <span className={`w-20 text-right ${variacao >= 0 ? "text-fyn-success" : "text-fyn-danger"}`}>
            {variacao >= 0 ? "+" : ""}
            {formatPercentage(variacao)}
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="border-l-2 border-fyn-border ml-4">
          {items.map((item, idx) => {
            const itemVariacao =
              item.anterior !== 0 ? ((item.atual - item.anterior) / Math.abs(item.anterior)) * 100 : 0
            return (
              <div key={idx} className="flex items-center justify-between px-3 py-1.5 text-sm hover:bg-fyn-surface/50">
                <span className="pl-4 text-fyn-text">{item.name}</span>
                <div className="flex items-center gap-6">
                  <span className={`w-28 text-right ${item.atual < 0 ? "text-fyn-danger" : ""}`}>
                    {formatCurrency(item.atual)}
                  </span>
                  <span className="w-28 text-right text-fyn-muted">{formatCurrency(item.anterior)}</span>
                  <span className={`w-20 text-right ${itemVariacao >= 0 ? "text-fyn-success" : "text-fyn-danger"}`}>
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

export function DreContent() {
  const [expanded, setExpanded] = useState({
    receitaBruta: true,
    deducoes: true,
    custosVendas: true,
    despesasOperacionais: true,
    outrasReceitas: false,
    outrasDespesas: false,
  })

  const receitaBrutaTotal = dreData.receitaBruta.reduce((a, b) => a + b.atual, 0)
  const deducoesTotal = dreData.deducoes.reduce((a, b) => a + b.atual, 0)
  const receitaLiquida = receitaBrutaTotal + deducoesTotal
  const custosTotal = dreData.custosVendas.reduce((a, b) => a + b.atual, 0)
  const lucroBruto = receitaLiquida + custosTotal
  const despesasOpTotal = dreData.despesasOperacionais.reduce((a, b) => a + b.atual, 0)
  const resultadoOperacional = lucroBruto + despesasOpTotal
  const outrasReceitasTotal = dreData.outrasReceitas.reduce((a, b) => a + b.atual, 0)
  const outrasDespesasTotal = dreData.outrasDespesas.reduce((a, b) => a + b.atual, 0)
  const resultadoLiquido = resultadoOperacional + outrasReceitasTotal + outrasDespesasTotal

  return (
    <div className="space-y-4">
      <PageHeader
        title="DRE - Demonstração do Resultado"
        description="Mês atual vs mês anterior"
        actions={
          <Button variant="secondary" size="sm">
            <Download className="mr-1 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
      />

      {/* Aviso sutil sobre validade gerencial */}
      <div className="text-xs text-gray-400 px-1 pb-1" style={{fontStyle: 'italic'}}>
        Esta é uma DRE apenas gerencial, sem validade fiscal ou contábil.
      </div>

      <div className="rounded border border-fyn-border bg-fyn-bg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-fyn-border bg-fyn-primary px-3 py-2 text-white">
          <span className="text-sm font-medium">Conta</span>
          <div className="flex items-center gap-6 text-sm">
            <span className="w-28 text-right">Jan/2026</span>
            <span className="w-28 text-right">Dez/2025</span>
            <span className="w-20 text-right">Var. %</span>
          </div>
        </div>

        {/* Sections */}
        <DreSection
          title="(+) Receita Bruta"
          items={dreData.receitaBruta}
          isExpanded={expanded.receitaBruta}
          onToggle={() => setExpanded({ ...expanded, receitaBruta: !expanded.receitaBruta })}
        />
        <DreSection
          title="(-) Deduções"
          items={dreData.deducoes}
          isExpanded={expanded.deducoes}
          onToggle={() => setExpanded({ ...expanded, deducoes: !expanded.deducoes })}
        />

        {/* Receita Líquida */}
        <div className="flex items-center justify-between border-b border-fyn-border bg-fyn-warm px-3 py-2">
          <span className="text-sm font-semibold text-fyn-text">(=) Receita Líquida</span>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <span className="w-28 text-right">{formatCurrency(receitaLiquida)}</span>
            <span className="w-28 text-right text-fyn-muted">{formatCurrency(70600)}</span>
            <span className="w-20 text-right text-fyn-success">+10.5%</span>
          </div>
        </div>

        <DreSection
          title="(-) Custos das Vendas"
          items={dreData.custosVendas}
          isExpanded={expanded.custosVendas}
          onToggle={() => setExpanded({ ...expanded, custosVendas: !expanded.custosVendas })}
        />

        {/* Lucro Bruto */}
        <div className="flex items-center justify-between border-b border-fyn-border bg-fyn-warm px-3 py-2">
          <span className="text-sm font-semibold text-fyn-text">(=) Lucro Bruto</span>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <span className="w-28 text-right">{formatCurrency(lucroBruto)}</span>
            <span className="w-28 text-right text-fyn-muted">{formatCurrency(33100)}</span>
            <span className="w-20 text-right text-fyn-success">+13.3%</span>
          </div>
        </div>

        <DreSection
          title="(-) Despesas Operacionais"
          items={dreData.despesasOperacionais}
          isExpanded={expanded.despesasOperacionais}
          onToggle={() => setExpanded({ ...expanded, despesasOperacionais: !expanded.despesasOperacionais })}
        />

        {/* Resultado Operacional */}
        <div className="flex items-center justify-between border-b border-fyn-border bg-fyn-warm px-3 py-2">
          <span className="text-sm font-semibold text-fyn-text">(=) Resultado Operacional</span>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <span className={`w-28 text-right ${resultadoOperacional < 0 ? "text-fyn-danger" : ""}`}>
              {formatCurrency(resultadoOperacional)}
            </span>
            <span className="w-28 text-right text-fyn-muted">{formatCurrency(600)}</span>
            <span className="w-20 text-right text-fyn-success">+50.0%</span>
          </div>
        </div>

        <DreSection
          title="(+) Outras Receitas"
          items={dreData.outrasReceitas}
          isExpanded={expanded.outrasReceitas}
          onToggle={() => setExpanded({ ...expanded, outrasReceitas: !expanded.outrasReceitas })}
        />
        <DreSection
          title="(-) Outras Despesas"
          items={dreData.outrasDespesas}
          isExpanded={expanded.outrasDespesas}
          onToggle={() => setExpanded({ ...expanded, outrasDespesas: !expanded.outrasDespesas })}
        />

        {/* Resultado Líquido */}
        <div className="flex items-center justify-between bg-fyn-primary px-3 py-3 text-white">
          <span className="text-sm font-bold">(=) RESULTADO LÍQUIDO</span>
          <div className="flex items-center gap-6 text-sm font-bold">
            <span className="w-28 text-right">{formatCurrency(resultadoLiquido)}</span>
            <span className="w-28 text-right opacity-70">{formatCurrency(100)}</span>
            <span className="w-20 text-right text-fyn-success">+400%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
