"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FileText, BarChart3, Lock } from "lucide-react"
import { DreContent } from "./dre-content"
import { BalanceteContent } from "./balancete-content"
import { Card } from "@/components/ui/card"

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
          <TabsTrigger value="recibos" className="gap-2" disabled>
            <Lock className="h-4 w-4" />
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
          <Card className="p-12 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Funcionalidade Bloqueada</h3>
            <p className="text-muted-foreground">
              Esta funcionalidade sera implementada futuramente.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
