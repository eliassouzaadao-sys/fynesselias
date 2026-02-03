"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Wallet,
  FileText,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  Users,
} from "lucide-react"
import { FynessLogo, FynessIcon } from "@/components/ui/logo"
import { EmpresaSelector } from "@/components/layout/empresa-selector"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/comparativo", label: "Comparativo", icon: GitCompare },
  { href: "/balancete-simples", label: "Bal Simpl Previsto", icon: ClipboardList },
  { href: "/balancete-real", label: "Bal Simpl Real", icon: ClipboardCheck },
  { href: "/contas", label: "Contas a Pagar e Receber", icon: FileText },
  { href: "/caixa", label: "Fluxo de Caixa", icon: Wallet },
  { href: "/socios", label: "Sócios", icon: Users },
  { href: "/dre", label: "DRE", icon: BarChart3 },
]

export function Sidebar({ collapsed, onCollapse }) {
  const pathname = usePathname()

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        {!collapsed ? (
          <FynessLogo size="default" variant="light" />
        ) : (
          <FynessIcon size={32} variant="light" />
        )}
      </div>

      {/* Seletor de Empresa */}
      <div className="border-b border-sidebar-border">
        <EmpresaSelector collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item, idx) => {
            const Icon = item.icon

            return (
              <li key={idx}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                    isActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => onCollapse(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  )
}
