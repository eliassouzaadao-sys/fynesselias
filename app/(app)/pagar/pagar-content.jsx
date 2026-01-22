
"use client";
// Função utilitária para evitar RangeError em datas inválidas
function formatDateSafe(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return formatDate(d);
}

export { PagarContent };

import { PessoaSelect, PessoaForm } from "@/components/forms/pessoa-form";
import React, { useState, useEffect } from "react";
import { useRef } from "react";
import { Clock, Plus, Download, ChevronLeft, ChevronRight, AlertCircle, FileText, CheckCircle2, Search, Edit, Trash2, X, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { NovaContaModal } from "./components/NovaContaModal";

// Mapeamento de subcentros de custo por centro de custo
const SUBCENTROS_CUSTO = {
  operacoes: ["Matéria Prima", "Manutenção", "Logística"],
  comercial: ["Representantes", "Varejo", "Atacado", "E-commerce"],
  administrativo: ["RH", "Financeiro", "TI", "Jurídico"],
  folha: ["Salários", "Benefícios", "Encargos"]
};

// Estado para contas reais
const useBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchBills() {
      try {
        setLoading(true);
        const res = await fetch('/api/contas');
        const data = await res.json();
        // CRITICAL FIX: Always validate data is an array before setting state
        setBills(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch bills:', error);
        setBills([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBills();
  }, [refreshKey]);

  // CRITICAL FIX: Add safety check before filter operation
  return {
    bills: Array.isArray(bills) ? bills.filter(b => b.tipo === "pagar") : [],
    setBills,
    loading,
    refresh: () => setRefreshKey(prev => prev + 1)
  };
};

export function PagarContent() {
    // Estado para subcategoria relacionada à categoria
    const [subCategoriaFilter, setSubCategoriaFilter] = useState("");
  const [showCheckAnimation, setShowCheckAnimation] = useState(false);
  const audioRef = useRef(null);

  // Modal Nova Conta
  const [showNewModal, setShowNewModal] = useState(false);

  // Função para recarregar a lista após criar conta
  const handleNovaContaSuccess = () => {
    refresh();
  };
      // const [novoSubCentroCusto, setNovoSubCentroCusto] = useState("");
    // Pessoa selecionada
    const [pessoaId, setPessoaId] = useState("");
    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [vencimento, setVencimento] = useState("");
    const [pessoaSelecionada, setPessoaSelecionada] = useState(null);
    const [showPessoaModal, setShowPessoaModal] = useState(false);

    // Buscar dados da pessoa ao selecionar
    useEffect(() => {
      if (pessoaId === "nova") {
        setShowPessoaModal(true);
        setPessoaId("");
        return;
      }
      if (pessoaId) {
        fetch(`/api/pessoas`)
          .then(res => res.json())
          .then(data => {
            const pessoa = data.find(p => String(p.id) === String(pessoaId));
            setPessoaSelecionada(pessoa || null);
            // Preencher campos automáticos
            if (pessoa) {
              setContato(pessoa.contato || "");
              setChavePix(pessoa.chavePix || "");
              setCartao(pessoa.cartao || "");
              setOutraForma(pessoa.outrosDados || "");
            }
          });
      } else {
        setPessoaSelecionada(null);
        setContato("");
        setChavePix("");
        setCartao("");
        setOutraForma("");
      }
    }, [pessoaId]);
  const { bills, setBills, loading, refresh } = useBills();
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("Todas")
  const [selectedBill, setSelectedBill] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [documentToView, setDocumentToView] = useState(null)
  const [showNewBillModal, setShowNewBillModal] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [aiExtractedData, setAiExtractedData] = useState(null)
  const [showDocumentAlert, setShowDocumentAlert] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const itemsPerPage = 12
  // Forma de pagamento (corrigido para suportar newFormaPagamento)
  const [formaPagamento, setFormaPagamento] = useState("");
  const [newFormaPagamento, setNewFormaPagamento] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [numeroBoleto, setNumeroBoleto] = useState("");
  const [cartao, setCartao] = useState("");
  const [outraForma, setOutraForma] = useState("");

  // Contato de quem gerou a conta
  const [contato, setContato] = useState("");

  // Estado para centro e subcentro de custo do formulário
  const [centroCusto, setCentroCusto] = useState(aiExtractedData?.centroCusto || "");
  const [subCentroCusto, setSubCentroCusto] = useState(aiExtractedData?.subCentroCusto || "");
  const [novoCentroCusto, setNovoCentroCusto] = useState("");
  const [novoSubCentroCusto, setNovoSubCentroCusto] = useState("");

  // KPIs funcionais
  const hoje = new Date();
  const prox7 = new Date();
  prox7.setDate(hoje.getDate() + 7);
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  // SAFETY FIX: Ensure bills is always an array before filtering
  const safeBills = Array.isArray(bills) ? bills : [];

  // Pendente
  const pendentes = safeBills.filter((c) => !c.pago && new Date(c.vencimento) >= hoje);
  // Vencido
  const vencidas = safeBills.filter((c) => !c.pago && new Date(c.vencimento) < hoje);
  // Próx. 7 dias
  const proximos7 = safeBills.filter((c) => {
    const venc = new Date(c.vencimento);
    return !c.pago && venc >= hoje && venc <= prox7;
  });
  // Pago este mês
  const pagosMes = safeBills.filter((c) => {
    if (!c.pago || !c.atualizadoEm) return false;
    const pag = new Date(c.atualizadoEm);
    return pag.getMonth() + 1 === mesAtual && pag.getFullYear() === anoAtual;
  });

  // Calcular KPIs
  const getValor = b => {
    const v = Number(b.valor);
    return isNaN(v) ? 0 : v;
  };

  // SAFETY FIX: Use safeBills for all calculations
  const totalPendente = safeBills
    .filter(b => !b.pago && new Date(b.vencimento) >= hoje)
    .reduce((sum, b) => sum + getValor(b), 0)

  const totalVencido = safeBills
    .filter(b => !b.pago && new Date(b.vencimento) < hoje)
    .reduce((sum, b) => sum + getValor(b), 0)

  const proximos7Dias = safeBills
    .filter(b => {
      const dueDate = new Date(b.vencimento)
      const diff = Math.ceil((dueDate - hoje) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= 7 && !b.pago
    })
    .reduce((sum, b) => sum + getValor(b), 0)

  const pagoMes = bills
    .filter(b => b.pago)
    .reduce((sum, b) => sum + getValor(b), 0)

  // Simular processamento de IA
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setIsProcessingAI(true)
      
      // Simular processamento (em produção seria uma chamada real à API de IA)
      setTimeout(() => {
        setAiExtractedData({
          fornecedor: "Beneficiário Exemplo LTDA",
          tipo: "fornecedor",
          document: "NF-" + Math.floor(Math.random() * 90000 + 10000),
          valor: (Math.random() * 10000 + 500).toFixed(2),
          vencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          centroCusto: "operacoes",
          subCentroCusto: "Matéria Prima",
          descricao: "Extraído automaticamente do documento",
        })
        setIsProcessingAI(false)
      }, 2000)
    }
  }

  const resetForm = () => {
    setUploadedFile(null)
    setAiExtractedData(null)
    setIsProcessingAI(false)
    setShowNewBillModal(false)
    setShowDocumentAlert(false)
  }

  const handleAddBill = async () => {
    // Exemplo de validação mínima (adicione mais se necessário)
    // if (!uploadedFile) {
    //   setShowDocumentAlert(true)
    //   return;
    // }
    // Montar objeto da conta
    // Pega dados do formulário manual ou do AI se houver
    const valorFinal = aiExtractedData?.valor !== undefined && aiExtractedData?.valor !== "" && !isNaN(Number(aiExtractedData?.valor))
      ? Number(aiExtractedData?.valor)
      : (valor !== undefined && valor !== "" && !isNaN(Number(valor)) ? Number(valor) : 0);
    const novaConta = {
      descricao: aiExtractedData?.descricao || descricao || "",
      valor: valorFinal,
      vencimento: aiExtractedData?.vencimento ? new Date(aiExtractedData.vencimento) : (vencimento ? new Date(vencimento) : new Date()),
      pago: false,
      pessoaId: pessoaId ? Number(pessoaId) : null,
      centroCusto: centroCusto || "",
      subCentroCusto: subCentroCusto || "",
      formaPagamento: formaPagamento || "",
      chavePix: chavePix || "",
      numeroBoleto: numeroBoleto || "",
      cartao: cartao || "",
      outraForma: outraForma || "",
      contato: contato || "",
      novoCentroCusto: novoCentroCusto || "",
      novoSubCentroCusto: novoSubCentroCusto || "",
    };
    try {
      const res = await fetch("/api/contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaConta),
      });
      if (res.ok) {
        // Atualizar lista de contas
        const contasAtualizadas = await fetch('/api/contas').then(r => r.json());
        setBills(contasAtualizadas);
        resetForm();
      } else {
        alert("Erro ao adicionar conta!");
      }
    } catch (e) {
      alert("Erro ao adicionar conta!");
    }
  }

  const handleManualFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setShowDocumentAlert(false)
      
      // Se já tem dados preenchidos, verifica se batem com o documento
      if (aiExtractedData) {
        setIsProcessingAI(true)
        setTimeout(() => {
          setIsProcessingAI(false)
          // Simulação: 90% de chance de estar correto
          const isCorrect = Math.random() > 0.1
          if (isCorrect) {
            console.log("✅ Documento verificado: informações conferem!")
          } else {
            console.log("⚠️ Atenção: algumas informações podem estar divergentes")
          }
        }, 1500)
      }
    }
  }


  // Filtrar contas
  // SAFETY FIX: Use safeBills instead of bills directly
  const filteredBills = safeBills.filter(bill => {
    const matchSearch = (bill.descricao?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchCategoria = categoriaFilter === "Todas" || bill.categoria === categoriaFilter
    return matchSearch && matchCategoria
  })

  // Agrupar por status
  // Removido: duplicatas de pendentes, vencidas, pagas (já calculado nos KPIs)

  // Paginação
  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (data) => Math.ceil(data.length / itemsPerPage)

  const changePage = (newPage) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentPage(newPage)
      setIsTransitioning(false)
    }, 150)
  }

  const Pagination = ({ data }) => {
    const totalPages = getTotalPages(data)
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-fyn-muted">
          Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, data.length)} a {Math.min(currentPage * itemsPerPage, data.length)} de {data.length} contas
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-fyn-text px-3">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch(status) {
      case "Pago": return "bg-fyn-success/10 text-fyn-success border-fyn-success/20"
      case "Pendente": return "bg-fyn-warning/10 text-fyn-warning border-fyn-warning/20"
      case "Vencido": return "bg-fyn-danger/10 text-fyn-danger border-fyn-danger/20"
      default: return "bg-fyn-border text-fyn-text"
    }
  }

  const BillCard = ({ bill }) => (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
      setSelectedBill(bill)
      setShowDetail(true)
    }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-fyn-text truncate">{bill.descricao || bill.fornecedor || bill.beneficiario || '-'}</h3>
          <p className="text-xs text-fyn-muted mt-0.5">{bill.description}</p>
        </div>
        <Badge className={`ml-2 ${getStatusColor(bill.status)}`}>
          {bill.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
        <div>
          <p className="text-fyn-muted">Vencimento</p>
          <p className="text-fyn-text font-medium">{formatDateSafe(bill.dueDate || bill.vencimento)}</p>
        </div>
        <div>
          <p className="text-fyn-muted">Centro de Custo</p>
          <p className="text-fyn-text font-medium truncate">{bill.costCenter || bill.centroCusto}</p>
        </div>
      </div>

      {!bill.documentImage && (
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
            e.stopPropagation()
            setDocumentToView(bill)
            setShowDocumentModal(true)
          }}
        >
          <FileText className="mr-1 h-3 w-3" />
          {bill.document}
        </Button>
        <span className="text-lg font-bold text-fyn-text">{formatCurrency(Number(bill.valor) || 0)}</span>
      </div>
    </Card>
  )


  // Definir pagas para uso nas Tabs
  // SAFETY FIX: Use safeBills instead of bills directly
  const pagas = safeBills.filter(b => b.pago);


  // Funções para ações reais
  async function marcarComoPago(id) {
    // Atualiza no banco
    await fetch('/api/contas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pago: true }),
    });
    // Atualiza lista
    const res = await fetch('/api/contas');
    setBills(await res.json());
    // Animação e som
    setShowCheckAnimation(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    setTimeout(() => {
      setShowCheckAnimation(false);
      setShowDetail(false);
    }, 1500);
  }
  async function deletarConta(id) {
    await fetch('/api/contas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    // Atualiza lista
    const res = await fetch('/api/contas');
    setBills(await res.json());
    setShowDetail(false);
  }
  async function editarConta(id, novosDados) {
    await fetch('/api/contas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...novosDados }),
    });
    // Atualiza lista
    const res = await fetch('/api/contas');
    setBills(await res.json());
    setShowDetail(false);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contas a Pagar"
        description="Gestão completa de pagamentos a beneficiários"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setShowNewModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>

            {/* Novo Modal Refatorado */}
            {showNewModal && (
              <NovaContaModal
                tipo="pagar"
                onClose={() => setShowNewModal(false)}
                onSuccess={handleNovaContaSuccess}
              />
            )}

            {/* REMOVER MODAL ANTIGO ABAIXO */}
            {false && showNewModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-fyn-border">
                    <div>
                      <h2 className="text-lg font-semibold text-fyn-text">Nova Conta a Pagar - ANTIGO</h2>
                      <p className="text-xs text-fyn-muted mt-0.5">Preencha os dados da conta</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewModal(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="p-4 overflow-y-auto flex-1">
                    <div className="grid gap-4">
                                    {/* Descrição da Conta (primeiro campo, obrigatório) */}
                                    <div className="space-y-1.5">
                                      <label className="text-sm font-medium text-fyn-text">Descrição da Conta *</label>
                                      <Input
                                        placeholder="Ex: Salário Rubia, Energia, etc."
                                        value={newDescricao}
                                        onChange={e => setNewDescricao(e.target.value)}
                                        required
                                      />
                                    </div>

                                    {/* Banco de Pagamento */}
                                    <div className="space-y-1.5">
                                      <label className="text-sm font-medium text-fyn-text">Banco para pagamento</label>
                                      <Select value={newBanco} onValueChange={setNewBanco}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione o banco" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="itau">Itaú</SelectItem>
                                          <SelectItem value="bradesco">Bradesco</SelectItem>
                                          <SelectItem value="caixa">Caixa</SelectItem>
                                          <SelectItem value="santander">Santander</SelectItem>
                                          <SelectItem value="bb">Banco do Brasil</SelectItem>
                                          <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                      {/* Upload de Documento com Preenchimento Automático */}
                      {/* (implementar lógica de upload se necessário) */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-fyn-text">
                          Preenchimento Automático <span className="text-xs text-fyn-muted font-normal">(opcional)</span>
                        </label>
                        <p className="text-xs text-fyn-muted">
                          Envie o documento para preenchimento automático ou preencha manualmente os campos abaixo
                        </p>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            id="file-upload-pagar"
                          />
                          <label
                            htmlFor="file-upload-pagar"
                            className="border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer block border-fyn-border hover:border-fyn-accent hover:bg-fyn-accent/5"
                          >
                            <div className="space-y-1">
                              <FileText className="h-6 w-6 text-fyn-muted mx-auto" />
                              <p className="text-sm text-fyn-muted">Enviar documento para análise</p>
                              <p className="text-xs text-fyn-text-light">PDF, JPG, PNG até 10MB</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Informações Básicas */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-fyn-text">Informações Básicas</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-fyn-text">Número do Documento</label>
                            <Input placeholder="NF-12345" value={newDocumento} onChange={e => setNewDocumento(e.target.value)} />
                          </div>
                        </div>
                        {/* Forma de Pagamento */}
                        <div className="space-y-1.5 mt-2">
                          <label className="text-sm font-medium text-fyn-text">Forma de Pagamento</label>
                          <Select value={newFormaPagamento} onValueChange={setNewFormaPagamento}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pix">Pix</SelectItem>
                              <SelectItem value="boleto">Boleto</SelectItem>
                              <SelectItem value="cartao">Cartão</SelectItem>
                              <SelectItem value="transferencia">Transferência</SelectItem>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="outra">Outra</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Valores e Datas */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-fyn-text">Valores e Datas</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-fyn-text">Valor</label>
                            <Input type="number" placeholder="0,00" value={newValor} onChange={e => setNewValor(e.target.value.replace(/[^0-9.]/g, ""))} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-fyn-text">Data de Vencimento</label>
                            <Input type="date" value={newVencimento} onChange={e => setNewVencimento(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Centros de Custo */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-fyn-text">Centros de Custo</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-fyn-text">Centro de Custo</label>
                            <Select value={newCentroCusto} onValueChange={value => {
                              if (value === "novo") {
                                setNovoCentroCusto("");
                                setNewCentroCusto("novo");
                              } else {
                                setNewCentroCusto(value);
                                setNovoCentroCusto("");
                                setNewSubCentroCusto("");
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="operacoes">Operações</SelectItem>
                                <SelectItem value="comercial">Comercial</SelectItem>
                                <SelectItem value="administrativo">Despesas Administrativas</SelectItem>
                                <SelectItem value="folha">Folha de Pagamento</SelectItem>
                                <div className="border-t my-1" />
                                <SelectItem value="novo" className="text-fyn-accent font-semibold flex items-center gap-2">
                                  <span style={{fontWeight:600, color:'#2563eb'}}>+ Novo centro de custo</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {newCentroCusto === "novo" && (
                              <Input
                                className="mt-2"
                                placeholder="Nome do novo centro de custo"
                                value={novoCentroCusto}
                                onChange={e => setNovoCentroCusto(e.target.value)}
                              />
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-fyn-text">Sub-Centro de Custo</label>
                            <Select value={newSubCentroCusto} onValueChange={value => {
                              if (value === "novo") {
                                setNovoSubCentroCusto("");
                                setNewSubCentroCusto("novo");
                              } else {
                                setNewSubCentroCusto(value);
                                setNovoSubCentroCusto("");
                              }
                            }} disabled={!newCentroCusto || newCentroCusto === "novo"}>
                              <SelectTrigger>
                                <SelectValue placeholder={newCentroCusto ? "Selecione" : "Escolha o centro de custo primeiro"} />
                              </SelectTrigger>
                              <SelectContent>
                                {newCentroCusto && newCentroCusto !== "novo" && SUBCENTROS_CUSTO[newCentroCusto]?.map(sub => (
                                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                ))}
                                {newCentroCusto && newCentroCusto !== "novo" && (
                                  <>
                                    <div className="border-t my-1" />
                                    <SelectItem value="novo" className="text-fyn-accent font-semibold flex items-center gap-2">
                                      <span style={{fontWeight:600, color:'#2563eb'}}>+ Novo subcentro de custo</span>
                                    </SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            {newSubCentroCusto === "novo" && (
                              <Input
                                className="mt-2"
                                placeholder="Nome do novo subcentro de custo"
                                value={novoSubCentroCusto}
                                onChange={e => setNovoSubCentroCusto(e.target.value)}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Descrição */}
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-white border-t border-fyn-border p-3 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowNewModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleNovaConta}
                      disabled={isSaving}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {isSaving ? "Salvando..." : "Adicionar Conta"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Pendente */}
        <div className="rounded-xl bg-white shadow p-6 flex flex-col gap-2 border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </span>
            <span className="ml-auto text-gray-500 font-medium">Pendente</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(pendentes.reduce((acc, c) => acc + (Number(c.valor) || 0), 0))}</div>
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
          <div className="text-2xl font-bold text-red-500">{formatCurrency(vencidas.reduce((acc, c) => acc + (Number(c.valor) || 0), 0))}</div>
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
          <div className="text-2xl font-bold text-blue-500">{formatCurrency(proximos7.reduce((acc, c) => acc + (Number(c.valor) || 0), 0))}</div>
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
          <div className="text-2xl font-bold text-green-500">{formatCurrency(pagosMes.reduce((acc, c) => acc + (Number(c.valor) || 0), 0))}</div>
          <div className="text-gray-400 text-sm">{pagosMes.length} contas</div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fyn-muted" />
            <Input
              placeholder="Buscar por fornecedor, documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas Categorias</SelectItem>
              <SelectItem value="Fornecedores">Fornecedores</SelectItem>
              <SelectItem value="Folha de Pagamento">Folha de Pagamento</SelectItem>
              <SelectItem value="Impostos e Taxas">Impostos e Taxas</SelectItem>
              <SelectItem value="Despesas Administrativas">Desp. Administrativas</SelectItem>
            </SelectContent>
          </Select>

          {/* Subcategoria relacionada à Categoria */}
          <Select value={subCategoriaFilter} onValueChange={setSubCategoriaFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a subcategoria" />
            </SelectTrigger>
            <SelectContent>
              {categoriaFilter === "Fornecedores" && (
                <>
                  <SelectItem value="Serviços">Serviços</SelectItem>
                  <SelectItem value="Produtos">Produtos</SelectItem>
                </>
              )}
              {categoriaFilter === "Folha de Pagamento" && (
                <>
                  <SelectItem value="Salários">Salários</SelectItem>
                  <SelectItem value="Benefícios">Benefícios</SelectItem>
                </>
              )}
              {categoriaFilter === "Impostos e Taxas" && (
                <>
                  <SelectItem value="Municipais">Municipais</SelectItem>
                  <SelectItem value="Estaduais">Estaduais</SelectItem>
                  <SelectItem value="Federais">Federais</SelectItem>
                </>
              )}
              {categoriaFilter === "Despesas Administrativas" && (
                <>
                  <SelectItem value="Água">Água</SelectItem>
                  <SelectItem value="Energia">Energia</SelectItem>
                  <SelectItem value="Internet">Internet</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          <Button variant="outline" className="w-full">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Este Mês
          </Button>
        </div>
      </Card>

      {/* Tabs de Contas */}
      <Tabs defaultValue="pendentes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pendentes">
            <Clock className="mr-2 h-4 w-4" />
            Pendentes ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="vencidas">
            <AlertCircle className="mr-2 h-4 w-4" />
            Vencidas ({vencidas.length})
          </TabsTrigger>
          <TabsTrigger value="pagas">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Pagas ({pagas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-3">
          {pendentes.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-fyn-success mx-auto mb-3" />
              <p className="text-sm text-fyn-muted">Nenhuma conta pendente</p>
            </Card>
          ) : (
            <>
              <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {getPaginatedData(pendentes).map(bill => <BillCard key={bill.id} bill={bill} />)}
              </div>
              <Pagination data={pendentes} />
            </>
          )}
        </TabsContent>

        <TabsContent value="vencidas" className="space-y-3">
          {vencidas.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-fyn-success mx-auto mb-3" />
              <p className="text-sm text-fyn-muted">Nenhuma conta vencida</p>
            </Card>
          ) : (
            <>
              <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {getPaginatedData(vencidas).map(bill => <BillCard key={bill.id} bill={bill} />)}
              </div>
              <Pagination data={vencidas} />
            </>
          )}
        </TabsContent>

        <TabsContent value="pagas" className="space-y-3">
          {pagas.length === 0 ? (
            <Card className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-fyn-muted mx-auto mb-3" />
              <p className="text-sm text-fyn-muted">Nenhum pagamento realizado</p>
            </Card>
          ) : (
            <>
              <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {getPaginatedData(pagas).map(bill => <BillCard key={bill.id} bill={bill} />)}
              </div>
              <Pagination data={pagas} />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      {showDetail && selectedBill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-fyn-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-fyn-text">Detalhes da Conta</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status e Valor */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-fyn-text mb-1">{selectedBill.descricao || "-"}</h3>
                  <p className="text-sm text-fyn-muted">{selectedBill.fornecedor || selectedBill.beneficiario || ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-fyn-text">{formatCurrency(Number(selectedBill.valor) || 0)}</p>
                  <Badge className={`mt-2 ${getStatusColor(selectedBill.status)}`}>
                    {selectedBill.status}
                  </Badge>
                </div>
              </div>

              {/* Informações Principais */}
              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs text-fyn-muted">Forma de Pagamento</p>
                                  <p className="text-sm font-medium text-fyn-text">{selectedBill.formaPagamento || selectedBill.forma_pagamento || selectedBill.metodoPagamento || selectedBill.metodo_pagamento || selectedBill.metodo || selectedBill.metodo_pagamento || selectedBill.pagamento || selectedBill.paymentMethod || selectedBill.payment_method || selectedBill.metodo || formaPagamento || newFormaPagamento || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-fyn-muted">Banco</p>
                                  <p className="text-sm font-medium text-fyn-text">{selectedBill.banco || '-'}</p>
                                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Data de Vencimento</p>
                  <p className="text-sm font-medium text-fyn-text">{formatDateSafe(selectedBill.dueDate || selectedBill.vencimento)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Documento</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium text-fyn-accent hover:text-fyn-accent hover:bg-fyn-accent/10 h-auto p-1 -ml-1"
                    onClick={() => {
                      setDocumentToView(selectedBill)
                      setShowDocumentModal(true)
                      setShowDetail(false)
                    }}
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    {selectedBill.document || selectedBill.documento || "-"}
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Centro de Custo</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedBill.costCenter || selectedBill.centroCusto || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Sub-Centro</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedBill.subCostCenter || selectedBill.subCentroCusto || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Tipo</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedBill.tipo || selectedBill.type || "-"}</p>
                </div>
              </div>

              {!selectedBill.documentImage && (
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-orange-900">Documento não anexado</p>
                      <p className="text-xs text-orange-700 mt-1">
                        É importante anexar o documento para enviar ao contador. Clique no número do documento acima para anexar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBill.paymentDate && (
                <div className="rounded-lg bg-fyn-success/10 border border-fyn-success/20 p-4">
                  <p className="text-xs text-fyn-muted mb-1">Data do Pagamento</p>
                  <p className="text-sm font-medium text-fyn-success">{formatDateSafe(selectedBill.paymentDate)}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t border-fyn-border">
                {selectedBill.status !== "Pago" && (
                  <>
                    <Button className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800" onClick={() => marcarComoPago(selectedBill.id)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar como Pago
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => editarConta(selectedBill.id, {/* novos dados aqui */})}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </>
                )}
                {selectedBill.status === "Pago" && (
                  <Button variant="outline" className="flex-1">
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Comprovante
                  </Button>
                )}
                <Button variant="outline" onClick={() => deletarConta(selectedBill.id)}>
                  <Trash2 className="h-4 w-4 text-fyn-danger" />
                </Button>
              </div>
              {/* Animação de sucesso */}
              {showCheckAnimation && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
                  <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <CheckCircle2 className="w-24 h-24 text-green-500 animate-bounce-in" />
                    <span className="text-2xl font-bold text-white">Pago com sucesso!</span>
                  </div>
                  <audio ref={audioRef} src="/checkmark-sound.mp3" preload="auto" />
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Visualização do Documento */}
      {showDocumentModal && documentToView && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowDocumentModal(false)}>
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-fyn-border p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-fyn-text">Documento: {documentToView.document}</h2>
                <p className="text-sm text-fyn-muted">{documentToView.fornecedor}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDocumentModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {documentToView.documentImage ? (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden border border-fyn-border bg-gray-50">
                    <img 
                      src={documentToView.documentImage} 
                      alt={`Documento ${documentToView.document}`}
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-fyn-muted">Beneficiário</p>
                      <p className="font-medium text-fyn-text">{documentToView.fornecedor}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-fyn-muted">Valor</p>
                      <p className="font-medium text-fyn-text">{formatCurrency(Number(documentToView.valor) || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-fyn-muted">Vencimento</p>
                      <p className="font-medium text-fyn-text">{formatDateSafe(documentToView.dueDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-fyn-muted">Status</p>
                      <Badge className={getStatusColor(documentToView.status)}>{documentToView.status}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="rounded-lg bg-orange-50 border border-orange-200 p-6 max-w-md mx-auto">
                    <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-orange-900 mb-2">Documento não anexado</p>
                    <p className="text-xs text-orange-700 mb-4">
                      É importante anexar o documento para enviar ao contador.
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          console.log("Documento anexado:", file.name)
                          // Aqui você adicionaria a lógica para fazer upload do documento
                          alert(`Documento "${file.name}" anexado com sucesso!`)
                          setShowDocumentModal(false)
                        }
                      }}
                      className="hidden"
                      id="attach-document-modal"
                    />
                    <label htmlFor="attach-document-modal">
                      <Button
                        type="button"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={(e) => {
                          e.preventDefault()
                          document.getElementById('attach-document-modal').click()
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Anexar Documento Agora
                      </Button>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-fyn-border p-4">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Baixar Documento
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Nova Conta */}
      {showNewBillModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-fyn-border">
              <div>
                <h2 className="text-lg font-semibold text-fyn-text">Nova Conta a Pagar</h2>
                <p className="text-xs text-fyn-muted mt-0.5">Preencha os dados da conta</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewBillModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid gap-4">
                {/* Upload de Documento com Preenchimento Automático */}
                {!aiExtractedData && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-fyn-text">
                      Preenchimento Automático <span className="text-xs text-fyn-muted font-normal">(opcional)</span>
                    </label>
                    <p className="text-xs text-fyn-muted">
                      Envie o documento para preenchimento automático ou preencha manualmente os campos abaixo
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={isProcessingAI}
                      />
                      <label
                        htmlFor="file-upload"
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer block ${
                          isProcessingAI 
                            ? 'border-fyn-accent bg-fyn-accent/5' 
                            : uploadedFile 
                            ? 'border-green-500 bg-green-50'
                            : 'border-fyn-border hover:border-fyn-accent hover:bg-fyn-accent/5'
                        }`}
                      >
                        {isProcessingAI ? (
                          <div className="space-y-1.5">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fyn-accent"></div>
                            </div>
                            <p className="text-sm font-medium text-fyn-accent">Analisando documento...</p>
                          </div>
                        ) : uploadedFile ? (
                          <div className="space-y-1.5">
                            <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto" />
                            <p className="text-sm font-medium text-green-700">{uploadedFile.name}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <FileText className="h-6 w-6 text-fyn-muted mx-auto" />
                            <p className="text-sm text-fyn-muted">Enviar documento para análise</p>
                            <p className="text-xs text-fyn-text-light">PDF, JPG, PNG até 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                    {uploadedFile && !isProcessingAI && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadedFile(null)
                            setAiExtractedData(null)
                          }}
                        >
                          <X className="mr-2 h-3 w-3" />
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Badge de Preenchimento Automático */}
                {aiExtractedData && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-blue-900">Campos preenchidos automaticamente</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={resetForm}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Você pode revisar e ajustar as informações
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações Básicas */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-fyn-text">Informações Básicas</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-fyn-text">Número do Documento</label>
                      <Input 
                        placeholder="NF-12345" 
                        defaultValue={aiExtractedData?.document}
                        key={aiExtractedData?.document}
                      />
                    </div>
                  </div>



                  {/* Forma de Pagamento */}
                  <div className="space-y-1.5 mt-2">
                    <label className="text-sm font-medium text-fyn-text">Forma de Pagamento</label>
                    <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="outra">Outra</SelectItem>
                      </SelectContent>
                    </Select>
                    {formaPagamento === "pix" && (
                      <Input
                        className="mt-2"
                        placeholder="Chave Pix"
                        value={chavePix}
                        onChange={e => setChavePix(e.target.value)}
                      />
                    )}
                    {formaPagamento === "boleto" && (
                      <Input
                        className="mt-2"
                        placeholder="Número do boleto"
                        value={numeroBoleto}
                        onChange={e => setNumeroBoleto(e.target.value)}
                      />
                    )}
                    {formaPagamento === "cartao" && (
                      <Input
                        className="mt-2"
                        placeholder="Cartão utilizado"
                        value={cartao}
                        onChange={e => setCartao(e.target.value)}
                      />
                    )}
                    {formaPagamento === "outra" && (
                      <Input
                        className="mt-2"
                        placeholder="Descreva a forma de pagamento"
                        value={outraForma}
                        onChange={e => setOutraForma(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                {/* Valores e Datas */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-fyn-text">Valores e Datas</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-fyn-text">Valor</label>
                      <Input 
                        type="number" 
                        placeholder="0,00" 
                        value={valor}
                        onChange={e => setValor(e.target.value.replace(/[^0-9.]/g, ""))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-fyn-text">Data de Vencimento</label>
                      <Input 
                        type="date" 
                        value={vencimento}
                        onChange={e => setVencimento(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Centros de Custo */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-fyn-text">Centros de Custo</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-fyn-text">Centro de Custo</label>
                      <Select value={centroCusto} onValueChange={value => {
                        if (value === "novo") {
                          setNovoCentroCusto("");
                          setCentroCusto("novo");
                        } else {
                          setCentroCusto(value);
                          setNovoCentroCusto("");
                          setSubCentroCusto("");
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operacoes">Operações</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                          <SelectItem value="administrativo">Despesas Administrativas</SelectItem>
                          <SelectItem value="folha">Folha de Pagamento</SelectItem>
                          <div className="border-t my-1" />
                          <SelectItem value="novo" className="text-fyn-accent font-semibold flex items-center gap-2">
                            <span style={{fontWeight:600, color:'#2563eb'}}>+ Novo centro de custo</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {centroCusto === "novo" && (
                        <Input
                          className="mt-2"
                          placeholder="Nome do novo centro de custo"
                          value={novoCentroCusto}
                          onChange={e => setNovoCentroCusto(e.target.value)}
                        />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-fyn-text">Sub-Centro de Custo</label>
                      <Select value={subCentroCusto} onValueChange={value => {
                        if (value === "novo") {
                          setNovoSubCentroCusto("");
                          setSubCentroCusto("novo");
                        } else {
                          setSubCentroCusto(value);
                          setNovoSubCentroCusto("");
                        }
                      }} disabled={!centroCusto || centroCusto === "novo"}>
                        <SelectTrigger>
                          <SelectValue placeholder={centroCusto ? "Selecione" : "Escolha o centro de custo primeiro"} />
                        </SelectTrigger>
                        <SelectContent>
                          {centroCusto && centroCusto !== "novo" && SUBCENTROS_CUSTO[centroCusto]?.map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                          {centroCusto && centroCusto !== "novo" && (
                            <>
                              <div className="border-t my-1" />
                              <SelectItem value="novo" className="text-fyn-accent font-semibold flex items-center gap-2">
                                <span style={{fontWeight:600, color:'#2563eb'}}>+ Novo subcentro de custo</span>
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {subCentroCusto === "novo" && (
                        <Input
                          className="mt-2"
                          placeholder="Nome do novo subcentro de custo"
                          value={novoSubCentroCusto}
                          onChange={e => setNovoSubCentroCusto(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-fyn-text">Descrição</label>
                  <Input 
                    placeholder="Descrição da conta" 
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                  />
                </div>

                {/* Documento já anexado (se foi feito upload) */}
                {uploadedFile && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-fyn-text">Documento Anexado</label>
                    {isProcessingAI ? (
                      <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 flex items-center gap-2.5">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <p className="text-sm text-blue-700">Verificando informações do documento...</p>
                      </div>
                    ) : (
                      <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-900">{uploadedFile.name}</p>
                            <p className="text-xs text-green-700">Será enviado ao contador</p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    </div>
                )}

                {/* Alerta de documento não anexado */}
                {showDocumentAlert && !uploadedFile && (
                  <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-orange-900">Documento não anexado</p>
                        <p className="text-xs text-orange-700 mt-1">
                          É importante anexar o documento para enviar ao contador. Você pode adicionar depois na edição da conta.
                        </p>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleManualFileUpload}
                            className="hidden"
                            id="manual-file-upload"
                          />
                          <label htmlFor="manual-file-upload">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-orange-700 border-orange-300 hover:bg-orange-100 hover:text-orange-800"
                              onClick={(e) => {
                                e.preventDefault()
                                document.getElementById('manual-file-upload').click()
                              }}
                            >
                              <FileText className="mr-2 h-3.5 w-3.5" />
                              Anexar Documento Agora
                            </Button>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-fyn-border p-3 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetForm}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={handleAddBill}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Conta
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
