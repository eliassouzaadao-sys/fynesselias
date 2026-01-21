"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  PieChart,
  GitCompare,
  BarChart3,
  Users,
  Calculator,
  Zap,
  Shield,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Building2,
} from "lucide-react"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tourId: "dashboard" },
  { href: "/caixa", label: "Fluxo de Caixa", icon: Wallet, tourId: "menu-caixa" },
  { href: "/pagar", label: "Contas a Pagar", icon: ArrowDownCircle, tourId: "menu-pagar" },
  { href: "/receber", label: "Contas a Receber", icon: ArrowUpCircle },
  { href: "/comparativo", label: "Comparativo", icon: GitCompare },
  {
    label: "Relatórios",
    icon: BarChart3,
    tourId: "menu-relatorios",
    children: [
      { href: "/relatorios/dre", label: "DRE" },
      { href: "/relatorios/balancete", label: "Balancete" },
      // { href: "/relatorios/fluxo", label: "Fluxo de Caixa" },
      // { href: "/relatorios/credito", label: "Endividamento" },
    ],
  },
  { href: "/conciliacao", label: "Conferir Extratos Bancários", icon: Wallet },
  { href: "/contador", label: "Contador", icon: Calculator },
  { href: "/auditoria", label: "Auditoria", icon: Shield },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

export function Sidebar({ collapsed, onCollapse }) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState(["Relatórios"])

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const toggleMenu = (label) => {
    setExpandedMenus((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))
  }

  return (
    <aside
      data-tour="sidebar"
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-fyn-primary transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fyn-accent">
              <span className="text-sm font-bold text-white">F</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Fynness</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-fyn-accent">
            <span className="text-sm font-bold text-white">F</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item, idx) => {
            const Icon = item.icon
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedMenus.includes(item.label)
            const isItemActive = item.href ? isActive(item.href) : item.children?.some((c) => isActive(c.href))

            return (
              <li key={idx}>
                {hasChildren ? (
                  <div data-tour={item.tourId}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                        isItemActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </>
                      )}
                    </button>
                    {!collapsed && isExpanded && (
                      <ul className="mt-1 space-y-0.5 pl-11">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`block rounded-lg px-3 py-2 text-sm transition-all ${
                                isActive(child.href)
                                  ? "bg-fyn-accent text-white"
                                  : "text-white/60 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    data-tour={item.tourId}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                      isActive(item.href)
                        ? "bg-fyn-accent text-white shadow-lg shadow-fyn-accent/25"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => onCollapse(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition-all hover:bg-white/5 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  )
}
