"use client"

import { useState } from "react"
import { ChevronDown, Plus, Search, Bell, User, LogOut, Building2, HelpCircle } from "lucide-react"
import { useCompany } from "@/lib/company-context"
import { Modal } from "@/components/ui/modal"
import { NewEntryForm } from "@/components/forms/new-entry-form"

const mockUser = {
  name: "João Silva",
  email: "joao@empresa.com.br",
  avatar: null,
}

export function Topbar({ sidebarCollapsed }) {
  const { companies, selectedCompany, setSelectedCompany, loading } = useCompany()
  const [showCompanySelect, setShowCompanySelect] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [notifications] = useState(3)
  // Sócios removidos

  return (
    <header
      className={`fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-fyn-border bg-fyn-bg/95 px-6 backdrop-blur-sm transition-all duration-300 ${sidebarCollapsed ? "left-16" : "left-56"}`}
    >
      <div className="flex items-center gap-6">
        {/* Company Selector */}
        <div className="relative">
          <button
            onClick={() => setShowCompanySelect(!showCompanySelect)}
            className="flex items-center gap-3 rounded-lg border border-fyn-border bg-fyn-surface px-4 py-2 transition-all hover:border-fyn-border-strong hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-fyn-accent focus:ring-offset-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fyn-accent/10">
              <Building2 className="h-4 w-4 text-fyn-accent" />
            </div>
            {loading ? (
              <span className="text-sm text-fyn-muted">Carregando...</span>
            ) : selectedCompany ? (
              <div className="text-left">
                <p className="text-sm font-medium text-fyn-text">{selectedCompany.name}</p>
                <p className="text-xs text-fyn-text-muted">{selectedCompany.cnpj}</p>
              </div>
            ) : (
              <span className="text-sm text-fyn-muted">Selecione uma empresa</span>
            )}
            <ChevronDown className="h-4 w-4 text-fyn-muted" />
          </button>
          {showCompanySelect && companies.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-fyn-border bg-fyn-bg shadow-lg">
              <div className="border-b border-fyn-border bg-fyn-surface px-4 py-2">
                <p className="text-xs font-medium uppercase tracking-wider text-fyn-text-muted">Suas empresas</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {companies.map((company) => (
                  <button
                    key={company._id}
                    onClick={() => {
                      setSelectedCompany(company)
                      setShowCompanySelect(false)
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-fyn-surface ${
                      company._id === selectedCompany?._id ? "bg-fyn-accent/5 border-l-2 border-l-fyn-accent" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fyn-surface">
                      <Building2 className="h-5 w-5 text-fyn-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fyn-text">{company.name}</p>
                      <p className="text-xs text-fyn-text-muted">{company.cnpj}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fyn-muted" />
          <input
            type="text"
            placeholder="Buscar transações, clientes..."
            className="w-80 rounded-lg border border-fyn-border bg-fyn-surface py-2.5 pl-11 pr-4 text-sm text-fyn-text placeholder:text-fyn-text-light transition-all focus:border-fyn-accent focus:bg-fyn-bg focus:outline-none focus:ring-2 focus:ring-fyn-accent/20"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded border border-fyn-border bg-fyn-bg px-1.5 py-0.5 text-[10px] font-medium text-fyn-text-muted">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* New Button */}
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-lg bg-fyn-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-fyn-accent-hover hover:shadow-md focus:outline-none focus:ring-2 focus:ring-fyn-accent focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          <span>Novo</span>
        </button>

        {/* Help */}
        <button className="rounded-lg p-2.5 text-fyn-muted transition-colors hover:bg-fyn-surface hover:text-fyn-text">
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button className="relative rounded-lg p-2.5 text-fyn-muted transition-colors hover:bg-fyn-surface hover:text-fyn-text">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-fyn-danger text-[10px] font-bold text-white">
              {notifications}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-fyn-surface focus:outline-none focus:ring-2 focus:ring-fyn-accent focus:ring-offset-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fyn-accent to-fyn-accent-hover text-white">
              {mockUser.avatar ? (
                <img
                  src={mockUser.avatar || "/placeholder.svg"}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium">{mockUser.name.charAt(0)}</span>
              )}
            </div>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-fyn-border bg-fyn-bg shadow-lg">
              <div className="border-b border-fyn-border bg-fyn-surface px-4 py-3">
                <p className="text-sm font-medium text-fyn-text">{mockUser.name}</p>
                <p className="text-xs text-fyn-text-muted">{mockUser.email}</p>
              </div>
              <div className="py-1">
                <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-fyn-text transition-colors hover:bg-fyn-surface">
                  <User className="h-4 w-4 text-fyn-muted" />
                  Meu Perfil
                </button>
                <button
                  onClick={() => alert("Logout")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-fyn-danger transition-colors hover:bg-fyn-danger/5"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Novo Lançamento" size="md">
        <NewEntryForm onClose={() => setShowNewModal(false)} />
      </Modal>
    </header>
  )
}
