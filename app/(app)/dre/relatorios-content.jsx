"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FileText, BarChart3, Receipt } from "lucide-react"
import { DreContent } from "./dre-content"
import { BalanceteContent } from "./balancete-content"
import { RecibosContent } from "./recibos-content"

export function RelatoriosContent() {
  const [activeTab, setActiveTab] = useState("dre")

  return (
    <div className="space-y-4">
      <PageHeader
        title="Relatorios"
        description="Demonstrativos financeiros e contabeis"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dre" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            DRE
          </TabsTrigger>
          <TabsTrigger value="balancete" className="gap-2">
            <FileText className="h-4 w-4" />
            Balancete
          </TabsTrigger>
          <TabsTrigger value="recibos" className="gap-2">
            <Receipt className="h-4 w-4" />
            Recibos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dre">
          <DreContent />
        </TabsContent>

        <TabsContent value="balancete">
          <BalanceteContent />
        </TabsContent>

        <TabsContent value="recibos">
          <RecibosContent />
        </TabsContent>
      </Tabs>
    </div>
  )
}
