/**
 * Core TypeScript type definitions for the Fyness application
 */

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Company types
export interface Company {
  _id: string;
  name: string;
  cnpj: string;
  active?: boolean;
}

// Pessoa (Contact) types
export interface Pessoa {
  id: string;
  nome: string;
  tipo: 'cliente' | 'fornecedor' | 'ambos';
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: string;
  chavePix?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Conta (Bill/Transaction) types
export type StatusConta = 'pago' | 'em_dia' | 'atencao' | 'atrasado' | 'cancelado';
export type TipoConta = 'pagar' | 'receber';
export type FormaPagamento = 'dinheiro' | 'pix' | 'transferencia' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'cheque';

export interface Conta {
  id: string;
  tipo: TipoConta;
  descricao: string;
  valor: number;
  vencimento: Date; // also mapped as dataVencimento
  dataVencimento: Date;
  pago: boolean;
  dataPagamento?: Date;
  status: StatusConta;
  categoria?: string;
  subcategoria?: string;
  centroCusto?: string;
  subCentroCusto?: string;
  formaPagamento?: FormaPagamento;
  numeroDocumento?: string;
  banco?: string;
  beneficiario?: string;
  documento?: string;
  observacoes?: string;
  comprovante?: string;
  anexos?: string[];
  noFluxoCaixa: boolean;
  pessoaId?: string;
  pessoa?: Pessoa;
  recorrente?: boolean;
  parcela?: number;
  totalParcelas?: number;
  createdViaWhatsApp?: boolean;
  aiConfidence?: number;
  criadoEm: Date; // also mapped as createdAt
  atualizadoEm: Date; // also mapped as updatedAt
  createdAt: Date;
  updatedAt: Date;
}

// Bank Account types
export interface BankAccount {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: 'corrente' | 'poupanca' | 'investimento';
  saldoInicial: number;
  saldoAtual: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard KPI types
export interface KPI {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  color?: string;
}

// Filter types
export interface FilterState {
  search?: string;
  status?: StatusConta | 'all';
  tipo?: TipoConta | 'all';
  categoria?: string;
  dataInicio?: Date;
  dataFim?: Date;
  banco?: string;
  formaPagamento?: FormaPagamento;
}

// Pagination types
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Sort types
export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface ContaFormData {
  tipo: TipoConta;
  descricao: string;
  valor: number | string;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusConta;
  categoria?: string;
  subcategoria?: string;
  centroCusto?: string;
  subCentroCusto?: string;
  formaPagamento?: FormaPagamento;
  banco?: string;
  beneficiario?: string;
  documento?: string;
  observacoes?: string;
  pessoaId?: string;
  recorrente?: boolean;
  parcela?: number;
  totalParcelas?: number;
}

export interface PessoaFormData {
  nome: string;
  tipo: 'cliente' | 'fornecedor' | 'ambos';
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: string;
  chavePix?: string;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  category?: string;
}

// Onboarding types
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface OnboardingState {
  currentStep: number;
  steps: OnboardingStep[];
  completed: boolean;
}
