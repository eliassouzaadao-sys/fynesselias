"use client";

import { useState, useEffect } from "react";
import { X, Plus, FileText, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PessoaSelect } from "@/components/forms/pessoa-form";

interface NovaContaModalProps {
  tipo: "pagar" | "receber";
  onClose: () => void;
  onSuccess: () => void;
}

interface Banco {
  id: number;
  nome: string;
  codigo?: string;
}

interface Subcategoria {
  id: number;
  nome: string;
}

interface Categoria {
  id: number;
  nome: string;
  tipo: string;
  subcategorias: Subcategoria[];
}

const FORMAS_PAGAMENTO = [
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "transferencia", label: "Transferência Bancária" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cheque", label: "Cheque" },
];

export function NovaContaModal({ tipo, onClose, onSuccess }: NovaContaModalProps) {
  // Bancos do banco de dados
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loadingBancos, setLoadingBancos] = useState(true);
  const [showNovoBancoInput, setShowNovoBancoInput] = useState(false);
  const [novoBancoNome, setNovoBancoNome] = useState("");
  const [criandoBanco, setCriandoBanco] = useState(false);

  // Categorias e subcategorias do banco de dados
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [showNovaCategoriaInput, setShowNovaCategoriaInput] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [criandoCategoria, setCriandoCategoria] = useState(false);
  const [showNovaSubcategoriaInput, setShowNovaSubcategoriaInput] = useState(false);
  const [novaSubcategoriaNome, setNovaSubcategoriaNome] = useState("");
  const [criandoSubcategoria, setCriandoSubcategoria] = useState(false);

  // Campos principais (topo do formulário)
  const [bancoId, setBancoId] = useState("");
  const [descricao, setDescricao] = useState("");

  // Upload de documento
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dados do formulário
  const [pessoaId, setPessoaId] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [valor, setValor] = useState<number>(0);
  const [vencimento, setVencimento] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Estados de UI
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titulo = tipo === "pagar" ? "Nova Conta a Pagar" : "Nova Conta a Receber";
  const labelBeneficiario = tipo === "pagar" ? "Fornecedor/Beneficiário" : "Cliente/Pagador";

  // Subcategorias da categoria selecionada
  const categoriaSelecionada = categorias.find((c) => String(c.id) === categoriaId);
  const subcategorias = categoriaSelecionada?.subcategorias || [];

  // Carregar bancos e categorias
  useEffect(() => {
    async function loadBancos() {
      try {
        const response = await fetch("/api/bancos");
        if (response.ok) {
          const data = await response.json();
          setBancos(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Erro ao carregar bancos:", err);
      } finally {
        setLoadingBancos(false);
      }
    }

    async function loadCategorias() {
      try {
        const response = await fetch(`/api/categorias?tipo=${tipo}`);
        if (response.ok) {
          const data = await response.json();
          setCategorias(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      } finally {
        setLoadingCategorias(false);
      }
    }

    loadBancos();
    loadCategorias();
  }, [tipo]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Tamanho máximo: 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Tipo de arquivo não suportado. Use PDF, JPG ou PNG");
      return;
    }

    setUploadedFile(file);
    setError(null);

    // TODO: Implement AI extraction
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  // Adicionar novo banco
  const handleAdicionarBanco = async () => {
    if (!novoBancoNome.trim()) {
      setError("Nome do banco é obrigatório");
      return;
    }

    setCriandoBanco(true);
    setError(null);

    try {
      const response = await fetch("/api/bancos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoBancoNome.trim() }),
      });

      if (response.ok) {
        const novoBanco = await response.json();
        setBancos([...bancos, novoBanco]);
        setBancoId(String(novoBanco.id));
        setShowNovoBancoInput(false);
        setNovoBancoNome("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao criar banco");
      }
    } catch (err) {
      setError("Erro ao criar banco");
    } finally {
      setCriandoBanco(false);
    }
  };

  // Adicionar nova categoria
  const handleAdicionarCategoria = async () => {
    if (!novaCategoriaNome.trim()) {
      setError("Nome da categoria é obrigatório");
      return;
    }

    setCriandoCategoria(true);
    setError(null);

    try {
      const response = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novaCategoriaNome.trim(), tipo }),
      });

      if (response.ok) {
        const novaCategoria = await response.json();
        setCategorias([...categorias, novaCategoria]);
        setCategoriaId(String(novaCategoria.id));
        setShowNovaCategoriaInput(false);
        setNovaCategoriaNome("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao criar categoria");
      }
    } catch (err) {
      setError("Erro ao criar categoria");
    } finally {
      setCriandoCategoria(false);
    }
  };

  // Adicionar nova subcategoria
  const handleAdicionarSubcategoria = async () => {
    if (!novaSubcategoriaNome.trim()) {
      setError("Nome da subcategoria é obrigatório");
      return;
    }

    if (!categoriaId) {
      setError("Selecione uma categoria primeiro");
      return;
    }

    setCriandoSubcategoria(true);
    setError(null);

    try {
      const response = await fetch(`/api/categorias/${categoriaId}/subcategorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novaSubcategoriaNome.trim() }),
      });

      if (response.ok) {
        const novaSubcategoria = await response.json();
        // Atualizar categorias localmente
        setCategorias(
          categorias.map((cat) =>
            String(cat.id) === categoriaId
              ? { ...cat, subcategorias: [...cat.subcategorias, novaSubcategoria] }
              : cat
          )
        );
        setSubcategoriaId(String(novaSubcategoria.id));
        setShowNovaSubcategoriaInput(false);
        setNovaSubcategoriaNome("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao criar subcategoria");
      }
    } catch (err) {
      setError("Erro ao criar subcategoria");
    } finally {
      setCriandoSubcategoria(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setBancoId("");
    setDescricao("");
    setUploadedFile(null);
    setPessoaId("");
    setNumeroDocumento("");
    setFormaPagamento("");
    setValor(0);
    setVencimento("");
    setCategoriaId("");
    setSubcategoriaId("");
    setObservacoes("");
    setError(null);
    setShowNovoBancoInput(false);
    setNovoBancoNome("");
    setShowNovaCategoriaInput(false);
    setNovaCategoriaNome("");
    setShowNovaSubcategoriaInput(false);
    setNovaSubcategoriaNome("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!descricao.trim()) {
      setError("Descrição é obrigatória");
      return;
    }

    if (!bancoId) {
      setError("Selecione um banco");
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

    setIsSaving(true);

    try {
      // Get banco name
      const bancoSelecionado = bancos.find((b) => String(b.id) === bancoId);

      const response = await fetch("/api/contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim(),
          valor: Number(valor),
          vencimento,
          tipo,
          banco: bancoSelecionado?.nome || null,
          beneficiario: pessoaId || null,
          pessoaId: pessoaId ? Number(pessoaId) : null,
          numeroDocumento: numeroDocumento.trim() || null,
          formaPagamento: formaPagamento || null,
          categoria: categoriaSelecionada?.nome || null,
          subcategoria: subcategorias.find((s) => String(s.id) === subcategoriaId)?.nome || null,
          observacoes: observacoes.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar conta");
      }

      // Success!
      resetForm();
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
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-fyn-border">
          <div>
            <h2 className="text-lg font-semibold text-fyn-text">{titulo}</h2>
            <p className="text-xs text-fyn-muted mt-0.5">Preencha os dados da conta</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 overflow-y-auto flex-1">
            <div className="space-y-4">
              {/* Campos Principais - TOPO */}
              <div className="space-y-3 pb-4 border-b border-fyn-border">
                <h3 className="text-sm font-semibold text-fyn-text">Informações Principais</h3>

                {/* Banco */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-fyn-text">
                    Banco para {tipo === "pagar" ? "Pagamento" : "Recebimento"} *
                  </label>
                  {loadingBancos ? (
                    <div className="flex items-center gap-2 p-3 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-fyn-muted">Carregando bancos...</span>
                    </div>
                  ) : (
                    <>
                      <Select value={bancoId} onValueChange={(value) => {
                        if (value === "novo") {
                          setShowNovoBancoInput(true);
                          setBancoId("");
                        } else {
                          setBancoId(value);
                        }
                      }} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {bancos.map((banco) => (
                            <SelectItem key={banco.id} value={String(banco.id)}>
                              {banco.nome}
                            </SelectItem>
                          ))}
                          <div className="border-t my-1" />
                          <SelectItem value="novo" className="text-fyn-accent font-semibold">
                            + Adicionar novo banco
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Input para novo banco */}
                      {showNovoBancoInput && (
                        <div className="mt-2 p-3 border-2 border-fyn-accent rounded-lg bg-blue-50 space-y-2">
                          <p className="text-sm font-medium text-blue-900">Novo Banco</p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nome do banco"
                              value={novoBancoNome}
                              onChange={(e) => setNovoBancoNome(e.target.value)}
                              disabled={criandoBanco}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAdicionarBanco}
                              disabled={criandoBanco}
                            >
                              {criandoBanco ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowNovoBancoInput(false);
                                setNovoBancoNome("");
                              }}
                              disabled={criandoBanco}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-fyn-text">Descrição da Conta *</label>
                  <Input
                    placeholder={`Ex: ${
                      tipo === "pagar"
                        ? "Salário Funcionário, Energia elétrica"
                        : "Venda Produto X, Prestação de Serviço"
                    }`}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Upload de Documento - SEÇÃO DESTACADA */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-fyn-text">
                  Documento <span className="text-xs text-fyn-muted font-normal">(opcional)</span>
                </label>
                <p className="text-xs text-fyn-muted">
                  Envie o documento para preenchimento automático ou preencha manualmente abaixo
                </p>

                {!uploadedFile ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={isProcessing || isSaving}
                    />
                    <label
                      htmlFor="file-upload"
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer block ${
                        isProcessing
                          ? "border-fyn-accent bg-fyn-accent/5"
                          : "border-fyn-border hover:border-fyn-accent hover:bg-fyn-accent/5"
                      } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isProcessing ? (
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-fyn-accent" />
                          </div>
                          <p className="text-sm font-medium text-fyn-accent">Analisando documento...</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-fyn-muted mx-auto" />
                          <p className="text-sm text-fyn-muted font-medium">
                            Clique para enviar documento
                          </p>
                          <p className="text-xs text-fyn-text-light">PDF, JPG, PNG até 10MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                ) : (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">{uploadedFile.name}</p>
                        <p className="text-xs text-green-700">
                          {(uploadedFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Informações do Documento */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-fyn-text">Detalhes</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Beneficiário/Cliente */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-fyn-text">{labelBeneficiario}</label>
                    <PessoaSelect
                      value={pessoaId}
                      onChange={setPessoaId}
                      onAdd={() => {}}
                      disabled={isSaving}
                    />
                  </div>

                  {/* Número do Documento */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-fyn-text">Número do Documento</label>
                    <Input
                      placeholder="Ex: NF-12345, BOL-67890"
                      value={numeroDocumento}
                      onChange={(e) => setNumeroDocumento(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-fyn-text">
                    Forma de {tipo === "pagar" ? "Pagamento" : "Recebimento"}
                  </label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento} disabled={isSaving}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Valores e Datas */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-fyn-text">Valores e Datas</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-fyn-text">Valor *</label>
                    <CurrencyInput
                      value={valor}
                      onValueChange={setValor}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-fyn-text">Data de Vencimento *</label>
                    <Input
                      type="date"
                      value={vencimento}
                      onChange={(e) => setVencimento(e.target.value)}
                      required
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>


              {/* Categoria e Subcategoria */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-fyn-text">Classificação</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Categoria */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-fyn-text">Categoria</label>
                    {loadingCategorias ? (
                      <div className="flex items-center gap-2 p-3 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-fyn-muted">Carregando...</span>
                      </div>
                    ) : (
                      <>
                        <Select
                          value={categoriaId}
                          onValueChange={(value) => {
                            if (value === "nova") {
                              setShowNovaCategoriaInput(true);
                              setCategoriaId("");
                            } else {
                              setCategoriaId(value);
                              setSubcategoriaId(""); // Reset subcategoria ao mudar categoria
                            }
                          }}
                          disabled={isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.nome}
                              </SelectItem>
                            ))}
                            <div className="border-t my-1" />
                            <SelectItem value="nova" className="text-fyn-accent font-semibold">
                              + Adicionar nova categoria
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Input para nova categoria */}
                        {showNovaCategoriaInput && (
                          <div className="mt-2 p-3 border-2 border-fyn-accent rounded-lg bg-blue-50 space-y-2">
                            <p className="text-sm font-medium text-blue-900">Nova Categoria</p>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Nome da categoria"
                                value={novaCategoriaNome}
                                onChange={(e) => setNovaCategoriaNome(e.target.value)}
                                disabled={criandoCategoria}
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleAdicionarCategoria}
                                disabled={criandoCategoria}
                              >
                                {criandoCategoria ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowNovaCategoriaInput(false);
                                  setNovaCategoriaNome("");
                                }}
                                disabled={criandoCategoria}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Subcategoria */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-fyn-text">Subcategoria</label>
                    {loadingCategorias ? (
                      <div className="flex items-center gap-2 p-3 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-fyn-muted">Carregando...</span>
                      </div>
                    ) : (
                      <>
                        <Select
                          value={subcategoriaId}
                          onValueChange={(value) => {
                            if (value === "nova") {
                              setShowNovaSubcategoriaInput(true);
                              setSubcategoriaId("");
                            } else {
                              setSubcategoriaId(value);
                            }
                          }}
                          disabled={isSaving || !categoriaId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={categoriaId ? "Selecione uma subcategoria" : "Selecione uma categoria primeiro"} />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategorias.map((sub) => (
                              <SelectItem key={sub.id} value={String(sub.id)}>
                                {sub.nome}
                              </SelectItem>
                            ))}
                            {categoriaId && (
                              <>
                                <div className="border-t my-1" />
                                <SelectItem value="nova" className="text-fyn-accent font-semibold">
                                  + Adicionar nova subcategoria
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>

                        {/* Input para nova subcategoria */}
                        {showNovaSubcategoriaInput && categoriaId && (
                          <div className="mt-2 p-3 border-2 border-fyn-accent rounded-lg bg-blue-50 space-y-2">
                            <p className="text-sm font-medium text-blue-900">Nova Subcategoria</p>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Nome da subcategoria"
                                value={novaSubcategoriaNome}
                                onChange={(e) => setNovaSubcategoriaNome(e.target.value)}
                                disabled={criandoSubcategoria}
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleAdicionarSubcategoria}
                                disabled={criandoSubcategoria}
                              >
                                {criandoSubcategoria ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowNovaSubcategoriaInput(false);
                                  setNovaSubcategoriaNome("");
                                }}
                                disabled={criandoSubcategoria}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5 mt-3">
                <label className="text-sm font-medium text-fyn-text">Observações</label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 text-sm border border-fyn-border rounded-md focus:outline-none focus:ring-2 focus:ring-fyn-accent disabled:opacity-50"
                  placeholder="Informações adicionais sobre esta conta..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="sticky bottom-0 bg-white border-t border-fyn-border p-3 flex gap-2">
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
                  Adicionar Conta
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
