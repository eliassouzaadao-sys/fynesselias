"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatPercentage, formatDate } from "@/lib/format"
import { Plus, Eye, Edit, ToggleLeft, FolderPlus } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const mockEvolution = []

const mockTransactions = []

export function CentrosCustoContent() {
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [showNewCenterDrawer, setShowNewCenterDrawer] = useState(false)
  const [showNewSubcenterDrawer, setShowNewSubcenterDrawer] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState(null)
  const [parentCenterForSub, setParentCenterForSub] = useState(null)
  const [centros, setCentros] = useState([])
  const [loading, setLoading] = useState(true)

  const loadCentros = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/centros")
      const data = await res.json()
      const allCentros = Array.isArray(data) ? data : []

      // Separar pais e filhos
      const centrosPais = allCentros.filter(c => !c.parentId)
      const subcentros = allCentros.filter(c => c.parentId)

      // Mapear dados
      const formattedCentros = centrosPais.map(c => {
        // Buscar subcentros deste pai
        const subs = subcentros.filter(s => s.parentId === c.id)

        return {
          id: c.id,
          code: c.sigla,
          name: c.nome,
          custos: c.tipo === "despesa" ? c.realizado : 0,
          receitas: c.tipo === "faturamento" ? c.realizado : 0,
          previsto: c.previsto,
          realizado: c.realizado,
          percentual: 0, // Will calculate after loading all
          status: c.ativo ? "Ativo" : "Inativo",
          tipo: c.tipo,
          subcentros: subs.map(s => ({
            id: s.id,
            code: s.sigla,
            name: s.nome,
            custos: s.tipo === "despesa" ? s.realizado : 0,
            receitas: s.tipo === "faturamento" ? s.realizado : 0,
            previsto: s.previsto,
            realizado: s.realizado,
            status: s.ativo ? "Ativo" : "Inativo",
            tipo: s.tipo,
          })),
        }
      })

      setCentros(formattedCentros)
    } catch (e) {
      console.error('Failed to load centros:', e)
      setCentros([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCentros()
  }, [])

  const totalCustos = centros.reduce((acc, c) => acc + c.custos, 0)

  const columns = [
    { accessorKey: "code", header: "Código" },
    {
      accessorKey: "name",
      header: "Centro de Custo",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.subcentros && row.original.subcentros.length > 0 && (
            <div className="text-xs text-fyn-muted mt-1">
              {row.original.subcentros.length} subcentro(s)
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "previsto",
      header: "Previsto",
      cell: ({ row }) => formatCurrency(row.original.previsto),
    },
    {
      accessorKey: "realizado",
      header: "Realizado",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{formatCurrency(row.original.realizado)}</div>
          {row.original.previsto > 0 && (
            <div className="text-xs text-fyn-muted">
              {Math.round((row.original.realizado / row.original.previsto) * 100)}% do previsto
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedCenter(row.original)
              setShowDetailDrawer(true)
            }}
            className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-accent"
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-text" title="Editar">
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setParentCenterForSub(row.original)
              setShowNewSubcenterDrawer(true)
            }}
            className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-success"
            title="Adicionar Subcentro"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-warning"
            title="Ativar/Desativar"
          >
            <ToggleLeft className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Centros de Custo"
        description="Análise de resultado por centro de custo"
        actions={
          <Button size="sm" onClick={() => setShowNewCenterDrawer(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Novo Centro
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border border-fyn-border bg-fyn-surface p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-fyn-text-muted">Total de Custos</p>
          <p className="mt-1 text-xl font-semibold text-fyn-text">{formatCurrency(totalCustos)}</p>
          <p className="text-xs text-fyn-muted mt-1">Soma de todos os centros</p>
        </div>
        <div className="rounded border border-fyn-border bg-fyn-surface p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-fyn-text-muted">Centros Ativos</p>
          <p className="mt-1 text-xl font-semibold text-fyn-text">{centros.filter(c => c.status === "Ativo").length}</p>
          <p className="text-xs text-fyn-muted mt-1">de {centros.length} cadastrados</p>
        </div>
      </div>

      {/* Centers Table */}
      <DataTable data={centros} columns={columns} searchPlaceholder="Buscar centros de custo..." pageSize={10} />

      {/* Detail Drawer */}
      <Drawer
        isOpen={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        title={selectedCenter ? `${selectedCenter.code} - ${selectedCenter.name}` : "Detalhes"}
        key={selectedCenter?.id || "detail"}
      >
        {selectedCenter && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Previsto</p>
                <p className="text-sm font-semibold">{formatCurrency(selectedCenter.previsto)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Realizado</p>
                <p className="text-sm font-semibold">{formatCurrency(selectedCenter.realizado)}</p>
              </div>
            </div>

            {/* Subcentros */}
            {selectedCenter.subcentros && selectedCenter.subcentros.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-fyn-text mb-2">Subcentros</h3>
                <div className="space-y-2">
                  {selectedCenter.subcentros.map((sub) => (
                    <div key={sub.id} className="rounded border border-fyn-border bg-fyn-bg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-medium text-fyn-text">{sub.code} - {sub.name}</p>
                        </div>
                        <StatusBadge status={sub.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-fyn-muted">Previsto: </span>
                          <span className="font-medium">{formatCurrency(sub.previsto)}</span>
                        </div>
                        <div>
                          <span className="text-fyn-muted">Realizado: </span>
                          <span className="font-medium">{formatCurrency(sub.realizado)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Subcenter Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setParentCenterForSub(selectedCenter)
                setShowNewSubcenterDrawer(true)
              }}
              className="w-full"
            >
              <FolderPlus className="mr-1 h-3.5 w-3.5" />
              Adicionar Subcentro
            </Button>

            {/* Evolution Chart */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-fyn-text">Evolução Mensal de Custos</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockEvolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--fyn-border)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "var(--fyn-muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--fyn-muted)" }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        backgroundColor: "var(--fyn-bg)",
                        border: "1px solid var(--fyn-border)",
                      }}
                      formatter={(v) => formatCurrency(v)}
                    />
                    <Line type="monotone" dataKey="custos" stroke="var(--fyn-danger)" strokeWidth={2} name="Custos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-fyn-text">Últimos Lançamentos</h3>
              <div className="space-y-1">
                {mockTransactions.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded border border-fyn-border bg-fyn-bg p-2"
                  >
                    <div>
                      <p className="text-sm text-fyn-text">{t.description}</p>
                      <p className="text-xs text-fyn-muted">{formatDate(t.date)}</p>
                    </div>
                    <span className={`text-sm font-medium ${t.type === "in" ? "text-fyn-success" : "text-fyn-danger"}`}>
                      {t.type === "in" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* New Center Form Drawer */}
      <Drawer
        isOpen={showNewCenterDrawer}
        onClose={() => setShowNewCenterDrawer(false)}
        title="Novo Centro de Custo/Receita"
      >
        <CenterForm
          key={showNewCenterDrawer ? "open" : "closed"}
          onSave={() => {
            loadCentros()
            setShowNewCenterDrawer(false)
          }}
          onCancel={() => setShowNewCenterDrawer(false)}
        />
      </Drawer>

      {/* New Subcenter Form Drawer */}
      <Drawer
        isOpen={showNewSubcenterDrawer}
        onClose={() => {
          setShowNewSubcenterDrawer(false)
          setParentCenterForSub(null)
        }}
        title={parentCenterForSub ? `Novo Subcentro de ${parentCenterForSub.name}` : "Novo Subcentro"}
      >
        <SubcenterForm
          key={parentCenterForSub?.id || "new-sub"}
          parentCenter={parentCenterForSub}
          onSave={() => {
            loadCentros()
            setShowNewSubcenterDrawer(false)
            setParentCenterForSub(null)
          }}
          onCancel={() => {
            setShowNewSubcenterDrawer(false)
            setParentCenterForSub(null)
          }}
        />
      </Drawer>
    </div>
  )
}

function CenterForm({ onSave, onCancel }) {
  const [nome, setNome] = useState("")
  const [sigla, setSigla] = useState("")
  const [tipo, setTipo] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/centros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, sigla, tipo }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar centro")
      }

      onSave()
    } catch (error) {
      console.error("Error creating centro:", error)
      alert(error.message || "Erro ao criar centro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-fyn-text mb-1 block">Nome *</label>
        <Input
          placeholder="Ex: Marketing Digital"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-fyn-text mb-1 block">Sigla *</label>
        <Input
          placeholder="Ex: MKT"
          value={sigla}
          onChange={e => setSigla(e.target.value.toUpperCase())}
          required
          maxLength={10}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-fyn-text mb-1 block">Tipo *</label>
        <select
          className="w-full rounded-md border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:outline-none focus:ring-2 focus:ring-fyn-accent"
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          required
        >
          <option value="">Selecione o tipo</option>
          <option value="despesa">Despesa (Centro de Custo)</option>
          <option value="faturamento">Faturamento (Receita)</option>
        </select>
        <p className="text-xs text-fyn-muted mt-1">
          {tipo === "despesa" && "Será cadastrado como Centro de Custo"}
          {tipo === "faturamento" && "Será cadastrado como Centro de Receita"}
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  )
}

function SubcenterForm({ parentCenter, onSave, onCancel }) {
  const [nome, setNome] = useState("")
  const [sigla, setSigla] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      // Get parent center's tipo (need to fetch from API based on code/sigla)
      // For now, we'll need the parent's ID, so this might need adjustment
      const response = await fetch("/api/centros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          sigla: `${parentCenter?.code}.${sigla}`,
          tipo: parentCenter?.tipo || "despesa", // This would need to come from parent
          parentId: parentCenter?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar subcentro")
      }

      onSave()
    } catch (error) {
      console.error("Error creating subcentro:", error)
      alert(error.message || "Erro ao criar subcentro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info do Centro Pai */}
      {parentCenter && (
        <div className="rounded-md bg-fyn-surface p-3 border border-fyn-border">
          <p className="text-xs font-medium uppercase tracking-wider text-fyn-text-muted mb-1">
            Centro Pai
          </p>
          <p className="text-sm font-semibold text-fyn-text">
            {parentCenter.code} - {parentCenter.name}
          </p>
          <p className="text-xs text-fyn-muted mt-1">
            O subcentro herdará o tipo deste centro
          </p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-fyn-text mb-1 block">Nome do Subcentro *</label>
        <Input
          placeholder="Ex: Campanha Meta Ads"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-fyn-text mb-1 block">Sigla *</label>
        <Input
          placeholder="Ex: META"
          value={sigla}
          onChange={e => setSigla(e.target.value.toUpperCase())}
          required
          maxLength={10}
        />
        <p className="text-xs text-fyn-muted mt-1">
          Código completo: {parentCenter?.code}.{sigla || "___"}
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Salvando..." : "Salvar Subcentro"}
        </Button>
      </div>
    </form>
  )
}
