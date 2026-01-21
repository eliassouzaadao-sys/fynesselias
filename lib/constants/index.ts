/**
 * Application-wide constants
 */

// Status options
export const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente', color: 'yellow' },
  { value: 'pago', label: 'Pago', color: 'green' },
  { value: 'vencido', label: 'Vencido', color: 'red' },
  { value: 'cancelado', label: 'Cancelado', color: 'gray' },
] as const;

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cheque', label: 'Cheque' },
] as const;

// Account types
export const ACCOUNT_TYPES = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'investimento', label: 'Investimento' },
] as const;

// Person types
export const PERSON_TYPES = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'ambos', label: 'Cliente e Fornecedor' },
] as const;

// Transaction types
export const TRANSACTION_TYPES = [
  { value: 'pagar', label: 'Contas a Pagar', color: 'red' },
  { value: 'receber', label: 'Contas a Receber', color: 'green' },
] as const;

// Categories (Expense)
export const EXPENSE_CATEGORIES = [
  { value: 'salarios', label: 'Salários e Encargos' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'fornecedores', label: 'Fornecedores' },
  { value: 'impostos', label: 'Impostos e Taxas' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'utilidades', label: 'Utilidades (Água, Luz, etc)' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'outros', label: 'Outros' },
] as const;

// Categories (Income)
export const INCOME_CATEGORIES = [
  { value: 'vendas', label: 'Vendas' },
  { value: 'servicos', label: 'Prestação de Serviços' },
  { value: 'juros', label: 'Juros e Rendimentos' },
  { value: 'outros', label: 'Outros' },
] as const;

// Brazilian states
export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const;

// Date formats
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// Currency
export const CURRENCY_LOCALE = 'pt-BR';
export const CURRENCY_CODE = 'BRL';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Toast durations
export const TOAST_DURATION = 3000;
export const TOAST_ERROR_DURATION = 5000;

// API endpoints
export const API_ROUTES = {
  contas: '/api/contas',
  pessoas: '/api/pessoas',
  users: '/api/users',
} as const;

// Navigation menu items
export const MENU_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/caixa', label: 'Caixa', icon: 'Wallet' },
  { href: '/pagar', label: 'Contas a Pagar', icon: 'ArrowDownCircle' },
  { href: '/receber', label: 'Contas a Receber', icon: 'ArrowUpCircle' },
  { href: '/contas-bancarias', label: 'Contas Bancárias', icon: 'Building2' },
  { href: '/conciliacao', label: 'Conciliação', icon: 'FileCheck' },
  { href: '/creditos', label: 'Créditos', icon: 'CreditCard' },
  { href: '/centros-de-custo', label: 'Centros de Custo', icon: 'FolderTree' },
  { href: '/comparativo', label: 'Comparativo', icon: 'BarChart3' },
  { href: '/relatorios/dre', label: 'DRE', icon: 'FileBarChart' },
  { href: '/relatorios/fluxo', label: 'Fluxo de Caixa', icon: 'TrendingUp' },
  { href: '/relatorios/balancete', label: 'Balancete', icon: 'Scale' },
  { href: '/automacao', label: 'Automação', icon: 'Zap' },
  { href: '/auditoria', label: 'Auditoria', icon: 'Shield' },
  { href: '/empresas', label: 'Empresas', icon: 'Building' },
  { href: '/socios', label: 'Sócios', icon: 'Users' },
  { href: '/contador', label: 'Contador', icon: 'UserCheck' },
  { href: '/configuracoes', label: 'Configurações', icon: 'Settings' },
] as const;
