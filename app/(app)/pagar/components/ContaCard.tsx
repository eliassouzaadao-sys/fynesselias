"use client";

import { AlertCircle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateBR } from "@/lib/helpers";
import type { Conta } from "@/lib/types";

interface ContaCardProps {
  conta: Conta;
  onClick: () => void;
  onViewDocument: () => void;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case "pago":
      return "bg-fyn-success/10 text-fyn-success border-fyn-success/20";
    case "pendente":
      return "bg-fyn-warning/10 text-fyn-warning border-fyn-warning/20";
    case "vencido":
      return "bg-fyn-danger/10 text-fyn-danger border-fyn-danger/20";
    default:
      return "bg-fyn-border text-fyn-text";
  }
};

const getStatusLabel = (conta: Conta): string => {
  if (conta.pago) return "pago";
  const venc = new Date(conta.dataVencimento);
  const hoje = new Date();
  if (venc < hoje) return "vencido";
  return "pendente";
};

export function ContaCard({ conta, onClick, onViewDocument }: ContaCardProps) {
  const status = getStatusLabel(conta);
  const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-fyn-text truncate">
            {conta.descricao || conta.beneficiario || "-"}
          </h3>
          <p className="text-xs text-fyn-muted mt-0.5">{conta.categoria || ""}</p>
        </div>
        <Badge className={`ml-2 ${getStatusColor(status)}`}>{statusDisplay}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
        <div>
          <p className="text-fyn-muted">Vencimento</p>
          <p className="text-fyn-text font-medium">{formatDateBR(conta.dataVencimento)}</p>
        </div>
        <div>
          <p className="text-fyn-muted">Centro de Custo</p>
          <p className="text-fyn-text font-medium truncate">{conta.categoria || "-"}</p>
        </div>
      </div>

      {!conta.observacoes && (
        <div className="rounded-md bg-orange-50 border border-orange-200 p-2 mb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-orange-900">Documento pendente</p>
              <p className="text-xs text-orange-700 mt-0.5">
                Anexe o documento para enviar ao contador
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-fyn-border">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-fyn-accent hover:text-fyn-accent hover:bg-fyn-accent/10 h-auto p-1"
          onClick={(e) => {
            e.stopPropagation();
            onViewDocument();
          }}
        >
          <FileText className="mr-1 h-3 w-3" />
          DOC-{conta.id}
        </Button>
        <span className="text-lg font-bold text-fyn-text">{formatCurrency(Number(conta.valor) || 0)}</span>
      </div>
    </Card>
  );
}
