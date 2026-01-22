"use client";

import { Clock, AlertCircle, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { safeFilter, safeReduce } from "@/lib/helpers";
import { isOverdue, isDueSoon, isCurrentMonth } from "@/lib/helpers";
import type { Conta } from "@/lib/types";

interface PagarKPIsProps {
  contas: Conta[];
}

export function PagarKPIs({ contas }: PagarKPIsProps) {
  const hoje = new Date();

  // Usar helpers seguros para filtrar e calcular
  const pendentes = safeFilter<Conta>(contas, (c) => !c.pago && new Date(c.dataVencimento) >= hoje);
  const vencidas = safeFilter<Conta>(contas, (c) => !c.pago && isOverdue(c.dataVencimento));
  const proximos7 = safeFilter<Conta>(contas, (c) => !c.pago && isDueSoon(c.dataVencimento));
  const pagosMes = safeFilter<Conta>(contas, (c) => {
    if (!c.pago || !c.atualizadoEm) return false;
    return isCurrentMonth(c.atualizadoEm);
  });

  const getValor = (c: Conta) => Number(c.valor) || 0;

  const totalPendente = safeReduce<Conta, number>(pendentes, (sum, c) => sum + getValor(c), 0);
  const totalVencido = safeReduce<Conta, number>(vencidas, (sum, c) => sum + getValor(c), 0);
  const totalProximos7 = safeReduce<Conta, number>(proximos7, (sum, c) => sum + getValor(c), 0);
  const totalPagoMes = safeReduce<Conta, number>(pagosMes, (sum, c) => sum + getValor(c), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Pendente */}
      <div className="rounded-xl bg-white shadow p-6 flex flex-col gap-2 border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="inline-block bg-yellow-100 p-2 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-400" />
          </span>
          <span className="ml-auto text-gray-500 font-medium">Pendente</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalPendente)}</div>
        <div className="text-gray-400 text-sm">{pendentes.length} contas</div>
      </div>

      {/* Vencido */}
      <div className="rounded-xl bg-white shadow p-6 flex flex-col gap-2 border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="inline-block bg-red-100 p-2 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </span>
          <span className="ml-auto text-red-500 font-medium">Vencido</span>
        </div>
        <div className="text-2xl font-bold text-red-500">{formatCurrency(totalVencido)}</div>
        <div className="text-gray-400 text-sm">{vencidas.length} contas</div>
      </div>

      {/* Próx. 7 dias */}
      <div className="rounded-xl bg-white shadow p-6 flex flex-col gap-2 border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="inline-block bg-blue-100 p-2 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-blue-500" />
          </span>
          <span className="ml-auto text-blue-500 font-medium">Próx. 7 dias</span>
        </div>
        <div className="text-2xl font-bold text-blue-500">{formatCurrency(totalProximos7)}</div>
        <div className="text-gray-400 text-sm">A vencer em breve</div>
      </div>

      {/* Pago este mês */}
      <div className="rounded-xl bg-white shadow p-6 flex flex-col gap-2 border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="inline-block bg-green-100 p-2 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </span>
          <span className="ml-auto text-green-500 font-medium">Pago este mês</span>
        </div>
        <div className="text-2xl font-bold text-green-500">{formatCurrency(totalPagoMes)}</div>
        <div className="text-gray-400 text-sm">{pagosMes.length} contas</div>
      </div>
    </div>
  );
}
