

"use client"
import React from "react"


import { PageHeader } from "@/components/ui/page-header"
import { KpiCard } from "@/components/ui/kpi-card"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatPercentage } from "@/lib/format"
import { AlertTriangle, ArrowRight, Lightbulb } from "lucide-react"
import { Line, Bar } from "@/components/ui/charts"
// import ChartDataLabels from "chartjs-plugin-datalabels"
// import { Chart } from "chart.js"
// Chart.register(ChartDataLabels)
import { useEffect, useState } from "react"

// Mock data
// Dados mock para gráficos
const receitaProjetada = [88000, 90000, 95000, 100000, 105000, 110000, 115000];
const mesesProjecao = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];

const clientesEvolucao = [120, 135, 150, 170, 200, 230, 250];
const mesesClientes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];

const receitaPorProduto = [
  { produto: "Software", valor: 42000 },
  { produto: "Consultoria", valor: 18000 },
  { produto: "Suporte", valor: 9000 },
  { produto: "Treinamento", valor: 6000 },
];
const produtosLabels = receitaPorProduto.map(p => p.produto);
const produtosValores = receitaPorProduto.map(p => p.valor);
const statusDia = {
  caixaAtual: 127450.32,
  previsao30d: 89200.0,
  limiteSeguro: 50000.0,
  exposicaoRisco: 15.2,
}

const empresasData = [
  { empresa: "Tech Solutions ME", caixa: 87450.32, receita: 45000, resultado: 12500, risco: "Baixo" },
  { empresa: "Comércio ABC EPP", caixa: 32000.0, receita: 28000, resultado: -3200, risco: "Médio" },
  { empresa: "Serviços XYZ ME", caixa: 8000.0, receita: 15000, resultado: 2800, risco: "Alto" },
]

const centrosCustoData = [
  { centro: "Operações", receita: 45000, custos: 32000, resultado: 13000, impacto: 42.5 },
  { centro: "Comercial", receita: 28000, custos: 18000, resultado: 10000, impacto: 32.7 },
  { centro: "Administrativo", receita: 0, custos: 8500, resultado: -8500, impacto: -27.8 },
  { centro: "Logística", receita: 15000, custos: 12000, resultado: 3000, impacto: 9.8 },
]

const comparativoMensal = [
  { mes: "Ago", receita: 68000, custos: 52000, resultado: 16000 },
  { mes: "Set", receita: 72000, custos: 58000, resultado: 14000 },
  { mes: "Out", receita: 65000, custos: 48000, resultado: 17000 },
  { mes: "Nov", receita: 78000, custos: 62000, resultado: 16000 },
  { mes: "Dez", receita: 85000, custos: 68000, resultado: 17000 },
  { mes: "Jan", receita: 88000, custos: 70500, resultado: 17500 },
]


const decisoesRecomendadas = [
  {
    tipo: "Cobrança",
    prioridade: "alta",
    descricao: "Distribuidora Norte: 32 dias de atraso",
    valor: "R$ 45.000",
  },
  {
    tipo: "Crédito",
    prioridade: "media",
    descricao: "Comercial Centro: score deteriorando",
    valor: "R$ 22.000",
  },
  {
    tipo: "Fluxo",
    prioridade: "alta",
    descricao: "Previsão 30 dias abaixo do limite",
    valor: null,
  },
]

const empresasColumns = [
  { accessorKey: "empresa", header: "Empresa" },
  {
    accessorKey: "caixa",
    header: "Caixa",
    cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.caixa)}</span>,
  },
  {
    accessorKey: "receita",
    header: "Receita Mês",
    cell: ({ row }) => formatCurrency(row.original.receita),
  },
  {
    accessorKey: "resultado",
    header: "Resultado",
    cell: ({ row }) => (
      <span className={`font-medium ${row.original.resultado < 0 ? "text-fyn-danger" : "text-fyn-success"}`}>
        {formatCurrency(row.original.resultado)}
      </span>
    ),
  },
  {
    accessorKey: "risco",
    header: "Risco",
    cell: ({ row }) => <StatusBadge status={row.original.risco} size="xs" />,
  },
]

const centrosCustoColumns = [
  { accessorKey: "centro", header: "Centro" },
  {
    accessorKey: "receita",
    header: "Receita",
    cell: ({ row }) => formatCurrency(row.original.receita),
  },
  {
    accessorKey: "custos",
    header: "Custos",
    cell: ({ row }) => formatCurrency(row.original.custos),
  },
  {
    accessorKey: "resultado",
    header: "Resultado",
    cell: ({ row }) => (
      <span className={`font-medium ${row.original.resultado < 0 ? "text-fyn-danger" : "text-fyn-success"}`}>
        {formatCurrency(row.original.resultado)}
      </span>
    ),
  },
  {
    accessorKey: "impacto",
    header: "Impacto",
    cell: ({ row }) => (
      <span className={row.original.impacto < 0 ? "text-fyn-danger" : "text-fyn-text"}>
        {formatPercentage(row.original.impacto)}
      </span>
    ),
  },
]



export function DashboardContent() {
  // Filtros de período para centros de custo e receita
  const [periodoCentroCusto, setPeriodoCentroCusto] = useState('Mês atual');
  const [periodoCentroReceita, setPeriodoCentroReceita] = useState('Mês atual');

  // Mock data for macro/micro centers
  const macroCentros = [
            {
              id: 1,
              nome: "Operações",
              valor: 38000,
              micro: [
                { id: 11, nome: "Operação 1", valor: 18000 },
                { id: 12, nome: "Operação 2", valor: 12000 },
                { id: 13, nome: "Operação 3", valor: 8000 },
              ],
            },
            {
              id: 2,
              nome: "Comercial",
              valor: 21000,
              micro: [
                { id: 21, nome: "Comercial 1", valor: 12000 },
                { id: 22, nome: "Comercial 2", valor: 9000 },
              ],
            },
            {
              id: 3,
              nome: "Logística",
              valor: 14000,
              micro: [
                { id: 31, nome: "Logística 1", valor: 8000 },
                { id: 32, nome: "Logística 2", valor: 6000 },
              ],
            },
            {
              id: 4,
              nome: "Administrativo",
              valor: 10000,
              micro: [
                { id: 41, nome: "Administrativo 1", valor: 6000 },
                { id: 42, nome: "Administrativo 2", valor: 4000 },
              ],
            },
          ]

          const macroReceita = [
            {
              id: 101,
              nome: "Produto A",
              valor: 44000,
              micro: [
                { id: 111, nome: "Produto A1", valor: 25000 },
                { id: 112, nome: "Produto A2", valor: 19000 },
              ],
            },
            {
              id: 102,
              nome: "Produto B",
              valor: 27000,
              micro: [
                { id: 121, nome: "Produto B1", valor: 15000 },
                { id: 122, nome: "Produto B2", valor: 12000 },
              ],
            },
            {
              id: 103,
              nome: "Produto C",
              valor: 15000,
              micro: [
                { id: 131, nome: "Produto C1", valor: 9000 },
                { id: 132, nome: "Produto C2", valor: 6000 },
              ],
            },
            {
              id: 104,
              nome: "Serviço X",
              valor: 8000,
              micro: [
                { id: 141, nome: "Serviço X1", valor: 5000 },
                { id: 142, nome: "Serviço X2", valor: 3000 },
              ],
            },
          ]

  // State for expanded rows
  const [expandedCost, setExpandedCost] = useState([])
  const [expandedRevenue, setExpandedRevenue] = useState([])

  const toggleExpand = (id, type) => {
    if (type === "cost") {
      setExpandedCost((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    } else {
      setExpandedRevenue((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    }
  }

  // ...existing code...

  // POSICIONE AQUI a tabela interativa, dentro do return:
  // ...existing code...
        // Animação de contagem para saldo e margem
        const useCountUp = (end, duration = 1200) => {
          const [value, setValue] = useState(0)
          useEffect(() => {
            let start = 0
            const increment = end / (duration / 16)
            let raf
            const animate = () => {
              start += increment
              if (start < end) {
                setValue(Math.round(start))
                raf = requestAnimationFrame(animate)
              } else {
                setValue(end)
              }
            }
            animate()
            return () => raf && cancelAnimationFrame(raf)
          }, [end, duration])
          return value
        }

        const saldoAnimado = useCountUp(Math.round(statusDia.caixaAtual))
        const margemAnimada = useCountUp(32.4)
    // Dados para gráficos
    const meses = comparativoMensal.map((row) => row.mes)
    const receitaData = comparativoMensal.map((row) => row.receita)
    const custosData = comparativoMensal.map((row) => row.custos)
    const resultadoData = comparativoMensal.map((row) => row.resultado)

    const lineData = {
      labels: meses,
      datasets: [
        {
          label: "Saldo de Caixa",
          data: [120000, 125000, 123000, 130000, 127450, 127450],
          borderColor: "#059669",
          backgroundColor: "#05966933",
          tension: 0.4,
          fill: true,
        },
      ],
    }

    // Gráfico de crescimento de crédito
    const creditoCrescimentoData = {
      labels: meses,
      datasets: [
        {
          label: "Crédito Utilizado",
          data: [90000, 100000, 110000, 120000, 135000, 142000],
          borderColor: "#f59e42",
          backgroundColor: "#f59e4233",
          tension: 0.4,
          fill: true,
        },
      ],
    }

    const barData = {
      labels: meses,
      datasets: [
        {
          label: "Receita",
          data: receitaData,
          backgroundColor: "#10b981",
        },
        {
          label: "Custos",
          data: custosData,
          backgroundColor: "#ef4444",
        },
        {
          label: "Resultado",
          data: resultadoData,
          backgroundColor: "#3b82f6",
        },
      ],
    }

    const pizzaData = {
      labels: centrosCustoData.map((c) => c.centro),
      datasets: [
        {
          label: "Despesas por Centro",
          data: centrosCustoData.map((c) => Math.abs(c.custos)),
          backgroundColor: ["#3b82f6", "#10b981", "#f59e42", "#ef4444"],
        },
      ],
    }
  const sparklineData = [60, 65, 58, 72, 68, 85, 78, 92, 88, 95]

  const [sociosOpen, setSociosOpen] = useState(false)
  // Mock de sócios por empresa
  const socios = [
    { id: 1, nome: "João Silva", cpf: "123.456.789-00", percentual: 60, saldo: 12000 },
    { id: 2, nome: "Maria Souza", cpf: "987.654.321-00", percentual: 40, saldo: 8000 },
  ]

  return (
    <div>
      <div className="space-y-4">
        <PageHeader
          title="Dashboard"
          description="Central de decisão financeira - Visão consolidada de todas as empresas"
        />

        {/* Filtros para o dashboard */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
          {/* Filtro de período */}
          <div>
            <label className="block text-xs text-fyn-muted mb-1">Período</label>
            <select className="border border-fyn-border rounded px-3 py-1 text-fyn-text bg-white shadow-sm focus:outline-none">
              <option>Últimos 6 meses</option>
              <option>Últimos 12 meses</option>
              <option>Este ano</option>
              <option>Personalizado...</option>
            </select>
          </div>
        </div>

        {/* Aviso visual abaixo dos KPIs */}
        <div data-tour="dashboard-kpis" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Evolução do Saldo de Caixa" value={formatCurrency(statusDia.caixaAtual)} trend="up" trendValue="+8.2%" sparkline={sparklineData} />
          <KpiCard label="Crescimento de Crédito" value={formatCurrency(142000)} subvalue={`Limite: ${formatCurrency(250000)}`} variant="accent" />
          <KpiCard label="Inadimplência" value={formatCurrency(18500)} variant="danger" subvalue="Clientes em atraso" />
          <KpiCard label="Lucro Líquido" value={formatPercentage(18.6)} variant="success" subvalue="Mês atual" />
        </div>

        {/* Gráficos diretamente na página, ocupando toda a largura */}
        <div className="flex flex-col gap-8 animate-fade-in">
          {/* Linha e crédito lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-fyn-border animate-slide-up">
              <h2 className="text-lg font-bold text-fyn-text mb-2">Evolução do Saldo de Caixa</h2>
              <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false }, datalabels: { display: false }, animation: { duration: 1200 } } }} />
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-fyn-border animate-slide-up">
              <h2 className="text-lg font-bold text-fyn-text mb-2">Crescimento de Crédito</h2>
              <Line data={creditoCrescimentoData} options={{ responsive: true, plugins: { legend: { display: false }, datalabels: { display: false }, animation: { duration: 1200 } } }} />
            </div>
          </div>
          {/* Tabela interativa de Centros de Custo e Receita */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Centros de Custo */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-fyn-border animate-slide-up">
              {/* Filtro interno de período para Centro de Custo */}
              <div className="mb-4 flex items-center gap-2">
                <label className="font-semibold text-fyn-text">Período:</label>
                <select
                  className="border border-fyn-border rounded px-3 py-1 text-fyn-text bg-white shadow-sm focus:outline-none"
                  value={periodoCentroCusto}
                  onChange={e => setPeriodoCentroCusto(e.target.value)}
                >
                  <option>Mês atual</option>
                  <option>Mês anterior</option>
                  <option>Últimos 3 meses</option>
                  <option>Últimos 6 meses</option>
                  <option>Personalizado...</option>
                </select>
                <span className="text-xs text-fyn-muted ml-2">Período selecionado: <b>{periodoCentroCusto}</b></span>
              </div>
              <h2 className="text-lg font-bold text-fyn-text mb-4">Centros de Custo (Macro/Micro)</h2>
              <table className="w-full text-sm">
                <thead>
                <tr className="border-b border-fyn-border">
                  <th className="text-left py-2">Centro</th>
                  <th className="text-right py-2">Valor</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {macroCentros.flatMap((macro) => {
                  const total = macroCentros.reduce((acc, c) => acc + c.valor, 0);
                  const percent = ((macro.valor / total) * 100).toFixed(1);
                  const rows = [
                    <tr key={macro.id} className="border-b border-fyn-border hover:bg-fyn-bg/40 transition">
                      <td className="py-2 font-medium flex items-center gap-2">
                        <button
                          className="w-5 h-5 flex items-center justify-center rounded bg-fyn-bg border border-fyn-border text-fyn-muted hover:bg-fyn-accent/10 focus:outline-none"
                          onClick={() => toggleExpand(macro.id, "cost")}
                          aria-label={expandedCost.includes(macro.id) ? "Recolher" : "Expandir"}
                          type="button"
                        >
                          <span className={`transition-transform ${expandedCost.includes(macro.id) ? "rotate-90" : "rotate-0"}`}>▶</span>
                        </button>
                        {macro.nome}
                      </td>
                      <td className="py-2 text-right">{formatCurrency(macro.valor)} <span className="text-fyn-muted text-xs">({percent}%)</span></td>
                      <td></td>
                    </tr>
                  ];
                  if (expandedCost.includes(macro.id)) {
                    const microTotal = macro.micro.reduce((acc, c) => acc + c.valor, 0);
                    rows.push(...macro.micro.map((micro) => {
                      const microPercent = ((micro.valor / microTotal) * 100).toFixed(1);
                      return (
                        <tr key={micro.id} className="bg-fyn-bg/40">
                          <td className="pl-10 py-1 text-fyn-muted">{micro.nome}</td>
                          <td className="py-1 text-right">{formatCurrency(micro.valor)} <span className="text-xs">({microPercent}%)</span></td>
                          <td></td>
                        </tr>
                      );
                    }));
                  }
                  // Linha separadora após cada macro
                  rows.push(
                    <tr key={`sep-${macro.id}`}> 
                      <td colSpan={3}><div style={{borderBottom: '2px solid #e5e7eb', margin: 0}}></div></td>
                    </tr>
                  );
                  return rows;
                })}
              </tbody>
            </table>
          </div>
          {/* Centros de Receita */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-fyn-border animate-slide-up">
            {/* Filtro interno de período para Centro de Receita */}
            <div className="mb-4 flex items-center gap-2">
              <label className="font-semibold text-fyn-text">Período:</label>
              <select
                className="border border-fyn-border rounded px-3 py-1 text-fyn-text bg-white shadow-sm focus:outline-none"
                value={periodoCentroReceita}
                onChange={e => setPeriodoCentroReceita(e.target.value)}
              >
                <option>Mês atual</option>
                <option>Mês anterior</option>
                <option>Últimos 3 meses</option>
                <option>Últimos 6 meses</option>
                <option>Personalizado...</option>
              </select>
              <span className="text-xs text-fyn-muted ml-2">Período selecionado: <b>{periodoCentroReceita}</b></span>
            </div>
            <h2 className="text-lg font-bold text-fyn-text mb-4">Centros de Receita (Macro/Micro)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-fyn-border">
                  <th className="text-left py-2">Centro</th>
                  <th className="text-right py-2">Valor</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {macroReceita.flatMap((macro) => {
                  const total = macroReceita.reduce((acc, c) => acc + c.valor, 0);
                  const percent = ((macro.valor / total) * 100).toFixed(1);
                  const rows = [
                    <tr key={macro.id} className="border-b border-fyn-border hover:bg-fyn-bg/40 transition">
                      <td className="py-2 font-medium flex items-center gap-2">
                        <button
                          className="w-5 h-5 flex items-center justify-center rounded bg-fyn-bg border border-fyn-border text-fyn-muted hover:bg-fyn-accent/10 focus:outline-none"
                          onClick={() => toggleExpand(macro.id, "revenue")}
                          aria-label={expandedRevenue.includes(macro.id) ? "Recolher" : "Expandir"}
                          type="button"
                        >
                          <span className={`transition-transform ${expandedRevenue.includes(macro.id) ? "rotate-90" : "rotate-0"}`}>▶</span>
                        </button>
                        {macro.nome}
                      </td>
                      <td className="py-2 text-right">{formatCurrency(macro.valor)} <span className="text-fyn-muted text-xs">({percent}%)</span></td>
                      <td></td>
                    </tr>
                  ];
                  if (expandedRevenue.includes(macro.id)) {
                    const microTotal = macro.micro.reduce((acc, c) => acc + c.valor, 0);
                    rows.push(...macro.micro.map((micro) => {
                      const microPercent = ((micro.valor / microTotal) * 100).toFixed(1);
                      return (
                        <tr key={micro.id} className="bg-fyn-bg/40">
                          <td className="pl-10 py-1 text-fyn-muted">{micro.nome}</td>
                          <td className="py-1 text-right">{formatCurrency(micro.valor)} <span className="text-xs">({microPercent}%)</span></td>
                          <td></td>
                        </tr>
                      );
                    }));
                  }
                  // Linha separadora após cada macro
                  rows.push(
                    <tr key={`sep-${macro.id}`}> 
                      <td colSpan={3}><div style={{borderBottom: '2px solid #e5e7eb', margin: 0}}></div></td>
                    </tr>
                  );
                  return rows;
                })}
              </tbody>
            </table>
          </div>
        </div>
          {/* Gráfico de Barras Horizontais: Centros de Custo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gráfico de Barras Horizontais: Centros de Custo */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-fyn-border flex flex-col items-center animate-slide-up">
              <h2 className="text-lg font-bold text-fyn-text mb-2">Principais centros de custo (%)</h2>
              <div className="w-full h-64 flex flex-col items-center justify-center mb-2">
                {(() => {
                  const centros = [
                    { nome: 'Operações', valor: 38 },
                    { nome: 'Comercial', valor: 21 },
                    { nome: 'Logística', valor: 14 },
                    { nome: 'Administrativo', valor: 10 },
                    { nome: 'TI', valor: 7 },
                    { nome: 'RH', valor: 4 },
                    { nome: 'Financeiro', valor: 3 },
                    { nome: 'Jurídico', valor: 2 },
                  ];
                  const top5 = centros.slice(0, 5);
                  const outros = centros.slice(5);
                  const outrosTotal = outros.reduce((acc, c) => acc + c.valor, 0);
                  const labels = top5.map(c => `${c.nome} (${c.valor}%)`);
                  const data = top5.map(c => c.valor);
                  if (outrosTotal > 0) {
                    labels.push(`Outros (${outrosTotal}%)`);
                    data.push(outrosTotal);
                  }
                  const colors = ['#ef4444', '#f59e42', '#3b82f6', '#10b981', '#6366f1', '#a3a3a3'];
                  return (
                    <Bar
                      data={{
                        labels,
                        datasets: [{
                          data,
                          backgroundColor: colors,
                          borderRadius: 8,
                          barThickness: 24,
                        }],
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                          tooltip: { enabled: true },
                          datalabels: {
                            display: true,
                            anchor: 'end',
                            align: 'right',
                            formatter: value => value + '%',
                            color: '#333',
                            font: { weight: 'bold' },
                          },
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { callback: value => value + '%' },
                            grid: { display: false },
                          },
                          y: {
                            grid: { display: false },
                            ticks: { font: { size: 14 } },
                          },
                        },
                        animation: { duration: 1200 },
                      }}
                    />
                  );
                })()}
              </div>
            </div>
            {/* Gráfico de Rosca: Centros de Receita */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-fyn-border flex flex-col items-center animate-slide-up">
              <h2 className="text-lg font-bold text-fyn-text mb-2">Principais centros de receita (%)</h2>
              <div className="w-full h-64 flex flex-col items-center justify-center mb-2">
                {(() => {
                  const receitas = [
                    { nome: 'Produto A', valor: 44 },
                    { nome: 'Produto B', valor: 27 },
                    { nome: 'Produto C', valor: 15 },
                    { nome: 'Serviço X', valor: 8 },
                    { nome: 'Serviço Y', valor: 6 },
                    { nome: 'Produto D', valor: 4 },
                    { nome: 'Produto E', valor: 3 },
                    { nome: 'Produto F', valor: 2 },
                  ];
                  const top5 = receitas.slice(0, 5);
                  const outros = receitas.slice(5);
                  const outrosTotal = outros.reduce((acc, c) => acc + c.valor, 0);
                  const labels = top5.map(c => `${c.nome} (${c.valor}%)`);
                  const data = top5.map(c => c.valor);
                  if (outrosTotal > 0) {
                    labels.push(`Outros (${outrosTotal}%)`);
                    data.push(outrosTotal);
                  }
                  const colors = ['#10b981', '#3b82f6', '#f59e42', '#ef4444', '#6366f1', '#a3a3a3'];
                  return (
                    <Bar
                      data={{
                        labels,
                        datasets: [{
                          data,
                          backgroundColor: colors,
                          borderRadius: 8,
                          barThickness: 24,
                        }],
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                          tooltip: { enabled: true },
                          datalabels: {
                            display: true,
                            anchor: 'end',
                            align: 'right',
                            formatter: value => value + '%',
                            color: '#333',
                            font: { weight: 'bold' },
                          },
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { callback: value => value + '%' },
                            grid: { display: false },
                          },
                          y: {
                            grid: { display: false },
                            ticks: { font: { size: 14 } },
                          },
                        },
                        animation: { duration: 1200 },
                      }}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <div className="mt-8 space-y-6">
        {/* Gráfico de evolução do lucro líquido */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-fyn-border max-w-md md:float-left md:mr-8">
          <h2 className="text-lg font-bold text-fyn-text mb-2">Evolução do Lucro Líquido</h2>
          <Line data={{
            labels: meses,
            datasets: [{
              label: 'Lucro Líquido',
              data: [16000, 14000, 17000, 16000, 17000, 17500],
              borderColor: '#3b82f6',
              backgroundColor: '#3b82f633',
              tension: 0.4,
              fill: true,
            }],
          }} options={{ responsive: true, plugins: { legend: { display: false }, datalabels: { display: false } } }} />
        </div>
        {/* KPIs adicionais em linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiCard label="Ticket Médio" value={formatCurrency(3500)} variant="default" subvalue="Mês atual">
            {/* Mini sparkline */}
            <div className="mt-2">
              <Line data={{
                labels: ["Set", "Out", "Nov", "Dez", "Jan"],
                datasets: [{
                  data: [3200, 3400, 3300, 3500, 3500],
                  borderColor: '#6366f1',
                  backgroundColor: '#6366f133',
                  tension: 0.4,
                  fill: true,
                  pointRadius: 0,
                }],
              }} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }} height={40} />
            </div>
            {/* Badge de meta */}
            <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-fyn-success/10 text-fyn-success">Meta atingida</span>
          </KpiCard>
          <KpiCard label="Crescimento Mês a Mês" value={formatPercentage(6.2)} variant="accent" subvalue="vs mês anterior">
            {/* Badge de tendência */}
            <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">Tendência positiva</span>
          </KpiCard>
        </div>
        {/* Aviso visual - Despesas acima do previsto */}
        <div className="rounded-lg bg-fyn-danger-light/20 border-l-4 border-fyn-danger px-4 py-3 text-fyn-danger flex items-center gap-2 mt-4">
          <AlertTriangle className="w-5 h-5" />
          <span>Despesas acima do previsto neste mês!</span>
        </div>
      </div>
    </div>
  )
}
