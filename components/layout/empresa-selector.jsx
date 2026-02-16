"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useEmpresa } from "@/lib/empresa-context"
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  Pencil,
  Trash2,
  X,
} from "lucide-react"

export function EmpresaSelector({ collapsed }) {
  const {
    empresas,
    empresaAtiva,
    loading,
    selecionarEmpresa,
    criarEmpresa,
    atualizarEmpresa,
    excluirEmpresa,
  } = useEmpresa()

  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [isOpen, setIsOpen] = useState(false)
  const [showNovaEmpresa, setShowNovaEmpresa] = useState(false)
  const [novaEmpresaNome, setNovaEmpresaNome] = useState("")
  const [criando, setCriando] = useState(false)

  // Estados para edição
  const [editandoId, setEditandoId] = useState(null)
  const [editandoNome, setEditandoNome] = useState("")
  const [salvando, setSalvando] = useState(false)

  // Estado para confirmação de exclusão
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

  if (loading) {
    return (
      <div className="px-2 py-3">
        <div className={`flex items-center gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
          <Building2 className="h-5 w-5 text-sidebar-foreground/50 animate-pulse" />
          {!collapsed && <span className="text-sm text-sidebar-foreground/50">Carregando...</span>}
        </div>
      </div>
    )
  }

  async function handleCriarEmpresa(e) {
    e.preventDefault()
    if (!novaEmpresaNome.trim()) return

    try {
      setCriando(true)
      await criarEmpresa({ nome: novaEmpresaNome.trim() })
      setNovaEmpresaNome("")
      setShowNovaEmpresa(false)
      setIsOpen(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setCriando(false)
    }
  }

  async function handleSelecionarEmpresa(empresa) {
    await selecionarEmpresa(empresa)
    setIsOpen(false)
    // Usar router.refresh() em vez de reload completo - MUITO mais rápido
    startTransition(() => {
      router.refresh()
    })
  }

  function iniciarEdicao(empresa, e) {
    e.stopPropagation()
    setEditandoId(empresa.id)
    setEditandoNome(empresa.nome)
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setEditandoNome("")
  }

  async function salvarEdicao(e) {
    e.preventDefault()
    if (!editandoNome.trim()) return

    try {
      setSalvando(true)
      await atualizarEmpresa(editandoId, { nome: editandoNome.trim() })
      setEditandoId(null)
      setEditandoNome("")
    } catch (err) {
      alert(err.message)
    } finally {
      setSalvando(false)
    }
  }

  function iniciarExclusao(empresa, e) {
    e.stopPropagation()
    setConfirmandoExclusao(empresa)
  }

  function cancelarExclusao() {
    setConfirmandoExclusao(null)
  }

  async function confirmarExclusao() {
    if (!confirmandoExclusao) return

    try {
      setExcluindo(true)
      await excluirEmpresa(confirmandoExclusao.id)
      setConfirmandoExclusao(null)
      // Se excluiu a empresa ativa, usar router.refresh() - mais rápido que reload
      if (empresaAtiva?.id === confirmandoExclusao.id) {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setExcluindo(false)
    }
  }

  // Componente para item de empresa (reutilizado em collapsed e expanded)
  function EmpresaItem({ empresa }) {
    const isAtiva = empresaAtiva?.id === empresa.id
    const isEditando = editandoId === empresa.id
    const podeExcluir = empresas.length > 1

    if (isEditando) {
      return (
        <form onSubmit={salvarEdicao} className="p-1">
          <input
            type="text"
            value={editandoNome}
            onChange={(e) => setEditandoNome(e.target.value)}
            className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={salvando || !editandoNome.trim()}
              className="flex-1 rounded-lg bg-sidebar-primary px-3 py-1.5 text-sm text-sidebar-primary-foreground disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={cancelarEdicao}
              className="rounded-lg px-3 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
            >
              Cancelar
            </button>
          </div>
        </form>
      )
    }

    return (
      <div
        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${
          isAtiva
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent"
        }`}
        onClick={() => handleSelecionarEmpresa(empresa)}
      >
        <span className="truncate flex-1">{empresa.nome}</span>
        <div className="flex items-center gap-1 shrink-0">
          {isAtiva && <Check className="h-4 w-4" />}
          {!isAtiva && (
            <>
              <button
                onClick={(e) => iniciarEdicao(empresa, e)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent/50 transition-opacity"
                title="Editar empresa"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {podeExcluir && (
                <button
                  onClick={(e) => iniciarExclusao(empresa, e)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-opacity"
                  title="Excluir empresa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Modal de confirmação de exclusão
  function ConfirmacaoExclusao() {
    if (!confirmandoExclusao) return null

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
        <div className="w-80 rounded-lg border border-sidebar-border bg-sidebar p-4 shadow-xl">
          <h3 className="text-sm font-semibold text-sidebar-foreground mb-2">
            Excluir Empresa
          </h3>
          <p className="text-sm text-sidebar-foreground/70 mb-4">
            Tem certeza que deseja excluir a empresa <strong>{confirmandoExclusao.nome}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              {excluindo ? "Excluindo..." : "Excluir"}
            </button>
            <button
              onClick={cancelarExclusao}
              className="flex-1 rounded-lg border border-sidebar-border px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Versão collapsed - apenas ícone
  if (collapsed) {
    return (
      <div className="px-2 py-3">
        <ConfirmacaoExclusao />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-center rounded-lg bg-sidebar-accent/50 px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent"
          title={empresaAtiva?.nome || "Selecionar empresa"}
        >
          <Building2 className="h-5 w-5" />
        </button>

        {/* Dropdown flutuante para modo collapsed */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setIsOpen(false)
                setShowNovaEmpresa(false)
                cancelarEdicao()
              }}
            />
            <div className="absolute left-16 top-16 z-50 w-72 rounded-lg border border-sidebar-border bg-sidebar shadow-lg">
              <div className="p-2">
                <div className="mb-2 px-2 py-1 text-xs font-medium text-sidebar-foreground/50 uppercase">
                  Empresas
                </div>
                {empresas.map((empresa) => (
                  <EmpresaItem key={empresa.id} empresa={empresa} />
                ))}

                <hr className="my-2 border-sidebar-border" />

                {showNovaEmpresa ? (
                  <form onSubmit={handleCriarEmpresa} className="p-2">
                    <input
                      type="text"
                      placeholder="Nome da empresa"
                      value={novaEmpresaNome}
                      onChange={(e) => setNovaEmpresaNome(e.target.value)}
                      className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
                      autoFocus
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="submit"
                        disabled={criando || !novaEmpresaNome.trim()}
                        className="flex-1 rounded-lg bg-sidebar-primary px-3 py-1.5 text-sm text-sidebar-primary-foreground disabled:opacity-50"
                      >
                        {criando ? "Criando..." : "Criar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNovaEmpresa(false)
                          setNovaEmpresaNome("")
                        }}
                        className="rounded-lg px-3 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowNovaEmpresa(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nova Empresa</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Versão expandida
  return (
    <div className="relative px-2 py-3">
      <ConfirmacaoExclusao />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Building2 className="h-5 w-5 shrink-0" />
          <span className="truncate text-sm font-medium">
            {empresaAtiva?.nome || "Selecionar empresa"}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false)
              setShowNovaEmpresa(false)
              cancelarEdicao()
            }}
          />
          <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-lg border border-sidebar-border bg-sidebar shadow-lg">
            <div className="p-2">
              {empresas.map((empresa) => (
                <EmpresaItem key={empresa.id} empresa={empresa} />
              ))}

              <hr className="my-2 border-sidebar-border" />

              {showNovaEmpresa ? (
                <form onSubmit={handleCriarEmpresa} className="p-2">
                  <input
                    type="text"
                    placeholder="Nome da empresa"
                    value={novaEmpresaNome}
                    onChange={(e) => setNovaEmpresaNome(e.target.value)}
                    className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
                    autoFocus
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={criando || !novaEmpresaNome.trim()}
                      className="flex-1 rounded-lg bg-sidebar-primary px-3 py-1.5 text-sm text-sidebar-primary-foreground disabled:opacity-50"
                    >
                      {criando ? "Criando..." : "Criar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNovaEmpresa(false)
                        setNovaEmpresaNome("")
                      }}
                      className="rounded-lg px-3 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowNovaEmpresa(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Empresa</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
