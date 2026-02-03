"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"

const EmpresaContext = createContext({
  empresas: [],
  empresaAtiva: null,
  loading: true,
  error: null,
  carregarEmpresas: () => {},
  selecionarEmpresa: () => {},
  criarEmpresa: () => {},
  atualizarEmpresa: () => {},
  excluirEmpresa: () => {},
})

export function EmpresaProvider({ children }) {
  const [empresas, setEmpresas] = useState([])
  const [empresaAtiva, setEmpresaAtiva] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const initializedRef = useRef(false)

  // Inicialização síncrona a partir do localStorage (evita loading desnecessário)
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    try {
      const cachedEmpresas = localStorage.getItem("empresas_cache")
      const empresaAtivaId = localStorage.getItem("empresaAtiva")

      if (cachedEmpresas && empresaAtivaId) {
        const parsed = JSON.parse(cachedEmpresas)
        const ativa = parsed.find(e => e.id === parseInt(empresaAtivaId))
        if (ativa && parsed.length > 0) {
          setEmpresas(parsed)
          setEmpresaAtiva(ativa)
          setLoading(false)
        }
      }
    } catch (err) {
      console.error("Erro ao ler cache:", err)
    }

    // Carregar do servidor em background
    carregarEmpresas()
  }, [])

  // Carregar empresas do usuário
  const carregarEmpresas = useCallback(async () => {
    try {
      setError(null)

      const response = await fetch("/api/empresas")

      if (!response.ok) {
        if (response.status === 401) {
          setEmpresas([])
          setEmpresaAtiva(null)
          localStorage.removeItem("empresas_cache")
          localStorage.removeItem("empresaAtiva")
          setLoading(false)
          return
        }
        throw new Error("Falha ao carregar empresas")
      }

      const data = await response.json()
      setEmpresas(data)

      // Salvar no cache para próxima navegação
      localStorage.setItem("empresas_cache", JSON.stringify(data))

      // Se não houver empresas, criar uma padrão
      if (data.length === 0) {
        await criarEmpresaPadrao()
        return
      }

      // Verificar se já tem empresa ativa no localStorage
      const empresaAtivaId = localStorage.getItem("empresaAtiva")
      if (empresaAtivaId) {
        const empresaEncontrada = data.find(e => e.id === parseInt(empresaAtivaId))
        if (empresaEncontrada) {
          setEmpresaAtiva(empresaEncontrada)
          setLoading(false)
          return
        }
      }

      // Caso contrário, selecionar a primeira empresa
      if (data.length > 0) {
        await selecionarEmpresa(data[0])
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Criar empresa padrão para novo usuário
  async function criarEmpresaPadrao() {
    try {
      const response = await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: "Minha Empresa" }),
      })

      if (!response.ok) throw new Error("Falha ao criar empresa padrão")

      const novaEmpresa = await response.json()
      setEmpresas([novaEmpresa])
      localStorage.setItem("empresas_cache", JSON.stringify([novaEmpresa]))
      await selecionarEmpresa(novaEmpresa)
    } catch (err) {
      console.error("Erro ao criar empresa padrão:", err)
      setError(err.message)
    }
  }

  // Selecionar empresa ativa
  async function selecionarEmpresa(empresa) {
    try {
      // Atualizar estado local imediatamente (otimistic update)
      localStorage.setItem("empresaAtiva", empresa.id.toString())
      setEmpresaAtiva(empresa)

      // Salvar no backend (cookie) em background
      const response = await fetch(`/api/empresas/${empresa.id}/selecionar`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Falha ao selecionar empresa")

      // Emitir evento para componentes reagirem
      window.dispatchEvent(new CustomEvent("empresaChanged", { detail: empresa }))
    } catch (err) {
      console.error("Erro ao selecionar empresa:", err)
      setError(err.message)
    }
  }

  // Criar nova empresa
  async function criarEmpresa(dados) {
    try {
      const response = await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao criar empresa")
      }

      const novaEmpresa = await response.json()
      const novasEmpresas = [...empresas, novaEmpresa]
      setEmpresas(novasEmpresas)
      localStorage.setItem("empresas_cache", JSON.stringify(novasEmpresas))

      // Selecionar automaticamente a nova empresa
      await selecionarEmpresa(novaEmpresa)

      return novaEmpresa
    } catch (err) {
      console.error("Erro ao criar empresa:", err)
      throw err
    }
  }

  // Atualizar empresa
  async function atualizarEmpresa(id, dados) {
    try {
      const response = await fetch(`/api/empresas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao atualizar empresa")
      }

      const empresaAtualizada = await response.json()
      const novasEmpresas = empresas.map(e => (e.id === id ? empresaAtualizada : e))
      setEmpresas(novasEmpresas)
      localStorage.setItem("empresas_cache", JSON.stringify(novasEmpresas))

      // Atualizar empresa ativa se for a mesma
      if (empresaAtiva?.id === id) {
        setEmpresaAtiva(empresaAtualizada)
      }

      return empresaAtualizada
    } catch (err) {
      console.error("Erro ao atualizar empresa:", err)
      throw err
    }
  }

  // Excluir (desativar) empresa
  async function excluirEmpresa(id) {
    try {
      const response = await fetch(`/api/empresas/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Falha ao excluir empresa")
      }

      const novasEmpresas = empresas.filter(e => e.id !== id)
      setEmpresas(novasEmpresas)
      localStorage.setItem("empresas_cache", JSON.stringify(novasEmpresas))

      // Se excluiu a empresa ativa, selecionar outra
      if (empresaAtiva?.id === id) {
        const outraEmpresa = novasEmpresas[0]
        if (outraEmpresa) {
          await selecionarEmpresa(outraEmpresa)
        }
      }
    } catch (err) {
      console.error("Erro ao excluir empresa:", err)
      throw err
    }
  }

  return (
    <EmpresaContext.Provider
      value={{
        empresas,
        empresaAtiva,
        loading,
        error,
        carregarEmpresas,
        selecionarEmpresa,
        criarEmpresa,
        atualizarEmpresa,
        excluirEmpresa,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  )
}

export function useEmpresa() {
  const context = useContext(EmpresaContext)
  if (!context) {
    throw new Error("useEmpresa deve ser usado dentro de EmpresaProvider")
  }
  return context
}
