"use client"

import useSWR from 'swr'

// Fetcher padrão com tratamento de erro
const fetcher = async (url) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('Erro ao carregar dados')
    error.status = res.status
    throw error
  }
  return res.json()
}

// Hook para fetch com cache automático
// - Dados ficam em cache entre navegações
// - Revalida em background (stale-while-revalidate)
// - Deduplica requests simultâneos
export function useCachedFetch(url, options = {}) {
  const {
    revalidateOnFocus = false,      // Não revalida ao focar a janela
    revalidateOnReconnect = true,   // Revalida ao reconectar
    dedupingInterval = 10000,       // Deduplica por 10s
    refreshInterval = 0,            // Não faz polling
    ...restOptions
  } = options

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus,
      revalidateOnReconnect,
      dedupingInterval,
      refreshInterval,
      ...restOptions
    }
  )

  return {
    data: data ?? [],
    error,
    isLoading,
    isValidating,  // True quando está revalidando em background
    refresh: mutate // Função para forçar refresh
  }
}

// Hook específico para contas com cache
export function useContas(modo = null) {
  const url = modo ? `/api/contas?modo=${modo}` : '/api/contas'
  return useCachedFetch(url)
}

// Hook específico para centros
export function useCentros(tipo, dataInicio, dataFim) {
  const params = new URLSearchParams()
  if (tipo) params.set('tipo', tipo)
  if (dataInicio) params.set('dataInicio', dataInicio)
  if (dataFim) params.set('dataFim', dataFim)
  return useCachedFetch(`/api/centros?${params.toString()}`)
}

// Hook para fluxo de caixa
export function useFluxoCaixa() {
  return useCachedFetch('/api/fluxo-caixa')
}
