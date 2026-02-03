"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { Edit, Trash2, Eye, CreditCard } from "lucide-react"

interface CartaoCardProps {
  cartao: {
    id: number
    nome: string
    bandeira: string
    ultimos4Digitos: string
    diaVencimento: number
    diaFechamento: number
    limite: number
    limiteUtilizado: number
    limiteDisponivel: number
    banco?: { nome: string } | null
  }
  onEdit: () => void
  onDelete: () => void
  onViewFaturas: () => void
}

const bandeiraCores: Record<string, string> = {
  visa: "from-blue-600 to-blue-800",
  mastercard: "from-red-500 to-orange-500",
  elo: "from-yellow-500 to-yellow-600",
  amex: "from-blue-400 to-blue-600",
  hipercard: "from-red-600 to-red-800",
  diners: "from-cyan-500 to-cyan-700",
}

const bandeiraLabels: Record<string, string> = {
  visa: "VISA",
  mastercard: "MASTERCARD",
  elo: "ELO",
  amex: "AMEX",
  hipercard: "HIPERCARD",
  diners: "DINERS",
}

export function CartaoCard({ cartao, onEdit, onDelete, onViewFaturas }: CartaoCardProps) {
  const corGradiente = bandeiraCores[cartao.bandeira] || "from-gray-600 to-gray-800"
  const bandeiraLabel = bandeiraLabels[cartao.bandeira] || cartao.bandeira.toUpperCase()
  const percentUtilizado = cartao.limite > 0 ? (cartao.limiteUtilizado / cartao.limite) * 100 : 0

  return (
    <Card className="overflow-hidden">
      {/* Visual do Cartão */}
      <div className={`bg-gradient-to-br ${corGradiente} p-4 text-white`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs opacity-80">Cartão de Crédito</p>
            <p className="font-semibold">{cartao.nome}</p>
          </div>
          <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">
            {bandeiraLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-6 w-6" />
          <span className="font-mono text-lg tracking-wider">
            **** **** **** {cartao.ultimos4Digitos}
          </span>
        </div>

        <div className="flex justify-between text-xs opacity-80">
          <div>
            <p>Fechamento</p>
            <p className="font-semibold">Dia {cartao.diaFechamento}</p>
          </div>
          <div>
            <p>Vencimento</p>
            <p className="font-semibold">Dia {cartao.diaVencimento}</p>
          </div>
        </div>
      </div>

      {/* Informações e Ações */}
      <div className="p-4 space-y-4">
        {/* Barra de Limite */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-fyn-muted">Limite utilizado</span>
            <span className="font-medium text-fyn-text">{percentUtilizado.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                percentUtilizado > 80
                  ? "bg-red-500"
                  : percentUtilizado > 50
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(percentUtilizado, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-fyn-muted">
              {formatCurrency(cartao.limiteUtilizado)} usado
            </span>
            <span className="text-fyn-muted">
              {formatCurrency(cartao.limiteDisponivel)} disponível
            </span>
          </div>
        </div>

        {/* Limite Total */}
        <div className="flex justify-between items-center py-2 border-t border-fyn-border">
          <span className="text-sm text-fyn-muted">Limite Total</span>
          <span className="font-bold text-fyn-text">{formatCurrency(cartao.limite)}</span>
        </div>

        {/* Banco */}
        {cartao.banco && (
          <div className="flex justify-between items-center py-2 border-t border-fyn-border">
            <span className="text-sm text-fyn-muted">Banco</span>
            <span className="text-sm text-fyn-text">{cartao.banco.nome}</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewFaturas}
          >
            <Eye className="h-4 w-4 mr-1" />
            Faturas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
