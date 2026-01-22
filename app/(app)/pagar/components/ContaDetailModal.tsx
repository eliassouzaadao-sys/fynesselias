"use client";

import { useState, useRef } from "react";
import { X, CheckCircle2, Edit, Trash2, FileText, Calendar, DollarSign, User, CreditCard, Building2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateBR } from "@/lib/helpers";
import type { Conta } from "@/lib/types";

interface ContaDetailModalProps {
  conta: Conta;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pago":
      return "bg-green-100 text-green-800 border-green-200";
    case "pendente":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "vencido":
      return "bg-red-100 text-red-800 border-red-200";
    case "cancelado":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pago: "Pago",
    pendente: "Pendente",
    vencido: "Vencido",
    cancelado: "Cancelado",
  };
  return labels[status] || status;
};

export function ContaDetailModal({ conta, onClose, onUpdate, onDelete }: ContaDetailModalProps) {
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [showCheckAnimation, setShowCheckAnimation] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isPago = conta.pago || conta.status === "pago";
  const isPendente = conta.status === "pendente" || conta.status === "vencido";

  // Marca como pago/recebido
  const handleMarcarComoPago = async () => {
    setError(null);
    setIsMarkingPaid(true);

    try {
      const response = await fetch(`/api/contas/${conta.id}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataPagamento,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao registrar pagamento");
      }

      // Success animation
      setShowCheckAnimation(true);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }

      setTimeout(() => {
        setShowCheckAnimation(false);
        onUpdate();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao registrar pagamento");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  // Deleta conta
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/contas/${conta.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar conta");
      }

      onDelete();
      onClose();
    } catch (err) {
      setError("Erro ao deletar conta");
    }
  };

  const tipoConta = conta.tipo === "pagar" ? "Pagamento" : "Recebimento";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-fyn-border p-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold text-fyn-text">Detalhes da Conta</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status e Valor */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-fyn-text mb-1">{conta.descricao}</h3>
                {conta.beneficiario && (
                  <p className="text-sm text-fyn-muted">{conta.beneficiario}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-fyn-text mb-2">
                  {formatCurrency(Number(conta.valor) || 0)}
                </p>
                <Badge className={getStatusColor(conta.status)}>
                  {getStatusLabel(conta.status)}
                </Badge>
              </div>
            </div>

            {/* Informações Principais em Grid */}
            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Vencimento"
                value={formatDateBR(conta.vencimento)}
              />
              {conta.dataPagamento && (
                <InfoItem
                  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                  label={`Data do ${tipoConta}`}
                  value={formatDateBR(conta.dataPagamento)}
                  highlighted
                />
              )}
              {conta.banco && (
                <InfoItem icon={<Building2 className="h-4 w-4" />} label="Banco" value={conta.banco} />
              )}
              {conta.formaPagamento && (
                <InfoItem
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Forma de Pagamento"
                  value={conta.formaPagamento}
                />
              )}
              {conta.numeroDocumento && (
                <InfoItem
                  icon={<FileText className="h-4 w-4" />}
                  label="Documento"
                  value={conta.numeroDocumento}
                />
              )}
              {conta.categoria && (
                <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Categoria" value={conta.categoria} />
              )}
            </div>

            {/* Observações */}
            {conta.observacoes && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs text-fyn-muted mb-1 font-medium">Observações</p>
                <p className="text-sm text-fyn-text whitespace-pre-wrap">{conta.observacoes}</p>
              </div>
            )}

            {/* Alert de documento pendente */}
            {!conta.comprovante && !isPago && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-orange-900">Documento não anexado</p>
                    <p className="text-xs text-orange-700 mt-1">
                      Anexe o documento para enviar ao contador
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Marcar como Pago - SEÇÃO DESTACADA */}
            {!isPago && isPendente && (
              <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-4 space-y-3">
                <p className="text-sm font-medium text-blue-900">Registrar {tipoConta}</p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-blue-800">
                    Data do {tipoConta}
                  </label>
                  <Input
                    type="date"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleMarcarComoPago}
                  disabled={isMarkingPaid}
                >
                  {isMarkingPaid ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmar {tipoConta}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Comprovante */}
            {isPago && conta.dataPagamento && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-900">
                    {tipoConta} Confirmado
                  </p>
                </div>
                <p className="text-xs text-green-700">
                  Registrado em {formatDateBR(conta.dataPagamento)}
                </p>
                {conta.noFluxoCaixa && (
                  <p className="text-xs text-green-700 mt-1">
                    ✓ Movimentado para o fluxo de caixa
                  </p>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-4 border-t border-fyn-border">
              {!isPago && (
                <Button variant="outline" className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-fyn-border text-xs text-fyn-muted space-y-1">
              <p>Criado em: {formatDateBR(conta.criadoEm)}</p>
              <p>Última atualização: {formatDateBR(conta.atualizadoEm)}</p>
              {conta.createdViaWhatsApp && (
                <p className="text-blue-600">✓ Criado via WhatsApp</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Success Animation Overlay */}
      {showCheckAnimation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <CheckCircle2 className="w-24 h-24 text-green-500 animate-bounce-in" />
            <span className="text-2xl font-bold text-white">
              {tipoConta} registrado com sucesso!
            </span>
          </div>
          <audio ref={audioRef} src="/checkmark-sound.mp3" preload="auto" />
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-fyn-text mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-fyn-muted mb-6">
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

// Helper component for info items
function InfoItem({
  icon,
  label,
  value,
  highlighted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`space-y-1 ${highlighted ? "p-2 bg-green-50 rounded-lg" : ""}`}>
      <div className="flex items-center gap-1.5 text-fyn-muted">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-sm font-medium text-fyn-text">{value}</p>
    </div>
  );
}
