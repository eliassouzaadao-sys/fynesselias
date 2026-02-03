export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(date) {
  // Se for uma string no formato YYYY-MM-DD ou ISO, usar UTC para evitar problemas de timezone
  if (typeof date === 'string') {
    // Extrair apenas a parte da data (YYYY-MM-DD)
    const dateStr = date.split('T')[0]
    const [year, month, day] = dateStr.split('-').map(Number)
    // Criar data como local (não UTC) para exibição correta
    return new Intl.DateTimeFormat("pt-BR").format(new Date(year, month - 1, day))
  }
  // Se já for um objeto Date, usar timeZone UTC para evitar conversão
  return new Intl.DateTimeFormat("pt-BR", { timeZone: 'UTC' }).format(new Date(date))
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date))
}

export function formatPercentage(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`
}

export function formatCNPJ(cnpj) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
}
