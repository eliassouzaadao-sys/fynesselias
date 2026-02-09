"use client";

import { useState, useMemo } from "react";
import { Check, Calendar, AlertCircle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";

interface ParcelaPreview {
  numero: number;
  descricao: string;
  valor: number;
  vencimento: Date;
  pago: boolean;
}

interface ConfirmacaoParcelasModalProps {
  tipo: "pagar" | "receber";
  parcelas: ParcelaPreview[];
  onConfirm: (parcelasComStatus: ParcelaPreview[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  titulo?: string;
  subtitulo?: string;
}

export function ConfirmacaoParcelasModal({
  tipo,
  parcelas: parcelasIniciais,
  onConfirm,
  onCancel,
  isLoading = false,
  titulo,
  subtitulo,
}: ConfirmacaoParcelasModalProps) {
  const [parcelas, setParcelas] = useState<ParcelaPreview[]>(parcelasIniciais);

  const togglePago = (numero: number) => {
    setParcelas((prev) =>
      prev.map((p) =>
        p.numero === numero ? { ...p, pago: !p.pago } : p
      )
    );
  };

  const toggleTodas = (marcar: boolean) => {
    setParcelas((prev) => prev.map((p) => ({ ...p, pago: marcar })));
  };

  const resumo = useMemo(() => {
    const total = parcelas.reduce((sum, p) => sum + p.valor, 0);
    const pagas = parcelas.filter((p) => p.pago);
    const totalPago = pagas.reduce((sum, p) => sum + p.valor, 0);
    const pendentes = parcelas.filter((p) => !p.pago);
    const totalPendente = pendentes.reduce((sum, p) => sum + p.valor, 0);

    return {
      total,
      totalPago,
      totalPendente,
      qtdPagas: pagas.length,
      qtdPendentes: pendentes.length,
    };
  }, [parcelas]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {titulo || "Confirmar Lancamentos"}
          </DialogTitle>
          {subtitulo && (
            <DialogDescription>{subtitulo}</DialogDescription>
          )}
        </DialogHeader>

        {/* Resumo */}
        <div className="px-6 py-4 bg-muted/30 border-y flex-shrink-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{parcelas.length} {parcelas.length === 1 ? "lancamento" : "lancamentos"}</p>
              <p className="text-sm font-medium">{formatCurrency(resumo.total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ja Pagos</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">{resumo.qtdPagas}</p>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(resumo.totalPago)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">{resumo.qtdPendentes}</p>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">{formatCurrency(resumo.totalPendente)}</p>
            </div>
          </div>
        </div>

        {/* Acoes rapidas */}
        <div className="px-6 py-2 border-b flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-muted-foreground">
            Marque as que ja foram pagas
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleTodas(true)}
              disabled={isLoading}
            >
              Marcar Todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleTodas(false)}
              disabled={isLoading}
            >
              Desmarcar Todas
            </Button>
          </div>
        </div>

        {/* Lista de parcelas */}
        <ScrollArea className="flex-1 min-h-0 max-h-[40vh] px-6 overflow-y-auto">
          <div className="space-y-2 py-4 pb-2">
            {parcelas.map((parcela) => (
              <div
                key={parcela.numero}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                  parcela.pago
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : "bg-background border-border hover:bg-muted/50"
                }`}
                onClick={() => togglePago(parcela.numero)}
              >
                <Checkbox
                  checked={parcela.pago}
                  onCheckedChange={() => togglePago(parcela.numero)}
                  disabled={isLoading}
                />

                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${parcela.pago ? "text-green-700 dark:text-green-400" : ""}`}>
                    {parcela.descricao}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(parcela.vencimento)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-semibold ${parcela.pago ? "text-green-700 dark:text-green-400" : ""}`}>
                    {formatCurrency(parcela.valor)}
                  </p>
                  {parcela.pago && (
                    <span className="text-xs text-green-600 flex items-center gap-1 justify-end">
                      <Check className="h-3 w-3" />
                      Pago
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Aviso */}
        <div className="px-6 py-3 border-t bg-amber-50 dark:bg-amber-900/20 flex-shrink-0">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {parcelas.length} {tipo === "pagar" ? "contas a pagar" : "contas a receber"} serao criadas individualmente.
              As marcadas como pagas ja entrarao no fluxo de caixa.
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t flex-shrink-0 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Voltar
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(parcelas)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Criando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Confirmar ({parcelas.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
