"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Loader2, CreditCard, Calculator, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";

interface CartaoCredito {
  id: number;
  nome: string;
  bandeira: string;
  ultimos4Digitos: string;
  diaFechamento: number;
  diaVencimento: number;
}

interface SimpleContaModalProps {
  tipo: "pagar" | "receber";
  onClose: () => void;
  onSuccess: () => void;
}

type TipoParcelamento = "avista" | "valor_total" | "valor_parcela";

export function SimpleContaModal({ tipo, onClose, onSuccess }: SimpleContaModalProps) {
  const [codigoTipo, setCodigoTipo] = useState("");
  const [beneficiario, setBeneficiario] = useState("");
  const [descricao, setDescricao] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [valor, setValor] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centros, setCentros] = useState<any[]>([]);
  const [loadingCentros, setLoadingCentros] = useState(false);

  // Estados para parcelamento
  const [tipoParcelamento, setTipoParcelamento] = useState<TipoParcelamento>("avista");
  const [totalParcelas, setTotalParcelas] = useState("");
  const [parcelaAtual, setParcelaAtual] = useState("");

  // Estados para cartão de crédito
  const [cartaoId, setCartaoId] = useState("");
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [loadingCartoes, setLoadingCartoes] = useState(false);

  // Cálculos para parcelamento
  const calculosParcelamento = useMemo(() => {
    const numParcelas = parseInt(totalParcelas) || 0;
    const numParcelaAtual = parseInt(parcelaAtual) || 1;

    if (tipoParcelamento === "valor_total" && numParcelas > 0 && valor > 0) {
      // Forma 1: Valor total informado, calcular valor da parcela
      const valorParcela = valor / numParcelas;
      return {
        valorParcela,
        valorTotal: valor,
        parcelasRestantes: numParcelas,
        descricao: `${numParcelas}x de ${formatCurrency(valorParcela)}`,
      };
    }

    if (tipoParcelamento === "valor_parcela" && numParcelas > 0 && valor > 0 && numParcelaAtual > 0) {
      // Forma 2: Valor da parcela informado, calcular valor total
      const valorTotal = valor * numParcelas;
      const parcelasRestantes = numParcelas - numParcelaAtual + 1;
      return {
        valorParcela: valor,
        valorTotal,
        parcelasRestantes,
        descricao: `Parcela ${numParcelaAtual}/${numParcelas} - Total: ${formatCurrency(valorTotal)}`,
      };
    }

    return null;
  }, [tipoParcelamento, valor, totalParcelas, parcelaAtual]);

  const titulo = tipo === "pagar" ? "Nova Conta a Pagar" : "Nova Conta a Receber";
  const labelPessoa = tipo === "pagar" ? "Fornecedor" : "Cliente";

  // Fetch centros based on tipo
  useEffect(() => {
    const fetchCentros = async () => {
      setLoadingCentros(true);
      try {
        const tipoCentro = tipo === "pagar" ? "despesa" : "faturamento";
        const res = await fetch(`/api/centros?tipo=${tipoCentro}`);
        const data = await res.json();
        setCentros(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching centros:", err);
        setCentros([]);
      } finally {
        setLoadingCentros(false);
      }
    };

    fetchCentros();
  }, [tipo]);

  // Fetch cartões de crédito (apenas para tipo "pagar")
  useEffect(() => {
    if (tipo !== "pagar") return;

    const fetchCartoes = async () => {
      setLoadingCartoes(true);
      try {
        const res = await fetch("/api/cartoes");
        const data = await res.json();
        setCartoes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching cartoes:", err);
        setCartoes([]);
      } finally {
        setLoadingCartoes(false);
      }
    };

    fetchCartoes();
  }, [tipo]);

  // Calcular qual fatura o lançamento cairá
  const calcularFaturaDestino = (): string | null => {
    if (!cartaoId || cartaoId === "none" || !vencimento) return null;

    const cartaoSelecionado = cartoes.find(c => c.id.toString() === cartaoId);
    if (!cartaoSelecionado) return null;

    const dataCompra = new Date(vencimento + "T12:00:00");
    const diaCompra = dataCompra.getDate();
    let mes = dataCompra.getMonth();
    let ano = dataCompra.getFullYear();

    // Se a compra foi depois do fechamento, vai para a fatura do próximo mês
    if (diaCompra > cartaoSelecionado.diaFechamento) {
      mes += 1;
      if (mes > 11) {
        mes = 0;
        ano += 1;
      }
    }

    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return `${meses[mes]}/${ano}`;
  };

  const faturaDestino = calcularFaturaDestino();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações básicas
    if (!beneficiario.trim()) {
      setError(`${tipo === "pagar" ? "Fornecedor" : "Cliente"} é obrigatório`);
      return;
    }

    if (!descricao.trim()) {
      setError("Descrição é obrigatória");
      return;
    }

    if (!valor || valor <= 0) {
      setError("Valor deve ser maior que zero");
      return;
    }

    if (!vencimento) {
      setError("Data de vencimento é obrigatória");
      return;
    }

    // Validações de parcelamento
    if (tipoParcelamento === "valor_total") {
      const numParcelas = parseInt(totalParcelas);
      if (!numParcelas || numParcelas < 2) {
        setError("Informe a quantidade de parcelas (minimo 2)");
        return;
      }
    }

    if (tipoParcelamento === "valor_parcela") {
      const numParcelas = parseInt(totalParcelas);
      const numParcelaAtual = parseInt(parcelaAtual);
      if (!numParcelas || numParcelas < 1) {
        setError("Informe o total de parcelas");
        return;
      }
      if (!numParcelaAtual || numParcelaAtual < 1) {
        setError("Informe qual parcela esta lancando");
        return;
      }
      if (numParcelaAtual > numParcelas) {
        setError("A parcela atual nao pode ser maior que o total");
        return;
      }
    }

    setIsSaving(true);

    try {
      // Preparar dados baseado no tipo de parcelamento
      let valorEnvio = valor;
      let numeroParcela: string | null = null;
      let totalParcelasEnvio: number | null = null;

      if (tipoParcelamento === "avista") {
        // Pagamento a vista - sem parcelamento
        numeroParcela = null;
        totalParcelasEnvio = null;
      } else if (tipoParcelamento === "valor_total") {
        // Forma 1: Valor total informado, calcular valor da parcela
        const numParcelas = parseInt(totalParcelas);
        valorEnvio = valor / numParcelas; // API recebe valor da parcela
        numeroParcela = `1/${numParcelas}`;
        totalParcelasEnvio = numParcelas;
      } else if (tipoParcelamento === "valor_parcela") {
        // Forma 2: Valor da parcela informado
        const numParcelaAtual = parseInt(parcelaAtual);
        const numParcelas = parseInt(totalParcelas);
        valorEnvio = valor; // Valor já é da parcela
        numeroParcela = `${numParcelaAtual}/${numParcelas}`;
        totalParcelasEnvio = numParcelas;
      }

      const response = await fetch("/api/contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim(),
          valor: Number(valorEnvio),
          vencimento,
          tipo,
          codigoTipo: codigoTipo.trim() || null,
          beneficiario: beneficiario.trim() || null,
          numeroDocumento: numeroDocumento.trim() || null,
          numeroParcela,
          totalParcelas: totalParcelasEnvio,
          cartaoId: cartaoId && cartaoId !== "none" ? parseInt(cartaoId) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar conta");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{titulo}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* Grid de campos */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Fornecedor/Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {tipo === "pagar" ? labelPessoa : `${labelPessoa}`} *
                </label>
                <Input
                  placeholder={tipo === "pagar" ? "Ex: Fornecedor XYZ" : "Ex: Cliente ABC"}
                  value={beneficiario}
                  onChange={(e) => setBeneficiario(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Descrição *
                </label>
                <Input
                  placeholder="Ex: Serviço de manutenção"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              {/* Centro de Custo/Receita */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Centro de {tipo === "pagar" ? "Custo" : "Receita"}
                </label>
                <Select value={codigoTipo} onValueChange={setCodigoTipo} disabled={isSaving || loadingCentros}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCentros ? "Carregando..." : "Selecione um centro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {centros.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        Nenhum centro cadastrado
                      </div>
                    ) : (
                      centros.map((centro) => (
                        <SelectItem key={centro.id} value={centro.sigla}>
                          {centro.sigla} - {centro.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Número do Documento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">NF</label>
                <Input
                  placeholder="Ex: NF-12345"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Cartão de Crédito (apenas para tipo pagar) */}
              {tipo === "pagar" && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão de Crédito
                  </label>
                  <Select value={cartaoId} onValueChange={setCartaoId} disabled={isSaving || loadingCartoes}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCartoes ? "Carregando..." : "Selecione um cartão (opcional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (pagamento normal)</SelectItem>
                      {cartoes.map((cartao) => (
                        <SelectItem key={cartao.id} value={cartao.id.toString()}>
                          {cartao.nome} (**** {cartao.ultimos4Digitos})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {faturaDestino && (
                    <p className="text-xs text-primary font-medium">
                      Este lançamento irá para a fatura de {faturaDestino}
                    </p>
                  )}
                </div>
              )}

              {/* Tipo de Parcelamento */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Parcelamento</label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoParcelamento("avista");
                      setTotalParcelas("");
                      setParcelaAtual("");
                    }}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      tipoParcelamento === "avista"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <Receipt className="h-4 w-4" />
                    A vista
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoParcelamento("valor_total");
                      setParcelaAtual("1");
                    }}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      tipoParcelamento === "valor_total"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <Calculator className="h-4 w-4" />
                    Valor Total
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoParcelamento("valor_parcela");
                    }}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      tipoParcelamento === "valor_parcela"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <Receipt className="h-4 w-4" />
                    Valor da Parcela
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tipoParcelamento === "avista" && "Pagamento unico, sem parcelamento"}
                  {tipoParcelamento === "valor_total" && "Informe o valor total e a quantidade de parcelas"}
                  {tipoParcelamento === "valor_parcela" && "Informe o valor de uma parcela especifica"}
                </p>
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {tipoParcelamento === "valor_total" ? "Valor Total *" : tipoParcelamento === "valor_parcela" ? "Valor da Parcela *" : "Valor *"}
                </label>
                <CurrencyInput
                  value={valor}
                  onValueChange={setValor}
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Campos de Parcelamento - Forma 1: Valor Total */}
              {tipoParcelamento === "valor_total" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Quantidade de Parcelas *</label>
                  <Input
                    type="number"
                    min="2"
                    max="48"
                    placeholder="12"
                    value={totalParcelas}
                    onChange={(e) => setTotalParcelas(e.target.value)}
                    disabled={isSaving}
                    className="w-24"
                  />
                  {calculosParcelamento && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium text-primary">
                        {calculosParcelamento.descricao}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sistema criara {calculosParcelamento.parcelasRestantes} parcelas automaticamente
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Campos de Parcelamento - Forma 2: Valor da Parcela */}
              {tipoParcelamento === "valor_parcela" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Qual parcela? *</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={parcelaAtual}
                      onChange={(e) => setParcelaAtual(e.target.value)}
                      disabled={isSaving}
                      className="w-20"
                    />
                    <span className="text-muted-foreground font-medium">/</span>
                    <Input
                      type="number"
                      min="1"
                      max="48"
                      placeholder="12"
                      value={totalParcelas}
                      onChange={(e) => setTotalParcelas(e.target.value)}
                      disabled={isSaving}
                      className="w-20"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Ex: parcela 2 de 6</p>
                  {calculosParcelamento && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium text-primary">
                        {calculosParcelamento.descricao}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {calculosParcelamento.parcelasRestantes > 1
                          ? `Sistema criara ${calculosParcelamento.parcelasRestantes} parcelas (da ${parcelaAtual} ate ${totalParcelas})`
                          : "Sistema criara apenas esta parcela"
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Data de Vencimento */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Vencimento *</label>
                <Input
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  required
                  disabled={isSaving}
                  className="w-48"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
