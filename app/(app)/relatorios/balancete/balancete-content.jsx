
"use client"

import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/format"

// Exemplo de dados para o balancete gerencial
const balanceteData = [
  { codigo: "1.1.1", conta: "Caixa", saldoAnterior: 10000, debito: 2000, credito: 1500, saldoAtual: 10500 },
  { codigo: "1.1.2", conta: "Bancos", saldoAnterior: 5000, debito: 1000, credito: 2000, saldoAtual: 4000 },
  { codigo: "2.1.1", conta: "Fornecedores", saldoAnterior: -3000, debito: 500, credito: 1000, saldoAtual: -2500 },
  { codigo: "3.1.1", conta: "Capital Social", saldoAnterior: 20000, debito: 0, credito: 0, saldoAtual: 20000 },
]

export function BalanceteContent() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Balancete Gerencial"
        description="Demonstrativo gerencial seguindo a estrutura contábil."
      />
      <div className="text-xs text-gray-400 px-1 pb-1" style={{fontStyle: 'italic'}}>
        Este é um balancete gerencial, elaborado conforme práticas contábeis, sem validade fiscal.
      </div>
      <div className="overflow-x-auto rounded border border-fyn-border bg-fyn-bg">
        <table className="min-w-full text-sm">
          <thead className="bg-fyn-primary text-white">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Código</th>
              <th className="px-3 py-2 text-left font-medium">Conta</th>
              <th className="px-3 py-2 text-right font-medium">Saldo Anterior</th>
              <th className="px-3 py-2 text-right font-medium">Débito</th>
              <th className="px-3 py-2 text-right font-medium">Crédito</th>
              <th className="px-3 py-2 text-right font-medium">Saldo Atual</th>
            </tr>
          </thead>
          <tbody>
            {balanceteData.map((item, idx) => (
              <tr key={idx} className="border-b border-fyn-border last:border-0">
                <td className="px-3 py-1.5 text-fyn-text">{item.codigo}</td>
                <td className="px-3 py-1.5 text-fyn-text">{item.conta}</td>
                <td className="px-3 py-1.5 text-right text-fyn-text">{formatCurrency(item.saldoAnterior)}</td>
                <td className="px-3 py-1.5 text-right text-fyn-success">{formatCurrency(item.debito)}</td>
                <td className="px-3 py-1.5 text-right text-fyn-danger">{formatCurrency(item.credito)}</td>
                <td className={`px-3 py-1.5 text-right ${item.saldoAtual < 0 ? "text-fyn-danger" : "text-fyn-text"}`}>{formatCurrency(item.saldoAtual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
