"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Loader2, CreditCard, Calculator, Receipt, Search, Truck, Check, UserPlus, RefreshCw, FileText, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatCurrency } from "@/lib/format";
import { ConfirmacaoParcelasModal } from "./ConfirmacaoParcelasModal";
import { HistoricoParcelamentoModal } from "./HistoricoParcelamentoModal";

interface ParcelaPreview {
  numero: number;
  descricao: string;
  valor: number;
  vencimento: Date;
  pago: boolean;
}

const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface CartaoCredito {
  id: number;
  nome: string;
  bandeira: string;
  ultimos4Digitos: string;
  diaFechamento: number;
  diaVencimento: number;
}

interface Fornecedor {
  id: number;
  nome: string;
  documento?: string;
  contato?: string;
  status: string;
}

interface EditParcelamentoModalProps {
  conta: any;
  onClose: () => void;
  onSuccess: () => void;
}

type TipoParcelamento = "avista" | "valor_total" | "valor_parcela";

export function EditParcelamentoModal({ conta, onClose, onSuccess }: EditParcelamentoModalProps) {
  const tipo = conta?.tipo || "pagar";

  // Detectar dados do parcelamento existente
  const dadosParcelamentoExistente = useMemo(() => {
    const parcelas = conta?.parcelas || [];
    if (parcelas.length === 0) return null;

    // Ordenar por vencimento
    const parcelasOrdenadas = [...parcelas].sort((a: any, b: any) =>
      new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
    );

    const valorTotal = parcelasOrdenadas.reduce((sum: number, p: any) => sum + Number(p.valor), 0);
    const primeiroVencimento = parcelasOrdenadas[0]?.vencimento?.split('T')[0] || "";
    const valorParcela = Number(parcelasOrdenadas[0]?.valor || 0);

    // Detectar tipo baseado no numeroParcela (ex: "3/6" = valor_parcela, "1/6" = valor_total)
    let tipoOriginal: TipoParcelamento = "valor_total";
    let primeiraParcelaNumero = 1;
    let totalParcelasOriginal = parcelas.length;

    const primeiraParcela = parcelasOrdenadas[0];
    if (primeiraParcela?.numeroParcela) {
      const match = primeiraParcela.numeroParcela.match(/^(\d+)\/(\d+)$/);
      if (match) {
        primeiraParcelaNumero = parseInt(match[1]);
        totalParcelasOriginal = parseInt(match[2]);
        if (primeiraParcelaNumero > 1) {
          tipoOriginal = "valor_parcela";
        }
      }
    }

    return {
      parcelas: parcelasOrdenadas,
      valorTotal,
      valorParcela,
      primeiroVencimento,
      tipoOriginal,
      primeiraParcelaNumero,
      totalParcelasOriginal,
      qtdParcelas: parcelas.length,
    };
  }, [conta]);

  // Estados inicializados com dados da conta existente
  const [codigoTipo, setCodigoTipo] = useState(conta?.codigoTipo || "");
  const [beneficiario, setBeneficiario] = useState(conta?.beneficiario || "");
  const [descricao, setDescricao] = useState(conta?.descricao || "");
  const [numeroDocumento, setNumeroDocumento] = useState(conta?.numeroDocumento || "");
  const [vencimento, setVencimento] = useState(() => {
    if (dadosParcelamentoExistente?.primeiroVencimento) {
      return dadosParcelamentoExistente.primeiroVencimento;
    }
    return conta?.vencimento?.split('T')[0] || "";
  });

  // Valor: baseado no tipo detectado
  const [valor, setValor] = useState<number>(() => {
    if (dadosParcelamentoExistente) {
      if (dadosParcelamentoExistente.tipoOriginal === "valor_parcela") {
        return dadosParcelamentoExistente.valorParcela;
      }
      return dadosParcelamentoExistente.valorTotal;
    }
    return conta?.valor || 0;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistorico, setShowHistorico] = useState(false);
  const [centros, setCentros] = useState<any[]>([]);
  const [loadingCentros, setLoadingCentros] = useState(false);

  // Tipo de parcelamento: fixo baseado no detectado (nao pode ser alterado na edicao)
  const tipoParcelamento: TipoParcelamento = dadosParcelamentoExistente
    ? dadosParcelamentoExistente.tipoOriginal
    : "avista";

  // Total de parcelas
  const [totalParcelas, setTotalParcelas] = useState(() => {
    if (dadosParcelamentoExistente) {
      return dadosParcelamentoExistente.totalParcelasOriginal.toString();
    }
    return "";
  });

  // Parcela atual (para valor_parcela)
  const [parcelaAtual, setParcelaAtual] = useState(() => {
    if (dadosParcelamentoExistente) {
      return dadosParcelamentoExistente.primeiraParcelaNumero.toString();
    }
    return "1";
  });

  const [isRecorrente, setIsRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState("");
  const [dataInicioRecorrencia, setDataInicioRecorrencia] = useState("");
  const [dataFimRecorrencia, setDataFimRecorrencia] = useState("");

  const [cartaoId, setCartaoId] = useState(conta?.cartaoId?.toString() || "");
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [loadingCartoes, setLoadingCartoes] = useState(false);

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(conta?.pessoa || null);
  const [searchFornecedor, setSearchFornecedor] = useState("");
  const [openFornecedorPopover, setOpenFornecedorPopover] = useState(false);
  const inputFornecedorRef = useRef<HTMLInputElement>(null);

  const [showCadastroInline, setShowCadastroInline] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [savingNovo, setSavingNovo] = useState(false);

  const [showConfirmacao, setShowConfirmacao] = useState(false);
  const [parcelasPreview, setParcelasPreview] = useState<ParcelaPreview[]>([]);

  const calculosParcelamento = useMemo(() => {
    const numParcelas = parseInt(totalParcelas) || 0;
    const numParcelaAtual = parseInt(parcelaAtual) || 1;

    if (tipoParcelamento === "valor_total" && numParcelas > 0 && valor > 0) {
      // Considerar parcelas pagas se existirem
      if (dadosParcelamentoExistente) {
        const parcelasPagas = dadosParcelamentoExistente.parcelas.filter((p: any) => p.pago);
        const valorJaPago = parcelasPagas.reduce((sum: number, p: any) => sum + Number(p.valor), 0);
        const qtdPagas = parcelasPagas.length;
        const qtdPendentes = Math.max(0, numParcelas - qtdPagas);
        const valorRestante = valor - valorJaPago;
        const valorPorPendente = qtdPendentes > 0 ? valorRestante / qtdPendentes : 0;

        if (qtdPagas > 0) {
          return {
            valorParcela: valorPorPendente,
            valorTotal: valor,
            parcelasRestantes: numParcelas,
            qtdPagas,
            qtdPendentes,
            valorJaPago,
            descricao: qtdPendentes > 0
              ? `${qtdPagas} paga(s) + ${qtdPendentes}x de ${formatCurrency(valorPorPendente)}`
              : `${qtdPagas} parcela(s) paga(s)`,
            aviso: qtdPendentes < 0
              ? `Nao e possivel reduzir para ${numParcelas} parcelas (${qtdPagas} ja pagas)`
              : null,
          };
        }
      }

      const valorParcela = valor / numParcelas;
      return {
        valorParcela,
        valorTotal: valor,
        parcelasRestantes: numParcelas,
        descricao: `${numParcelas}x de ${formatCurrency(valorParcela)}`,
      };
    }

    if (tipoParcelamento === "valor_parcela" && numParcelas > 0 && valor > 0 && numParcelaAtual > 0) {
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
  }, [tipoParcelamento, valor, totalParcelas, parcelaAtual, dadosParcelamentoExistente]);

  const previewRecorrencia = useMemo(() => {
    if (!isRecorrente || !frequencia || valor <= 0 || !dataInicioRecorrencia || !dataFimRecorrencia) return null;

    const inicio = new Date(dataInicioRecorrencia + "T12:00:00");
    const fim = new Date(dataFimRecorrencia + "T12:00:00");

    if (isNaN(inicio.getTime()) || isNaN(fim.getTime()) || inicio > fim) return null;

    const diffTime = fim.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth()) + 1;
    const diffYears = fim.getFullYear() - inicio.getFullYear() + 1;

    let totalOcorrencias = 0;
    if (frequencia === "mensal") {
      totalOcorrencias = diffMonths;
    } else if (frequencia === "quinzenal") {
      totalOcorrencias = Math.ceil(diffDays / 15);
    } else if (frequencia === "semanal") {
      totalOcorrencias = Math.ceil(diffDays / 7);
    } else if (frequencia === "anual") {
      totalOcorrencias = diffYears;
    }

    const valorTotal = valor * totalOcorrencias;
    const freqLabel = {
      semanal: "Semanal",
      quinzenal: "Quinzenal",
      mensal: "Mensal",
      anual: "Anual"
    }[frequencia] || frequencia;

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    };

    return {
      totalOcorrencias,
      valorTotal,
      descricao: `${totalOcorrencias} ocorrencias (${freqLabel})`,
      periodo: `${formatDate(inicio)} ate ${formatDate(fim)}`,
    };
  }, [isRecorrente, frequencia, dataInicioRecorrencia, dataFimRecorrencia, valor]);

  const titulo = tipo === "pagar" ? "Editar Conta a Pagar" : "Editar Conta a Receber";
  const labelPessoa = tipo === "pagar" ? "Fornecedor" : "Cliente";

  useEffect(() => {
    const fetchCentros = async () => {
      setLoadingCentros(true);
      try {
        const tipoCentro = tipo === "pagar" ? "despesa" : "faturamento";
        const res = await fetch(`/api/centros?tipo=${tipoCentro}&hierarquico=true`);
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

  useEffect(() => {
    const fetchPessoas = async () => {
      setLoadingFornecedores(true);
      try {
        const tipoPessoa = tipo === "pagar" ? "fornecedor" : "cliente";
        const res = await fetch(`/api/fornecedores?status=ativo&tipo=${tipoPessoa}`);
        const data = await res.json();
        setFornecedores(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching pessoas:", err);
        setFornecedores([]);
      } finally {
        setLoadingFornecedores(false);
      }
    };
    fetchPessoas();
  }, [tipo]);

  const fornecedoresFiltrados = useMemo(() => {
    if (!searchFornecedor.trim()) return fornecedores;
    const search = searchFornecedor.toLowerCase();
    return fornecedores.filter(
      (f) =>
        f.nome.toLowerCase().includes(search) ||
        f.documento?.includes(search)
    );
  }, [fornecedores, searchFornecedor]);

  const handleSelectFornecedor = (fornecedor: Fornecedor) => {
    setFornecedorSelecionado(fornecedor);
    setBeneficiario(fornecedor.nome);
    setSearchFornecedor("");
    setOpenFornecedorPopover(false);
  };

  const handleCadastrarNovo = async () => {
    if (!novoNome.trim()) return;

    setSavingNovo(true);
    try {
      const tipoPessoa = tipo === "pagar" ? "fornecedor" : "cliente";
      const res = await fetch("/api/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoNome.trim(),
          tipo: tipoPessoa,
        }),
      });

      if (res.ok) {
        const novaPessoa = await res.json();
        setFornecedores((prev) => [...prev, novaPessoa]);
        setFornecedorSelecionado(novaPessoa);
        setBeneficiario(novaPessoa.nome);
        setNovoNome("");
        setShowCadastroInline(false);
        setOpenFornecedorPopover(false);
      }
    } catch (err) {
      console.error("Erro ao cadastrar:", err);
    } finally {
      setSavingNovo(false);
    }
  };

  const calcularFaturaDestino = (): string | null => {
    if (!cartaoId || cartaoId === "none" || !vencimento) return null;

    const cartaoSelecionado = cartoes.find(c => c.id.toString() === cartaoId);
    if (!cartaoSelecionado) return null;

    const dataCompra = new Date(vencimento + "T12:00:00");
    const diaCompra = dataCompra.getDate();
    let mes = dataCompra.getMonth();
    let ano = dataCompra.getFullYear();

    if (diaCompra > cartaoSelecionado.diaFechamento) {
      mes += 1;
      if (mes > 11) {
        mes = 0;
        ano += 1;
      }
    }

    return `${MESES[mes]}/${ano}`;
  };

  const faturaDestino = calcularFaturaDestino();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fornecedorSelecionado) {
      setError(`${labelPessoa} e obrigatorio. Selecione da lista.`);
      return;
    }

    if (!descricao.trim()) {
      setError("Descricao e obrigatoria");
      return;
    }

    if (!valor || valor <= 0) {
      setError("Valor deve ser maior que zero");
      return;
    }

    if (!vencimento) {
      setError("Data de vencimento e obrigatoria");
      return;
    }

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

    if (isRecorrente) {
      if (!frequencia) {
        setError("Selecione a frequencia da recorrencia");
        return;
      }
      if (!dataInicioRecorrencia || !dataFimRecorrencia) {
        setError("Informe a data de inicio e fim da recorrencia");
        return;
      }
      const inicio = new Date(dataInicioRecorrencia + "T12:00:00");
      const fim = new Date(dataFimRecorrencia + "T12:00:00");
      if (inicio > fim) {
        setError("A data inicial deve ser menor ou igual a data final");
        return;
      }
    }

    const temParcelamento = tipoParcelamento !== "avista";
    const temRecorrencia = isRecorrente;

    if (temParcelamento || temRecorrencia) {
      const parcelas = gerarPreviewParcelas();
      if (parcelas.length > 0) {
        setParcelasPreview(parcelas);
        setShowConfirmacao(true);
        return;
      }
    }

    await atualizarContaSimples();
  };

  const gerarPreviewParcelas = (): ParcelaPreview[] => {
    const parcelas: ParcelaPreview[] = [];
    const vencimentoBase = new Date(vencimento + "T12:00:00");
    const numParcelas = parseInt(totalParcelas) || 1;
    const numParcelaAtual = parseInt(parcelaAtual) || 1;

    // Para parcelamento existente tipo valor_total, considerar parcelas pagas
    if (dadosParcelamentoExistente && tipoParcelamento === "valor_total") {
      const parcelasExistentes = dadosParcelamentoExistente.parcelas || [];
      const parcelasPagas = parcelasExistentes.filter((p: any) => p.pago);
      const parcelasPendentes = parcelasExistentes.filter((p: any) => !p.pago);
      const valorJaPago = parcelasPagas.reduce((sum: number, p: any) => sum + Number(p.valor), 0);
      const qtdParcelasPendentes = numParcelas - parcelasPagas.length;

      if (qtdParcelasPendentes < 0) {
        return parcelasPagas.map((p: any, i: number) => ({
          numero: i + 1,
          descricao: `${descricao} - Parcela ${i + 1}/${parcelasPagas.length}`,
          valor: Number(p.valor),
          vencimento: new Date(p.vencimento),
          pago: true,
        }));
      }

      const valorRestante = valor - valorJaPago;
      const valorPorParcelaPendente = qtdParcelasPendentes > 0 ? valorRestante / qtdParcelasPendentes : 0;

      // Adicionar parcelas pagas
      parcelasPagas.forEach((p: any, i: number) => {
        parcelas.push({
          numero: i + 1,
          descricao: `${descricao} - Parcela ${i + 1}/${numParcelas}`,
          valor: Number(p.valor),
          vencimento: new Date(p.vencimento),
          pago: true,
        });
      });

      // Adicionar parcelas pendentes
      const ultimoVencimentoPago = parcelasPagas.length > 0
        ? new Date(parcelasPagas[parcelasPagas.length - 1].vencimento)
        : new Date(vencimentoBase);

      for (let i = 0; i < qtdParcelasPendentes; i++) {
        const numeroAtual = parcelasPagas.length + i + 1;
        let vencimentoParcela: Date;
        if (i < parcelasPendentes.length) {
          vencimentoParcela = new Date(parcelasPendentes[i].vencimento);
        } else {
          vencimentoParcela = new Date(ultimoVencimentoPago);
          vencimentoParcela.setMonth(vencimentoParcela.getMonth() + i + 1);
        }

        parcelas.push({
          numero: numeroAtual,
          descricao: `${descricao} - Parcela ${numeroAtual}/${numParcelas}`,
          valor: valorPorParcelaPendente,
          vencimento: vencimentoParcela,
          pago: false,
        });
      }

      return parcelas;
    }

    // Para parcelamento existente tipo valor_parcela
    if (dadosParcelamentoExistente && tipoParcelamento === "valor_parcela") {
      const parcelasExistentes = dadosParcelamentoExistente.parcelas || [];
      const parcelasPagas = parcelasExistentes.filter((p: any) => p.pago);

      // Adicionar parcelas pagas
      parcelasPagas.forEach((p: any) => {
        const numMatch = p.numeroParcela?.match(/^(\d+)/);
        const num = numMatch ? parseInt(numMatch[1]) : 1;
        parcelas.push({
          numero: num,
          descricao: `${descricao} - Parcela ${num}/${numParcelas}`,
          valor: Number(p.valor),
          vencimento: new Date(p.vencimento),
          pago: true,
        });
      });

      // Gerar parcelas pendentes
      for (let i = numParcelaAtual; i <= numParcelas; i++) {
        const jaExiste = parcelas.find(p => p.numero === i);
        if (!jaExiste) {
          const vencimentoParcela = new Date(vencimentoBase);
          vencimentoParcela.setMonth(vencimentoParcela.getMonth() + (i - numParcelaAtual));
          parcelas.push({
            numero: i,
            descricao: `${descricao} - Parcela ${i}/${numParcelas}`,
            valor: valor,
            vencimento: vencimentoParcela,
            pago: false,
          });
        }
      }

      parcelas.sort((a, b) => a.numero - b.numero);
      return parcelas;
    }

    // Fluxo para recorrência
    if (isRecorrente) {
      const dataInicio = new Date(dataInicioRecorrencia + "T12:00:00");
      const dataFim = new Date(dataFimRecorrencia + "T12:00:00");
      const diaVencimento = vencimentoBase.getDate();

      const ajustarDia = (data: Date, dia: number): Date => {
        const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
        data.setDate(Math.min(dia, ultimoDia));
        return data;
      };

      let dataAtual: Date;
      let numero = 1;

      if (frequencia === "mensal") {
        dataAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1, 12, 0, 0);
        ajustarDia(dataAtual, diaVencimento);
        while (dataAtual <= dataFim) {
          const mes = MESES[dataAtual.getMonth()];
          const ano = dataAtual.getFullYear();
          parcelas.push({
            numero,
            descricao: `${descricao} - ${mes}/${ano}`,
            valor: valor,
            vencimento: new Date(dataAtual),
            pago: false,
          });
          numero++;
          dataAtual = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1, 12, 0, 0);
          ajustarDia(dataAtual, diaVencimento);
        }
      } else if (frequencia === "quinzenal") {
        dataAtual = new Date(dataInicio);
        ajustarDia(dataAtual, diaVencimento);
        while (dataAtual <= dataFim) {
          parcelas.push({
            numero,
            descricao: `${descricao} - Ocorrencia ${numero}`,
            valor: valor,
            vencimento: new Date(dataAtual),
            pago: false,
          });
          numero++;
          dataAtual.setDate(dataAtual.getDate() + 15);
        }
      } else if (frequencia === "semanal") {
        dataAtual = new Date(dataInicio);
        ajustarDia(dataAtual, diaVencimento);
        while (dataAtual <= dataFim) {
          parcelas.push({
            numero,
            descricao: `${descricao} - Semana ${numero}`,
            valor: valor,
            vencimento: new Date(dataAtual),
            pago: false,
          });
          numero++;
          dataAtual.setDate(dataAtual.getDate() + 7);
        }
      } else if (frequencia === "anual") {
        dataAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1, 12, 0, 0);
        ajustarDia(dataAtual, diaVencimento);
        while (dataAtual <= dataFim) {
          parcelas.push({
            numero,
            descricao: `${descricao} - ${dataAtual.getFullYear()}`,
            valor: valor,
            vencimento: new Date(dataAtual),
            pago: false,
          });
          numero++;
          dataAtual = new Date(dataAtual.getFullYear() + 1, dataAtual.getMonth(), 1, 12, 0, 0);
          ajustarDia(dataAtual, diaVencimento);
        }
      }
    } else if (tipoParcelamento === "valor_total") {
      const valorParcela = valor / numParcelas;

      for (let i = 1; i <= numParcelas; i++) {
        const vencimentoParcela = new Date(vencimentoBase);
        vencimentoParcela.setMonth(vencimentoParcela.getMonth() + (i - 1));
        parcelas.push({
          numero: i,
          descricao: `${descricao} - Parcela ${i}/${numParcelas}`,
          valor: valorParcela,
          vencimento: vencimentoParcela,
          pago: false,
        });
      }
    } else if (tipoParcelamento === "valor_parcela") {
      for (let i = numParcelaAtual; i <= numParcelas; i++) {
        const vencimentoParcela = new Date(vencimentoBase);
        vencimentoParcela.setMonth(vencimentoParcela.getMonth() + (i - numParcelaAtual));
        parcelas.push({
          numero: i,
          descricao: `${descricao} - Parcela ${i}/${numParcelas}`,
          valor: valor,
          vencimento: vencimentoParcela,
          pago: false,
        });
      }
    }

    return parcelas;
  };

  const atualizarContaSimples = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/contas/${conta.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim(),
          valor: Number(valor),
          vencimento,
          codigoTipo: codigoTipo.trim() || null,
          beneficiario: fornecedorSelecionado?.nome || null,
          numeroDocumento: numeroDocumento.trim() || null,
          cartaoId: cartaoId && cartaoId !== "none" ? parseInt(cartaoId) : null,
          pessoaId: fornecedorSelecionado?.id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar conta");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar conta");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmarParcelas = async (parcelasComStatus: ParcelaPreview[]) => {
    setIsSaving(true);
    try {
      // Determinar o ID para a API
      const idParaAPI = conta.isContaMacro ? conta.id : (conta.grupoParcelamentoId || conta.id);

      // Mapear parcelas existentes pelo número
      const parcelasExistentes = dadosParcelamentoExistente?.parcelas || [];
      const mapaParcelasExistentes = new Map<number, any>();
      parcelasExistentes.forEach((p: any) => {
        const match = p.numeroParcela?.match(/^(\d+)/);
        const num = match ? parseInt(match[1]) : 0;
        if (num > 0) mapaParcelasExistentes.set(num, p);
      });

      // Construir array de parcelas
      const usarNumeroOriginal = tipoParcelamento === "valor_parcela";
      const totalParcelasParaAPI = usarNumeroOriginal
        ? parseInt(totalParcelas)
        : parcelasComStatus.length;

      const parcelasAtualizadas = parcelasComStatus.map((p, index) => {
        const parcelaExistente = mapaParcelasExistentes.get(p.numero);
        const numeroParcela = usarNumeroOriginal
          ? `${p.numero}/${totalParcelasParaAPI}`
          : `${index + 1}/${totalParcelasParaAPI}`;

        return {
          id: parcelaExistente?.id || undefined,
          valor: p.valor,
          vencimento: p.vencimento.toISOString().split("T")[0],
          pago: p.pago,
          dataPagamento: p.pago ? new Date().toISOString().split("T")[0] : null,
          numeroParcela,
        };
      });

      const novoValorTotal = parcelasComStatus.reduce((sum, p) => sum + p.valor, 0);

      const response = await fetch(`/api/contas/${idParaAPI}/parcelas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim(),
          beneficiario: fornecedorSelecionado?.nome || null,
          codigoTipo: codigoTipo.trim() || null,
          totalParcelas: parcelasComStatus.length,
          valorTotal: novoValorTotal,
          parcelasAtualizadas,
          tipoParcelamento, // IMPORTANTE: enviar tipo explícito para evitar mudança automática
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar parcelamento");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar parcelas");
      setShowConfirmacao(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {titulo}
              {dadosParcelamentoExistente && (
                <>
                  <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {dadosParcelamentoExistente.tipoOriginal === "valor_parcela"
                      ? `${dadosParcelamentoExistente.primeiraParcelaNumero}/${dadosParcelamentoExistente.totalParcelasOriginal}`
                      : `${dadosParcelamentoExistente.qtdParcelas}x`
                    }
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-8"
                    onClick={() => setShowHistorico(true)}
                  >
                    <History className="h-4 w-4 mr-1" />
                    Historico
                  </Button>
                </>
              )}
            </DialogTitle>
            {dadosParcelamentoExistente && (
              <p className="text-sm text-muted-foreground mt-1">
                {dadosParcelamentoExistente.tipoOriginal === "valor_parcela" ? (
                  <>Valor por parcela: {formatCurrency(dadosParcelamentoExistente.valorParcela)}</>
                ) : (
                  <>Valor total: {formatCurrency(dadosParcelamentoExistente.valorTotal)}</>
                )}
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[60vh] px-6">
              <div className="space-y-6 pb-6">
                {/* Secao: Identificacao */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Identificacao</span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Fornecedor/Cliente */}
                    <div>
                      <Label>{labelPessoa} *</Label>
                      <Popover open={openFornecedorPopover} onOpenChange={setOpenFornecedorPopover}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openFornecedorPopover}
                            className="w-full justify-between font-normal mt-1"
                            disabled={isSaving}
                          >
                            {fornecedorSelecionado ? (
                              <span className="flex items-center gap-2 truncate">
                                <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{fornecedorSelecionado.nome}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Selecione...</span>
                            )}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <div className="p-2 border-b">
                            <Input
                              ref={inputFornecedorRef}
                              placeholder={`Buscar ${labelPessoa.toLowerCase()}...`}
                              value={searchFornecedor}
                              onChange={(e) => setSearchFornecedor(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="max-h-[200px] overflow-y-auto">
                            {loadingFornecedores ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                Carregando...
                              </div>
                            ) : fornecedoresFiltrados.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Nenhum encontrado
                              </div>
                            ) : (
                              fornecedoresFiltrados.map((f) => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => handleSelectFornecedor(f)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                                >
                                  {fornecedorSelecionado?.id === f.id && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                  <Truck className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{f.nome}</p>
                                    {f.documento && (
                                      <p className="text-xs text-muted-foreground">{f.documento}</p>
                                    )}
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                          {!showCadastroInline && (
                            <div className="p-2 border-t">
                              <button
                                type="button"
                                onClick={() => {
                                  setNovoNome(searchFornecedor);
                                  setShowCadastroInline(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md text-left text-primary"
                              >
                                <UserPlus className="h-4 w-4" />
                                <span>Cadastrar novo</span>
                              </button>
                            </div>
                          )}
                          {showCadastroInline && (
                            <div className="p-3 border-t space-y-3 bg-muted/30">
                              <p className="text-xs font-medium text-muted-foreground">
                                Novo {labelPessoa}
                              </p>
                              <Input
                                placeholder="Nome *"
                                value={novoNome}
                                onChange={(e) => setNovoNome(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => {
                                    setShowCadastroInline(false);
                                    setNovoNome("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="flex-1"
                                  onClick={handleCadastrarNovo}
                                  disabled={!novoNome.trim() || savingNovo}
                                >
                                  {savingNovo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Descricao */}
                    <div>
                      <Label htmlFor="descricao">Descricao *</Label>
                      <Input
                        id="descricao"
                        placeholder="Ex: Servico de manutencao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        disabled={isSaving}
                        className="mt-1"
                      />
                    </div>

                    {/* NF */}
                    <div>
                      <Label htmlFor="nf">Numero do Documento (NF)</Label>
                      <Input
                        id="nf"
                        placeholder="Ex: NF-12345"
                        value={numeroDocumento}
                        onChange={(e) => setNumeroDocumento(e.target.value)}
                        disabled={isSaving}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Secao: Classificacao */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Classificacao</span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Centro de Custo/Receita */}
                    <div className="min-w-0 md:col-span-2">
                      <Label htmlFor="centro">Centro de {tipo === "pagar" ? "Custo" : "Receita"}</Label>
                      <Select value={codigoTipo || "none"} onValueChange={(v) => setCodigoTipo(v === "none" ? "" : v)} disabled={isSaving || loadingCentros}>
                        <SelectTrigger id="centro" className="mt-1">
                          <SelectValue placeholder={loadingCentros ? "Carregando..." : "Selecione"} className="truncate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {centros.map((centro: any) => (
                            <SelectItem
                              key={centro.id}
                              value={centro.sigla}
                              className={centro.level === 1 ? "pl-6" : ""}
                              disabled={centro.bloqueadoParaLancamento}
                            >
                              <span className="flex items-center gap-1">
                                {centro.level === 1 && <span className="text-muted-foreground">└</span>}
                                <span className={centro.isParent ? "font-medium" : ""}>{centro.sigla}</span>
                                <span className="text-muted-foreground">-</span>
                                <span className={`${centro.isSocio ? "text-primary" : ""} ${centro.bloqueadoParaLancamento ? "text-muted-foreground" : ""} truncate`}>
                                  {centro.nome}
                                </span>
                                {centro.bloqueadoParaLancamento && (
                                  <span className="ml-1 text-[10px] text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                    Use subcentro
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Secao: Forma de Pagamento */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Forma de Pagamento</span>
                    <Separator className="flex-1" />
                  </div>

                  {/* Cartao de Credito (apenas para tipo pagar) */}
                  {tipo === "pagar" && (
                    <div>
                      <Label htmlFor="cartao" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cartao de Credito
                      </Label>
                      <Select value={cartaoId} onValueChange={setCartaoId} disabled={isSaving || loadingCartoes}>
                        <SelectTrigger id="cartao" className="mt-1">
                          <SelectValue placeholder={loadingCartoes ? "Carregando..." : "Selecione (opcional)"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum (pagamento normal)</SelectItem>
                          {cartoes.map((cartao) => (
                            <SelectItem key={cartao.id} value={cartao.id.toString()}>
                              <span className="truncate">{cartao.nome} (**** {cartao.ultimos4Digitos})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {faturaDestino && (
                        <p className="text-xs text-primary font-medium mt-1">
                          Este lancamento ira para a fatura de {faturaDestino}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tipo de Parcelamento - Fixo na edicao */}
                  <div>
                    <Label>Parcelamento</Label>
                    <div className="flex gap-2 flex-wrap mt-2">
                      <div
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${
                          tipoParcelamento === "avista"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground opacity-50"
                        }`}
                      >
                        <Receipt className="h-4 w-4" />
                        A vista
                      </div>
                      <div
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${
                          tipoParcelamento === "valor_total"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground opacity-50"
                        }`}
                      >
                        <Calculator className="h-4 w-4" />
                        Valor Total
                      </div>
                      <div
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${
                          tipoParcelamento === "valor_parcela"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground opacity-50"
                        }`}
                      >
                        <Receipt className="h-4 w-4" />
                        Valor da Parcela
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tipoParcelamento === "avista" && "Pagamento unico, sem parcelamento"}
                      {tipoParcelamento === "valor_total" && "O valor informado e dividido igualmente entre as parcelas"}
                      {tipoParcelamento === "valor_parcela" && "Cada parcela tem o valor informado"}
                    </p>
                  </div>

                  {/* Recorrencia (apenas para pagamento a vista) */}
                  {tipoParcelamento === "avista" && (
                    <div>
                      <Label className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Conta Recorrente
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecorrente(false);
                            setFrequencia("");
                            setDataInicioRecorrencia("");
                            setDataFimRecorrencia("");
                          }}
                          disabled={isSaving}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                            !isRecorrente
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          Avulsa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecorrente(true);
                            const hoje = new Date();
                            const umAnoDepois = new Date(hoje);
                            umAnoDepois.setFullYear(umAnoDepois.getFullYear() + 1);
                            setDataInicioRecorrencia(hoje.toISOString().split('T')[0]);
                            setDataFimRecorrencia(umAnoDepois.toISOString().split('T')[0]);
                          }}
                          disabled={isSaving}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                            isRecorrente
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          Recorrente
                        </button>
                      </div>

                      {isRecorrente && (
                        <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5 mt-3">
                          <div>
                            <Label htmlFor="frequencia" className="text-xs">Frequencia *</Label>
                            <Select value={frequencia} onValueChange={setFrequencia} disabled={isSaving}>
                              <SelectTrigger id="frequencia" className="mt-1">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="semanal">Semanal</SelectItem>
                                <SelectItem value="quinzenal">Quinzenal</SelectItem>
                                <SelectItem value="mensal">Mensal</SelectItem>
                                <SelectItem value="anual">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Periodo de repeticao</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">De</Label>
                                <Input
                                  type="date"
                                  value={dataInicioRecorrencia}
                                  onChange={(e) => setDataInicioRecorrencia(e.target.value)}
                                  disabled={isSaving}
                                  className="mt-1"
                                />
                              </div>
                              <span className="text-muted-foreground text-sm mt-5">ate</span>
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Ate</Label>
                                <Input
                                  type="date"
                                  value={dataFimRecorrencia}
                                  onChange={(e) => setDataFimRecorrencia(e.target.value)}
                                  disabled={isSaving}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>

                          {previewRecorrencia && (
                            <div className="p-3 rounded bg-primary/10 border border-primary/20">
                              <p className="text-sm font-medium text-primary">{previewRecorrencia.descricao}</p>
                              <p className="text-xs text-muted-foreground mt-1">Periodo: {previewRecorrencia.periodo}</p>
                              <p className="text-xs text-muted-foreground">Valor total: {formatCurrency(previewRecorrencia.valorTotal)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Secao: Valores */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Valores</span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Valor */}
                    <div>
                      <Label htmlFor="valor">
                        {tipoParcelamento === "valor_total" ? "Valor Total *" : tipoParcelamento === "valor_parcela" ? "Valor da Parcela *" : "Valor *"}
                      </Label>
                      <CurrencyInput
                        value={valor}
                        onValueChange={setValor}
                        disabled={isSaving}
                      />
                    </div>

                    {/* Campos de Parcelamento */}
                    {tipoParcelamento === "valor_total" && (
                      <div>
                        <Label htmlFor="qtdParcelas">Quantidade de Parcelas *</Label>
                        <Input
                          id="qtdParcelas"
                          type="text"
                          inputMode="numeric"
                          placeholder="12"
                          value={totalParcelas}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setTotalParcelas(value);
                          }}
                          disabled={isSaving}
                          className="w-24 mt-1"
                        />
                        {calculosParcelamento && (
                          <div className={`p-3 rounded-lg mt-2 ${calculosParcelamento.aviso ? 'bg-destructive/10 border border-destructive/20' : 'bg-primary/5 border border-primary/20'}`}>
                            <p className={`text-sm font-medium ${calculosParcelamento.aviso ? 'text-destructive' : 'text-primary'}`}>
                              {calculosParcelamento.descricao}
                            </p>
                            {calculosParcelamento.aviso ? (
                              <p className="text-xs text-destructive mt-1">{calculosParcelamento.aviso}</p>
                            ) : calculosParcelamento.qtdPagas ? (
                              <p className="text-xs text-muted-foreground mt-1">
                                {calculosParcelamento.qtdPendentes > 0
                                  ? `${calculosParcelamento.qtdPagas} parcela(s) paga(s) serao mantidas`
                                  : "Todas as parcelas ja foram pagas"
                                }
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">
                                Sistema atualizara {calculosParcelamento.parcelasRestantes} parcelas
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {tipoParcelamento === "valor_parcela" && (
                      <div>
                        <Label>Qual parcela? *</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="1"
                            value={parcelaAtual}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setParcelaAtual(value);
                            }}
                            disabled={isSaving}
                            className="w-20"
                          />
                          <span className="text-muted-foreground font-medium">/</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="12"
                            value={totalParcelas}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setTotalParcelas(value);
                            }}
                            disabled={isSaving}
                            className="w-20"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Ex: parcela 2 de 6</p>
                        {calculosParcelamento && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mt-2">
                            <p className="text-sm font-medium text-primary">{calculosParcelamento.descricao}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {calculosParcelamento.parcelasRestantes > 1
                                ? `Sistema atualizara ${calculosParcelamento.parcelasRestantes} parcelas`
                                : "Sistema atualizara apenas esta parcela"
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Data de Vencimento */}
                    <div className={tipoParcelamento !== "avista" ? "" : "md:col-span-2"}>
                      <Label htmlFor="vencimento">
                        {isRecorrente ? "Data do primeiro vencimento *" : "Vencimento *"}
                      </Label>
                      <Input
                        id="vencimento"
                        type="date"
                        value={vencimento}
                        onChange={(e) => setVencimento(e.target.value)}
                        disabled={isSaving}
                        className="w-48 mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Erro */}
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="p-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Salvando...
                  </>
                ) : tipoParcelamento !== "avista" || isRecorrente ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Continuar
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showConfirmacao && parcelasPreview.length > 0 && (
        <ConfirmacaoParcelasModal
          tipo={tipo}
          parcelas={parcelasPreview}
          onConfirm={handleConfirmarParcelas}
          onCancel={() => setShowConfirmacao(false)}
          isLoading={isSaving}
          titulo={isRecorrente ? "Confirmar Lancamentos Recorrentes" : "Confirmar Parcelas"}
          subtitulo={`${descricao} - ${fornecedorSelecionado?.nome || ""}`}
        />
      )}

      {showHistorico && conta?.grupoParcelamentoId && (
        <HistoricoParcelamentoModal
          grupoParcelamentoId={conta.grupoParcelamentoId}
          contaMacroId={conta.isContaMacro ? conta.id : undefined}
          onClose={() => setShowHistorico(false)}
        />
      )}
    </>
  );
}
