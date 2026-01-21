"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatPercentage } from "@/lib/format"
import { Save, Building, Bell, Database, Shield, Users, PieChart, Plus, Edit, ToggleLeft, ChevronRight, Trash2 } from "lucide-react"

export function ConfiguracoesContent() {
  const [settings, setSettings] = useState({
    cashMin: 50000,
    autoSendAccountant: true,
    accountantSendDay: 5,
    whatsappNotifications: true,
    emailNotifications: true,
  })
  
  const [showCentrosModal, setShowCentrosModal] = useState(false)
  const [expandedCentros, setExpandedCentros] = useState([])
  
  const [centrosCusto, setCentrosCusto] = useState([
    { 
      id: "1", 
      code: "CC001", 
      name: "Matéria Prima", 
      receitas: 0, 
      custos: 85000, 
      resultado: -85000, 
      percentual: 35, 
      status: "Ativo",
      subcentros: [
        { id: "1-1", name: "Frios", custos: 35000, receitas: 0 },
        { id: "1-2", name: "Secos", custos: 28000, receitas: 0 },
        { id: "1-3", name: "Bebidas", custos: 22000, receitas: 0 },
      ]
    },
    { 
      id: "2", 
      code: "CC002", 
      name: "Comercial", 
      receitas: 180000, 
      custos: 45000, 
      resultado: 135000, 
      percentual: 30, 
      status: "Ativo",
      subcentros: [
        { id: "2-1", name: "Vendas Diretas", receitas: 120000, custos: 25000 },
        { id: "2-2", name: "E-commerce", receitas: 60000, custos: 20000 },
      ]
    },
    { 
      id: "3", 
      code: "CC003", 
      name: "Marketing", 
      receitas: 0, 
      custos: 42000, 
      resultado: -42000, 
      percentual: 20, 
      status: "Ativo",
      subcentros: [
        { id: "3-1", name: "Redes Sociais", receitas: 0, custos: 18000 },
        { id: "3-2", name: "Anúncios Online", receitas: 0, custos: 15000 },
        { id: "3-3", name: "Eventos", receitas: 0, custos: 9000 },
      ]
    },
    { 
      id: "4", 
      code: "CC004", 
      name: "Operações", 
      receitas: 80000, 
      custos: 35000, 
      resultado: 45000, 
      percentual: 15, 
      status: "Ativo",
      subcentros: [
        { id: "4-1", name: "Logística", receitas: 0, custos: 20000 },
        { id: "4-2", name: "Produção", receitas: 80000, custos: 15000 },
      ]
    },
  ])

  const users = [
    { id: 1, name: "João Silva", email: "joao@techsolutions.com", role: "admin", active: true },
    { id: 2, name: "Maria Santos", email: "maria@techsolutions.com", role: "socio_view", active: true },
    { id: 3, name: "Pedro Costa", email: "pedro@techsolutions.com", role: "contador", active: true },
  ]

  const roleLabels = {
    admin: "Administrador",
    socio_view: "Sócio (Visualização)",
    contador: "Contador",
  }
  
  const toggleCentro = (centroId) => {
    setExpandedCentros(prev => 
      prev.includes(centroId) 
        ? prev.filter(id => id !== centroId)
        : [...prev, centroId]
    )
  }

  const centrosCustoColumns = [
    { 
      accessorKey: "name", 
      header: "Centro de Custo/Receita",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.subcentros && row.original.subcentros.length > 0 && (
            <button
              onClick={() => toggleCentro(row.original.id)}
              className="text-fyn-muted hover:text-fyn-text"
            >
              <ChevronRight 
                className={`h-4 w-4 transition-transform ${
                  expandedCentros.includes(row.original.id) ? 'rotate-90' : ''
                }`} 
              />
            </button>
          )}
          <div>
            <div className="font-medium text-fyn-text">{row.original.name}</div>
            <div className="text-xs text-fyn-muted">{row.original.code}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "receitas",
      header: "Receitas",
      cell: ({ row }) => (
        <span className="text-green-600 font-medium">
          {formatCurrency(row.original.receitas)}
        </span>
      ),
    },
    {
      accessorKey: "custos",
      header: "Custos",
      cell: ({ row }) => (
        <span className="text-red-600 font-medium">
          {formatCurrency(row.original.custos)}
        </span>
      ),
    },
    {
      accessorKey: "resultado",
      header: "Resultado",
      cell: ({ row }) => (
        <span className={row.original.resultado >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
          {formatCurrency(row.original.resultado)}
        </span>
      ),
    },
    {
      accessorKey: "percentual",
      header: "% Total",
      cell: ({ row }) => <span className="text-fyn-muted">{row.original.percentual}%</span>,
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
          <button className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-text" title="Editar">
            <Edit className="h-4 w-4" />
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
        title="Configurações"
        description="Configurações do sistema e da empresa"
        actions={
          <Button size="sm">
            <Save className="mr-1 h-3.5 w-3.5" />
            Salvar Alterações
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="rounded border border-fyn-border bg-fyn-bg p-4">
            <div className="mb-3 flex items-center gap-2">
              <Building className="h-5 w-5 text-fyn-accent" />
              <h3 className="text-sm font-medium text-fyn-text">Dados da Empresa</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-fyn-text">Razão Social</label>
                <input
                  type="text"
                  defaultValue="Tech Solutions ME"
                  className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-fyn-text">CNPJ</label>
                <input
                  type="text"
                  defaultValue="12.345.678/0001-90"
                  className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded border border-fyn-border bg-fyn-bg p-4">
            <div className="mb-3 flex items-center gap-2">
              <Database className="h-5 w-5 text-fyn-accent" />
              <h3 className="text-sm font-medium text-fyn-text">Parâmetros Financeiros</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-fyn-text">Caixa Mínimo</label>
                <input
                  type="number"
                  value={settings.cashMin}
                  onChange={(e) => setSettings({ ...settings, cashMin: Number(e.target.value) })}
                  className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
                />
                <p className="mt-1 text-xs text-fyn-muted">
                  Sistema alertará quando o saldo ficar abaixo de {formatCurrency(settings.cashMin)}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-fyn-text">Limite de Retirada (Sócios)</label>
                <input
                  type="number"
                  defaultValue={20000}
                  className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded border border-fyn-border bg-fyn-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-fyn-accent" />
                <h3 className="text-sm font-medium text-fyn-text">Centros de Custo/Receita</h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowCentrosModal(true)}>
                Gerenciar
              </Button>
            </div>
            <p className="text-xs text-fyn-muted mb-3">
              Configure centros e subcentros para organizar receitas e despesas
            </p>
            <div className="space-y-2">
              {centrosCusto.filter(c => c.status === "Ativo").slice(0, 2).map((centro) => (
                <div key={centro.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-fyn-text font-medium">{centro.name}</span>
                    <span className={centro.resultado >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        notation: "compact",
                      }).format(centro.resultado)}
                    </span>
                  </div>
                  <div className="ml-3 space-y-0.5">
                    {centro.subcentros?.slice(0, 2).map((sub) => (
                      <div key={sub.id} className="flex items-center gap-1.5 text-[10px] text-fyn-muted">
                        <ChevronRight className="h-3 w-3" />
                        <span>{sub.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-fyn-border bg-fyn-bg p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-5 w-5 text-fyn-accent" />
              <h3 className="text-sm font-medium text-fyn-text">Notificações</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-fyn-text">Notificações por WhatsApp</span>
                <button
                  onClick={() => setSettings({ ...settings, whatsappNotifications: !settings.whatsappNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.whatsappNotifications ? "bg-fyn-accent" : "bg-fyn-muted"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.whatsappNotifications ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-fyn-text">Notificações por E-mail</span>
                <button
                  onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.emailNotifications ? "bg-fyn-accent" : "bg-fyn-muted"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailNotifications ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </label>
            </div>
          </div>

          <div className="rounded border border-fyn-border bg-fyn-bg p-4">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-fyn-accent" />
              <h3 className="text-sm font-medium text-fyn-text">Contador</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-fyn-text">Envio automático do pacote mensal</span>
                <button
                  onClick={() => setSettings({ ...settings, autoSendAccountant: !settings.autoSendAccountant })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoSendAccountant ? "bg-fyn-accent" : "bg-fyn-muted"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoSendAccountant ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium text-fyn-text">Dia de envio</label>
                <select
                  value={settings.accountantSendDay}
                  onChange={(e) => setSettings({ ...settings, accountantSendDay: Number(e.target.value) })}
                  className="w-32 rounded border border-fyn-border bg-fyn-bg px-2 py-1.5 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                    <option key={d} value={d}>
                      Dia {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded border border-fyn-border bg-fyn-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-fyn-accent" />
                <h3 className="text-sm font-medium text-fyn-text">Usuários</h3>
              </div>
              <Button size="sm" variant="outline">
                + Convidar
              </Button>
            </div>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded border border-fyn-border bg-fyn-surface p-2"
                >
                  <div>
                    <p className="text-sm font-medium text-fyn-text">{user.name}</p>
                    <p className="text-xs text-fyn-muted">{user.email}</p>
                  </div>
                  <span className="rounded bg-fyn-accent/10 px-2 py-0.5 text-xs text-fyn-accent">
                    {roleLabels[user.role]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-fyn-border bg-fyn-bg p-4">
            <h3 className="mb-3 text-sm font-medium text-fyn-text">Integrações</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded border border-fyn-border bg-fyn-surface p-2">
                <span className="text-sm text-fyn-text">OFX Import</span>
                <span className="text-xs text-fyn-positive">Ativo</span>
              </div>
              <div className="flex items-center justify-between rounded border border-fyn-border bg-fyn-surface p-2">
                <span className="text-sm text-fyn-text">Open Banking</span>
                <span className="text-xs text-fyn-muted">Em breve</span>
              </div>
              <div className="flex items-center justify-between rounded border border-fyn-border bg-fyn-surface p-2">
                <span className="text-sm text-fyn-text">WhatsApp API</span>
                <span className="text-xs text-fyn-positive">Conectado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Centros de Custo/Receita */}
      <Modal
        isOpen={showCentrosModal}
        onClose={() => setShowCentrosModal(false)}
        title="Gerenciar Centros e Subcentros"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-fyn-muted">
              Configure centros e subcentros para organizar suas receitas e despesas
            </p>
            <Button size="sm">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Novo Centro
            </Button>
          </div>
          
          <div className="space-y-2">
            {centrosCusto.map((centro) => (
              <div key={centro.id} className="rounded-lg border border-fyn-border bg-fyn-surface">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleCentro(centro.id)}
                      className="text-fyn-muted hover:text-fyn-text"
                    >
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform ${
                          expandedCentros.includes(centro.id) ? 'rotate-90' : ''
                        }`} 
                      />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-fyn-text">{centro.name}</span>
                        <span className="text-xs text-fyn-muted">{centro.code}</span>
                        <StatusBadge status={centro.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="text-xs text-fyn-muted">Receitas</div>
                        <div className="text-green-600 font-medium">{formatCurrency(centro.receitas)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-fyn-muted">Custos</div>
                        <div className="text-red-600 font-medium">{formatCurrency(centro.custos)}</div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className="text-xs text-fyn-muted">Resultado</div>
                        <div className={`font-bold ${centro.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(centro.resultado)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="rounded p-1.5 text-fyn-muted hover:bg-fyn-bg hover:text-fyn-text" title="Editar">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="rounded p-1.5 text-fyn-muted hover:bg-fyn-bg hover:text-fyn-text" title="Adicionar Subcentro">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {expandedCentros.includes(centro.id) && centro.subcentros && centro.subcentros.length > 0 && (
                  <div className="border-t border-fyn-border bg-fyn-bg/50 p-3">
                    <div className="space-y-1.5">
                      {centro.subcentros.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between py-2 px-3 rounded hover:bg-fyn-surface">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3 w-3 text-fyn-muted" />
                            <span className="text-sm text-fyn-text">{sub.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-green-600">{formatCurrency(sub.receitas)}</span>
                            <span className="text-red-600">{formatCurrency(sub.custos)}</span>
                            <span className={`font-medium min-w-[80px] text-right ${(sub.receitas - sub.custos) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(sub.receitas - sub.custos)}
                            </span>
                            <div className="flex items-center gap-1">
                              <button className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-text" title="Editar">
                                <Edit className="h-3 w-3" />
                              </button>
                              <button className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-red-500" title="Remover">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

    </div>
  )
}
