"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Check, Plus, Trash2, Calendar, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// ScrollArea removido - usando overflow-y-auto nativo
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/format";

interface Parcela {
  id: number;
  numeroParcela: string;
  valor: number;
  vencimento: string;
  pago: boolean;
  dataPagamento?: string | null;
  modificada?: boolean; // Flag para indicar se foi modificada
}

interface EditParcelamentoModalProps {
  conta: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditParcelamentoModal({ conta, onClose, onSuccess }: EditParcelamentoModalProps) {
  console.log("[EditParcelamentoModal] conta recebida:", conta);

  // Usar parcelas diretamente da conta
  const parcelasOriginais = conta?.parcelas || [];

  // Estados - agora um único array com todas as parcelas
  const [descricao, setDescricao] = useState(conta?.descricao || "");
  const [beneficiario, setBeneficiario] = useState(conta?.beneficiario || "");
  const [codigoTipo, setCodigoTipo] = useState(conta?.codigoTipo || "");
  const [parcelas, setParcelas] = useState<Parcela[]>([]);

  // Estados para edição de valor total e quantidade (conta macro)
  const [valorTotalInput, setValorTotalInput] = useState<number>(0);
  const [quantidadeInput, setQuantidadeInput] = useState<number>(0);
  const [valorTotalOriginal, setValorTotalOriginal] = useState<number>(0);
  const [quantidadeOriginal, setQuantidadeOriginal] = useState<number>(0);

  // Estados de UI
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [centros, setCentros] = useState<any[]>([]);

  // Estado para confirmação de exclusão de parcela paga
  const [parcelaToDelete, setParcelaToDelete] = useState<{ index: number; parcela: Parcela } | null>(null);

  // Formatar data para input
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return new Date().toISOString().split('T')[0];
    if (typeof dateValue === 'string') {
      return dateValue.split('T')[0];
    }
    return new Date(dateValue).toISOString().split('T')[0];
  };

  // Inicializar parcelas - todas em um único array, ordenadas por vencimento
  useEffect(() => {
    if (parcelasOriginais.length > 0) {
      const todasParcelas = parcelasOriginais
        .map((p: any) => ({
          id: p.id,
          numeroParcela: p.numeroParcela || "",
          valor: Number(p.valor) || 0,
          vencimento: formatDateForInput(p.vencimento),
          pago: !!p.pago,
          dataPagamento: p.dataPagamento ? formatDateForInput(p.dataPagamento) : null,
          modificada: false
        }))
        .sort((a: Parcela, b: Parcela) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());

      setParcelas(todasParcelas);

      // Inicializar valores totais
      const total = todasParcelas.reduce((sum: number, p: Parcela) => sum + p.valor, 0);
      setValorTotalInput(total);
      setValorTotalOriginal(total);
      setQuantidadeInput(todasParcelas.length);
      setQuantidadeOriginal(todasParcelas.length);
    }
  }, []);

  // Carregar centros de custo
  useEffect(() => {
    const fetchCentros = async () => {
      try {
        const tipo = conta.tipo === "pagar" ? "despesa" : "faturamento";
        const res = await fetch(`/api/centros?tipo=${tipo}&hierarquico=true`);
        const data = await res.json();
        setCentros(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar centros:", err);
      }
    };
    fetchCentros();
  }, [conta.tipo]);

  // Cálculos do resumo
  const resumo = useMemo(() => {
    const totalPagas = parcelas.filter(p => p.pago).reduce((sum, p) => sum + (p.valor || 0), 0);
    const totalPendentes = parcelas.filter(p => !p.pago).reduce((sum, p) => sum + (p.valor || 0), 0);
    return {
      total: totalPagas + totalPendentes,
      totalPagas,
      totalPendentes,
      qtdPagas: parcelas.filter(p => p.pago).length,
      qtdPendentes: parcelas.filter(p => !p.pago).length,
      qtdTotal: parcelas.length
    };
  }, [parcelas]);

  // Recalcular parcelas quando valor total mudar
  const handleValorTotalChange = (novoValorTotal: number) => {
    setValorTotalInput(novoValorTotal);

    if (parcelas.length === 0 || novoValorTotal <= 0) return;

    // Dividir igualmente entre todas as parcelas
    const novoValorParcela = novoValorTotal / parcelas.length;

    setParcelas(prev => prev.map(p => ({
      ...p,
      valor: novoValorParcela,
      modificada: true
    })));
  };

  // Alterar quantidade de parcelas
  const handleQuantidadeChange = (novaQuantidade: number) => {
    if (novaQuantidade < 1) return;

    setQuantidadeInput(novaQuantidade);

    const valorTotal = valorTotalInput || resumo.total;
    const novoValorParcela = valorTotal / novaQuantidade;

    if (novaQuantidade > parcelas.length) {
      // Adicionar novas parcelas
      const parcelasParaAdicionar = novaQuantidade - parcelas.length;
      const ultimaParcela = parcelas[parcelas.length - 1];

      const novasParcelas: Parcela[] = [];
      for (let i = 0; i < parcelasParaAdicionar; i++) {
        const novaData = new Date(ultimaParcela?.vencimento + "T12:00:00" || new Date());
        novaData.setMonth(novaData.getMonth() + i + 1);

        novasParcelas.push({
          id: -Date.now() - i,
          numeroParcela: "",
          valor: novoValorParcela,
          vencimento: novaData.toISOString().split('T')[0],
          pago: false,
          dataPagamento: null,
          modificada: true
        });
      }

      // Atualizar valor de todas as parcelas e adicionar novas
      setParcelas(prev => [
        ...prev.map(p => ({ ...p, valor: novoValorParcela, modificada: true })),
        ...novasParcelas
      ]);
    } else if (novaQuantidade < parcelas.length) {
      // Remover parcelas pendentes do final
      const parcelasParaRemover = parcelas.length - novaQuantidade;
      const parcelasPendentes = parcelas.filter(p => !p.pago);

      if (parcelasPendentes.length < parcelasParaRemover) {
        setError(`Não é possível reduzir para ${novaQuantidade} parcelas. Existem ${parcelas.length - parcelasPendentes.length} parcelas pagas.`);
        setQuantidadeInput(parcelas.length);
        return;
      }

      // Ordenar: manter pagas + pendentes do início, remover pendentes do final
      const parcelasOrdenadas = [...parcelas].sort((a, b) => {
        if (a.pago !== b.pago) return a.pago ? -1 : 1; // Pagas primeiro
        return new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime();
      });

      // Manter apenas as primeiras novaQuantidade
      const parcelasMantidas = parcelasOrdenadas.slice(0, novaQuantidade);

      // Atualizar valores
      setParcelas(parcelasMantidas.map(p => ({
        ...p,
        valor: novoValorParcela,
        modificada: true
      })).sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()));
    }
  };

  // Atualizar parcela (qualquer uma)
  const updateParcela = (index: number, field: string, value: any) => {
    setParcelas(prev => prev.map((p, i) => {
      if (i === index) {
        const updated = { ...p, [field]: value, modificada: true };
        // Se está marcando como paga e não tem dataPagamento, definir data atual
        if (field === 'pago' && value === true && !p.dataPagamento) {
          updated.dataPagamento = new Date().toISOString().split('T')[0];
        }
        // Se está desmarcando como paga, limpar dataPagamento
        if (field === 'pago' && value === false) {
          updated.dataPagamento = null;
        }
        return updated;
      }
      return p;
    }));
  };

  // Adicionar nova parcela
  const addParcela = () => {
    const ultimaParcela = parcelas[parcelas.length - 1];
    let novaData = new Date();

    if (ultimaParcela?.vencimento) {
      novaData = new Date(ultimaParcela.vencimento + "T12:00:00");
      novaData.setMonth(novaData.getMonth() + 1);
    }

    const valorBase = parcelas[0]?.valor || 0;

    setParcelas(prev => [...prev, {
      id: -Date.now(), // ID negativo = nova parcela
      numeroParcela: "",
      valor: valorBase,
      vencimento: novaData.toISOString().split('T')[0],
      pago: false,
      dataPagamento: null,
      modificada: true
    }]);
  };

  // Remover parcela - solicitar confirmação se for paga
  const handleRemoveParcela = (index: number) => {
    const parcela = parcelas[index];

    if (parcelas.length <= 1) {
      setError("Deve haver pelo menos uma parcela");
      return;
    }

    if (parcela.pago) {
      // Se parcela está paga, pedir confirmação
      setParcelaToDelete({ index, parcela });
    } else {
      // Se pendente, remover diretamente
      removeParcela(index);
    }
  };

  // Confirmar remoção de parcela
  const removeParcela = (index: number) => {
    setParcelas(prev => prev.filter((_, i) => i !== index));
    setParcelaToDelete(null);
  };

  // Salvar alterações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!descricao.trim()) {
      setError("Descrição é obrigatória");
      return;
    }

    if (parcelas.length === 0) {
      setError("Deve haver pelo menos uma parcela");
      return;
    }

    // Validar valores
    for (const p of parcelas) {
      if (!p.valor || p.valor <= 0) {
        setError("Todas as parcelas devem ter valor maior que zero");
        return;
      }
    }

    setIsSaving(true);

    try {
      // Usar ID da conta macro se disponível, senão grupoParcelamentoId
      const grupoId = conta.isContaMacro ? conta.id : (conta.grupoParcelamentoId || conta.id);

      console.log("[EditParcelamentoModal] Salvando parcelamento:", grupoId);

      // Verificar se houve alteração de valor total ou quantidade
      const valorTotalAlterado = valorTotalInput !== valorTotalOriginal;
      const quantidadeAlterada = quantidadeInput !== quantidadeOriginal;

      // Enviar TODAS as parcelas para a API
      const response = await fetch(`/api/contas/${grupoId}/parcelas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim(),
          beneficiario: beneficiario.trim() || null,
          codigoTipo: codigoTipo || null,
          totalParcelas: parcelas.length,
          // Enviar valor total se foi alterado
          ...(valorTotalAlterado && { valorTotal: valorTotalInput }),
          // Enviar nova quantidade se foi alterada
          ...(quantidadeAlterada && { novaQuantidade: quantidadeInput }),
          parcelasAtualizadas: parcelas.map((p, i) => ({
            id: p.id > 0 ? p.id : null,
            valor: p.valor,
            vencimento: p.vencimento,
            pago: p.pago,
            dataPagamento: p.dataPagamento,
            numeroParcela: `${i + 1}/${parcelas.length}`
          }))
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao atualizar parcelamento");
      }

      setSuccessMessage(result.message || "Parcelamento atualizado!");
      setTimeout(() => onSuccess(), 1000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  // Se não temos parcelas, mostrar erro
  if (parcelasOriginais.length === 0) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Parcelamento</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-muted-foreground">
            <p>Esta conta não possui parcelas.</p>
            <p className="text-sm mt-2">Use o modal de edição simples para contas não parceladas.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Editar Parcelamento
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            {/* Área de Scroll Principal - usa div com overflow em vez de ScrollArea */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Campos Gerais */}
              <div className="px-6 py-4 space-y-4 border-b">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição *</Label>
                  <Input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Compra parcelada"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fornecedor/Cliente</Label>
                  <Input
                    value={beneficiario}
                    onChange={(e) => setBeneficiario(e.target.value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Centro de Custo</Label>
                  <Select value={codigoTipo || "none"} onValueChange={(v) => setCodigoTipo(v === "none" ? "" : v)} disabled={isSaving}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {centros.map((centro) => (
                        <SelectItem key={centro.id} value={centro.sigla}>
                          {centro.sigla} - {centro.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campos de Valor Total e Quantidade (Conta Macro) */}
              <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Valor Total
                    {valorTotalInput !== valorTotalOriginal && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                        Alterado
                      </Badge>
                    )}
                  </Label>
                  <CurrencyInput
                    value={valorTotalInput}
                    onValueChange={handleValorTotalChange}
                    disabled={isSaving}
                    className="font-semibold"
                  />
                  {valorTotalInput !== valorTotalOriginal && parcelas.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Cada parcela: {formatCurrency(valorTotalInput / parcelas.length)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Quantidade de Parcelas
                    {quantidadeInput !== quantidadeOriginal && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                        {quantidadeInput > quantidadeOriginal ? `+${quantidadeInput - quantidadeOriginal}` : quantidadeInput - quantidadeOriginal}
                      </Badge>
                    )}
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={quantidadeInput || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value === '') {
                        setQuantidadeInput(0);
                      } else {
                        handleQuantidadeChange(parseInt(value));
                      }
                    }}
                    disabled={isSaving}
                    className="font-semibold"
                  />
                  {quantidadeInput !== quantidadeOriginal && quantidadeInput > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {quantidadeInput > quantidadeOriginal
                        ? `${quantidadeInput - quantidadeOriginal} parcela(s) será(ão) adicionada(s)`
                        : `${quantidadeOriginal - quantidadeInput} parcela(s) pendente(s) será(ão) removida(s)`
                      }
                    </p>
                  )}
                </div>
              </div>
              </div>

              {/* Header das Parcelas */}
              <div className="px-6 py-3 flex items-center justify-between bg-muted/30">
                <span className="font-medium text-sm">
                  Parcelas ({resumo.qtdPagas}/{resumo.qtdTotal} pagas)
                </span>
                <Button type="button" variant="outline" size="sm" onClick={addParcela} disabled={isSaving}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {/* Lista de Parcelas - Todas editáveis */}
              <div className="px-6 py-4 space-y-3">
                {parcelas.map((parcela, index) => (
                  <Card
                    key={parcela.id}
                    className={`p-3 ${parcela.pago ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}
                  >
                    <div className="space-y-2">
                      {/* Linha principal */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Checkbox de pago */}
                        <Checkbox
                          checked={parcela.pago}
                          onCheckedChange={(checked) => updateParcela(index, "pago", !!checked)}
                          disabled={isSaving}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />

                        {/* Número da parcela */}
                        <span className={`text-sm font-medium w-14 ${parcela.pago ? 'text-green-700' : 'text-yellow-700'}`}>
                          {index + 1}/{parcelas.length}
                        </span>

                        {/* Data de vencimento */}
                        <Input
                          type="date"
                          value={parcela.vencimento}
                          onChange={(e) => updateParcela(index, "vencimento", e.target.value)}
                          className="w-36 h-8 text-sm"
                          disabled={isSaving}
                        />

                        {/* Valor */}
                        <CurrencyInput
                          value={parcela.valor}
                          onValueChange={(v) => updateParcela(index, "valor", v)}
                          className="w-28 h-8 text-sm"
                          disabled={isSaving}
                        />

                        {/* Badge de status */}
                        <Badge
                          variant="outline"
                          className={parcela.pago ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                        >
                          {parcela.pago ? 'Paga' : 'Pendente'}
                        </Badge>

                        {/* Botão de remover */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveParcela(index)}
                          disabled={isSaving}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Aviso para parcela paga */}
                      {parcela.pago && parcela.modificada && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 pl-6">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Editar parcela paga pode afetar o fluxo de caixa</span>
                        </div>
                      )}

                      {/* Data de pagamento (se paga) */}
                      {parcela.pago && (
                        <div className="flex items-center gap-2 pl-6">
                          <span className="text-xs text-muted-foreground">Pago em:</span>
                          <Input
                            type="date"
                            value={parcela.dataPagamento || ''}
                            onChange={(e) => updateParcela(index, "dataPagamento", e.target.value)}
                            className="w-36 h-7 text-xs"
                            disabled={isSaving}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {parcelas.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma parcela encontrada.</p>
                    <Button type="button" variant="outline" size="sm" onClick={addParcela} className="mt-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Parcela
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Resumo - Fixo no rodapé */}
            <div className="px-6 py-3 border-t bg-muted/30 shrink-0">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold">{formatCurrency(resumo.total)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pago</p>
                  <p className="font-semibold text-green-600">{formatCurrency(resumo.totalPagas)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pendente</p>
                  <p className="font-semibold text-yellow-600">{formatCurrency(resumo.totalPendentes)}</p>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="px-6 py-2">
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="px-6 py-2">
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <DialogFooter className="px-6 py-4 border-t shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para remover parcela paga */}
      <AlertDialog open={!!parcelaToDelete} onOpenChange={() => setParcelaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover parcela paga?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta parcela já foi marcada como paga. Removê-la irá afetar o fluxo de caixa e os registros financeiros.
              <br /><br />
              <strong>Parcela {parcelaToDelete?.index !== undefined ? parcelaToDelete.index + 1 : ''}</strong>: {formatCurrency(parcelaToDelete?.parcela.valor || 0)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => parcelaToDelete && removeParcela(parcelaToDelete.index)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
