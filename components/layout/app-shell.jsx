"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"

export function AppShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-56"}`}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
