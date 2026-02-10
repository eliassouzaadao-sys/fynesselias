"use client";

import { useState, useEffect } from "react";
import { History, Calendar, DollarSign, Layers, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatCurrency } from "@/lib/format";

interface SnapshotParcela {
  id: number;
  numeroParcela: string;
  valor: number;
  vencimento: string;
  pago: boolean;
  dataPagamento: string | null;
  status: string;
}

interface SnapshotParcelamento {
  valorTotal: number;
  totalParcelas: number;
  descricao: string;
  beneficiario: string | null;
  codigoTipo: string | null;
  parcelas: SnapshotParcela[];
}

interface HistoricoItem {
  id: number;
  tipoAlteracao: string;
  descricao: string;
  dataAlteracao: string;
  valorTotalAnterior: number | null;
  valorTotalNovo: number | null;
  qtdParcelasAnterior: number | null;
  qtdParcelasNovo: number | null;
  snapshot: SnapshotParcelamento | null;
}

interface HistoricoParcelamentoModalProps {
  grupoParcelamentoId: string;
  contaMacroId?: number;
  onClose: () => void;
}

export function HistoricoParcelamentoModal({
  grupoParcelamentoId,
  contaMacroId,
  onClose,
}: HistoricoParcelamentoModalProps) {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchHistorico = async () => {
      setLoading(true);
      try {
        const id = contaMacroId || grupoParcelamentoId;
        const res = await fetch(`/api/contas/${id}/parcelas/historico`);
        const data = await res.json();
        setHistorico(data.historico || []);
      } catch (err) {
        console.error("Erro ao carregar historico:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorico();
  }, [grupoParcelamentoId, contaMacroId]);

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'QUANTIDADE': return <Layers className="h-4 w-4" />;
      case 'VALOR_TOTAL': return <DollarSign className="h-4 w-4" />;
      case 'EDICAO_INDIVIDUAL': return <Calendar className="h-4 w-4" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'QUANTIDADE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'VALOR_TOTAL': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'EDICAO_INDIVIDUAL': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'QUANTIDADE': return 'Quantidade';
      case 'VALOR_TOTAL': return 'Valor Total';
      case 'EDICAO_INDIVIDUAL': return 'Edicao';
      default: return tipo;
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historico de Alteracoes
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma alteracao registrada</p>
              <p className="text-sm mt-1">O historico sera registrado a partir da proxima edicao</p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {historico.map((item) => (
                <Collapsible
                  key={item.id}
                  open={expandedItems.has(item.id)}
                  onOpenChange={() => toggleExpanded(item.id)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${getTipoBadgeColor(item.tipoAlteracao)}`}>
                              {getTipoIcon(item.tipoAlteracao)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getTipoBadgeColor(item.tipoAlteracao)}`}>
                                  {getTipoLabel(item.tipoAlteracao)}
                                </span>
                              </div>
                              <p className="font-medium text-sm truncate">{item.descricao}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDateTime(item.dataAlteracao)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.valorTotalAnterior !== null && item.valorTotalNovo !== null && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatCurrency(item.valorTotalAnterior)} → {formatCurrency(item.valorTotalNovo)}
                              </span>
                            )}
                            {expandedItems.has(item.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t px-4 py-3 bg-muted/30">
                        <p className="text-sm font-medium mb-3">Estado anterior das parcelas:</p>
                        {item.snapshot?.parcelas && item.snapshot.parcelas.length > 0 ? (
                          <ScrollArea className="max-h-[200px]">
                            <div className="space-y-1 pr-4">
                              {item.snapshot.parcelas.map((parcela, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between text-sm py-1.5 px-2 rounded ${
                                    parcela.pago ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800/50'
                                  }`}
                                >
                                  <span className="text-muted-foreground">
                                    <span className="font-medium text-foreground">{parcela.numeroParcela}</span>
                                    {' - '}
                                    {formatDate(parcela.vencimento)}
                                  </span>
                                  <span className={parcela.pago ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                                    {formatCurrency(parcela.valor)}
                                    {parcela.pago && ' (pago)'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <p className="text-sm text-muted-foreground">Detalhes nao disponiveis</p>
                        )}
                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground flex justify-between">
                          <span>Total anterior:</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(item.snapshot?.valorTotal || 0)} ({item.snapshot?.totalParcelas || 0} parcelas)
                          </span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
