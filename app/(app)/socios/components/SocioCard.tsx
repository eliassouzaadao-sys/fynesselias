"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { User, Edit, Trash2, Eye, TrendingDown, Wallet, Receipt } from "lucide-react"

interface Socio {
  id: number
  nome: string
  sigla: string
  cpfSocio: string
  proLaboreBase: number
  gastosCartao: number
  proLaboreLiquido: number
  ultimosGastos?: {
    id: number
    descricao: string
    valor: number
    dataPagamento: string
  }[]
}

interface SocioCardProps {
  socio: Socio
  onEdit: () => void
  onDelete: () => void
  onViewProLabore: () => void
}

export function SocioCard({ socio, onEdit, onDelete, onViewProLabore }: SocioCardProps) {
  const formatCPF = (cpf: string) => {
    if (!cpf) return "-"
    const cleaned = cpf.replace(/\D/g, "")
    if (cleaned.length !== 11) return cpf
    return cleaned.slice(0, 3) + "." + cleaned.slice(3, 6) + "." + cleaned.slice(6, 9) + "-" + cleaned.slice(9)
  }

  const percentDesconto = socio.proLaboreBase > 0
    ? (socio.gastosCartao / socio.proLaboreBase) * 100
    : 0

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{socio.nome}</h3>
              <p className="text-xs text-muted-foreground">CPF: {formatCPF(socio.cpfSocio)}</p>
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

        {/* Valores do Pro-labore */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <Wallet className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Bruto</p>
            <p className="text-sm font-bold text-green-700">
              {formatCurrency(socio.proLaboreBase)}
            </p>
          </div>

          <div className="text-center p-2 bg-red-50 rounded-lg">
            <TrendingDown className="h-4 w-4 text-red-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Descontos</p>
            <p className="text-sm font-bold text-red-700">
              -{formatCurrency(socio.gastosCartao)}
            </p>
          </div>

          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <Wallet className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Líquido</p>
            <p className="text-sm font-bold text-blue-700">
              {formatCurrency(socio.proLaboreLiquido)}
            </p>
          </div>
        </div>

        {/* Barra de progresso de desconto */}
        {socio.gastosCartao > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Desconto aplicado</span>
              <span>{percentDesconto.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all"
                style={{ width: Math.min(percentDesconto, 100) + '%' }}
              />
            </div>
          </div>
        )}

        {/* Últimos gastos */}
        {socio.ultimosGastos && socio.ultimosGastos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              Últimos descontos
            </p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {socio.ultimosGastos.slice(0, 3).map((gasto) => (
                <div key={gasto.id} className="flex justify-between text-xs px-2 py-1 bg-gray-50 rounded">
                  <span className="text-foreground truncate max-w-[60%]">{gasto.descricao}</span>
                  <span className="text-red-600 font-medium">-{formatCurrency(gasto.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botao ver detalhes */}
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          onClick={onViewProLabore}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Histórico de Pró-labore
        </Button>
      </div>
    </Card>
  )
}
