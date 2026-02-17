"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/format"
import { Users, Briefcase, Wallet, TrendingUp, Filter, Calendar } from "lucide-react"
import { ProLaboreTab } from "./components/tabs/ProLaboreTab"
import { FuncionariosTab } from "./components/tabs/FuncionariosTab"

interface KpiData {
  totalPessoas: number
  custoMensal: number
  proLaboreLiquido: number
  folhaPagamento: number
  variacao: number
}

export function FolhaSalarialContent() {
  const [activeTab, setActiveTab] = useState("prolabore")
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<KpiData>({
    totalPessoas: 0,
    custoMensal: 0,
    proLaboreLiquido: 0,
    folhaPagamento: 0,
    variacao: 0,
  })

  // Filtros fixos compartilhados
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  // Estado compartilhado para dados de sócios e funcionários
  const [sociosData, setSociosData] = useState<any[]>([])
  const [funcionariosData, setFuncionariosData] = useState<any[]>([])

  // Carregar dados consolidados
  const loadKpis = async () => {
    try {
      setLoading(true)

      // Construir query params para sócios
      const sociosParams = new URLSearchParams()
      if (dataInicio) sociosParams.append('dataInicio', dataInicio)
      if (dataFim) sociosParams.append('dataFim', dataFim)

      // Carregar sócios e funcionários em paralelo
      const [sociosRes, funcionariosRes] = await Promise.all([
        fetch(`/api/socios?${sociosParams.toString()}`),
        fetch('/api/funcionarios'),
      ])

      const socios = await sociosRes.json()
      const funcionarios = await funcionariosRes.json()

      setSociosData(Array.isArray(socios) ? socios : [])
      setFuncionariosData(Array.isArray(funcionarios) ? funcionarios : [])

      // Calcular KPIs
      const sociosList = Array.isArray(socios) ? socios : []
      const funcList = Array.isArray(funcionarios) ? funcionarios : []

      const totalSocios = sociosList.length
      const totalFuncionarios = funcList.filter((f: any) => f.status === 'ativo').length

      const proLaboreLiquido = sociosList.reduce(
        (acc: number, s: any) => acc + (s.proLaboreLiquido || 0),
        0
      )

      const folhaPagamento = funcList
        .filter((f: any) => f.status === 'ativo')
        .reduce((acc: number, f: any) => acc + (f.custoEmpresa || 0), 0)

      setKpis({
        totalPessoas: totalSocios + totalFuncionarios,
        custoMensal: proLaboreLiquido + folhaPagamento,
        proLaboreLiquido,
        folhaPagamento,
        variacao: 0, // TODO: calcular variação com mês anterior
      })
    } catch (error) {
      console.error("Erro ao carregar KPIs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKpis()
  }, [dataInicio, dataFim])

  const refreshData = () => {
    loadKpis()
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Folha Salarial</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie pró-labore de sócios e folha de pagamento de funcionários
        </p>
      </div>

      {/* Filtros Fixos */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros:</span>
          </div>

          {/* Filtro de Período */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm text-muted-foreground">Período:</label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="h-9 w-[150px]"
                placeholder="Data início"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="h-9 w-[150px]"
                placeholder="Data fim"
              />
            </div>
          </div>

        </div>
      </Card>

      {/* KPIs Consolidados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Pessoas</p>
              <p className="text-lg font-bold text-foreground">
                {loading ? "-" : kpis.totalPessoas}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Wallet className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo Mensal Total</p>
              <p className="text-lg font-bold text-foreground">
                {loading ? "-" : formatCurrency(kpis.custoMensal)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pró-labore Líquido</p>
              <p className="text-lg font-bold text-foreground">
                {loading ? "-" : formatCurrency(kpis.proLaboreLiquido)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Briefcase className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Folha de Pagamento</p>
              <p className="text-lg font-bold text-foreground">
                {loading ? "-" : formatCurrency(kpis.folhaPagamento)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-100">
              <TrendingUp className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Variação</p>
              <p className="text-lg font-bold text-foreground">
                {loading ? "-" : `${kpis.variacao >= 0 ? '+' : ''}${kpis.variacao.toFixed(1)}%`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="prolabore" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pró-labore
          </TabsTrigger>
          <TabsTrigger value="funcionarios" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Funcionários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prolabore" className="mt-6">
          <ProLaboreTab
            socios={sociosData}
            onRefresh={refreshData}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        </TabsContent>

        <TabsContent value="funcionarios" className="mt-6">
          <FuncionariosTab
            funcionarios={funcionariosData}
            onRefresh={refreshData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
