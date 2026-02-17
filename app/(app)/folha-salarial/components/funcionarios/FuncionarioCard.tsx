"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { User, Edit, Trash2, Eye, Wallet, TrendingDown, Building2 } from "lucide-react"

interface Funcionario {
  id: number
  nome: string
  cpf: string
  cargo: string | null
  status: string
  salarioBruto: number
  salarioLiquido: number
  custoEmpresa: number
  descontosTotal: number
  inss: number
  irrf: number
  fgts: number
  valeTransporte: number
  valeRefeicao: number
  planoSaude: number
  pago: boolean
}

interface FuncionarioCardProps {
  funcionario: Funcionario
  onEdit: () => void
  onDelete: () => void
  onViewFolha: () => void
}

export function FuncionarioCard({ funcionario, onEdit, onDelete, onViewFolha }: FuncionarioCardProps) {
  const formatCPF = (cpf: string) => {
    if (!cpf) return "-"
    const cleaned = cpf.replace(/\D/g, "")
    if (cleaned.length !== 11) return cpf
    return cleaned.slice(0, 3) + "." + cleaned.slice(3, 6) + "." + cleaned.slice(6, 9) + "-" + cleaned.slice(9)
  }

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ativo: { label: "Ativo", variant: "default" },
    ferias: { label: "Férias", variant: "secondary" },
    afastado: { label: "Afastado", variant: "outline" },
    demitido: { label: "Demitido", variant: "destructive" },
  }

  const status = statusConfig[funcionario.status] || statusConfig.ativo

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100">
              <User className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{funcionario.nome}</h3>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>CPF: {formatCPF(funcionario.cpf)}</span>
                {funcionario.cargo && (
                  <>
                    <span>•</span>
                    <span>{funcionario.cargo}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} title="Editar">
              <Edit className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} title="Excluir">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Valores Principais */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <Wallet className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Bruto</p>
            <p className="text-sm font-bold text-green-700">
              {formatCurrency(funcionario.salarioBruto)}
            </p>
          </div>

          <div className="text-center p-2 bg-red-50 rounded-lg">
            <TrendingDown className="h-4 w-4 text-red-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Descontos</p>
            <p className="text-sm font-bold text-red-700">
              -{formatCurrency(funcionario.descontosTotal)}
            </p>
          </div>

          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <Wallet className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Líquido</p>
            <p className="text-sm font-bold text-blue-700">
              {formatCurrency(funcionario.salarioLiquido)}
            </p>
          </div>
        </div>

        {/* Custo Empresa */}
        <div className="p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Custo Empresa</span>
            </div>
            <span className="text-lg font-bold text-orange-700">
              {formatCurrency(funcionario.custoEmpresa)}
            </span>
          </div>
        </div>

        {/* Detalhamento */}
        <div className="text-xs space-y-1 px-2 py-2 bg-gray-50 rounded-lg">
          <div className="flex justify-between">
            <span className="text-muted-foreground">INSS</span>
            <span className="text-red-600 font-medium">-{formatCurrency(funcionario.inss)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IRRF</span>
            <span className="text-red-600 font-medium">-{formatCurrency(funcionario.irrf)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">FGTS (empresa)</span>
            <span className="text-orange-600 font-medium">{formatCurrency(funcionario.fgts)}</span>
          </div>
          {funcionario.valeRefeicao > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vale Refeição</span>
              <span className="text-green-600 font-medium">{formatCurrency(funcionario.valeRefeicao)}</span>
            </div>
          )}
          {funcionario.planoSaude > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plano de Saúde</span>
              <span className="text-green-600 font-medium">{formatCurrency(funcionario.planoSaude)}</span>
            </div>
          )}
        </div>

        {/* Botão ver histórico */}
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          onClick={onViewFolha}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Histórico de Folha
        </Button>
      </div>
    </Card>
  )
}
