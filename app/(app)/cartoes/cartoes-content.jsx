"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { Plus, CreditCard, Wallet, TrendingDown, Calendar, X, Edit, Trash2, Eye, Loader2 } from "lucide-react"
import { NovoCartaoModal } from "./components/NovoCartaoModal"
import { CartaoCard } from "./components/CartaoCard"
import { FaturaModal } from "./components/FaturaModal"

export function CartoesContent() {
  const [cartoes, setCartoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [cartaoParaEditar, setCartaoParaEditar] = useState(null)
  const [cartaoParaFaturas, setCartaoParaFaturas] = useState(null)
  const [faturas, setFaturas] = useState([])
  const [loadingFaturas, setLoadingFaturas] = useState(false)
  const [faturaDetalhe, setFaturaDetalhe] = useState(null)

  const loadCartoes = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/cartoes")
      const data = await res.json()
      setCartoes(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Erro ao carregar cartões:", e)
      setCartoes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCartoes()
  }, [])

  const loadFaturas = async (cartaoId) => {
    try {
      setLoadingFaturas(true)
      const res = await fetch(`/api/cartoes/${cartaoId}/faturas`)
      const data = await res.json()
      setFaturas(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Erro ao carregar faturas:", e)
      setFaturas([])
    } finally {
      setLoadingFaturas(false)
    }
  }

  const handleVerFaturas = (cartao) => {
    setCartaoParaFaturas(cartao)
    loadFaturas(cartao.id)
  }

  const handleEditar = (cartao) => {
    setCartaoParaEditar(cartao)
    setShowNovoModal(true)
  }

  const handleExcluir = async (cartaoId) => {
    if (!confirm("Tem certeza que deseja excluir este cartão?")) return

    try {
      const res = await fetch(`/api/cartoes?id=${cartaoId}`, { method: "DELETE" })
      if (res.ok) {
        loadCartoes()
      }
    } catch (e) {
      console.error("Erro ao excluir cartão:", e)
      alert("Erro ao excluir cartão")
    }
  }

  const handleSuccess = () => {
    loadCartoes()
    setShowNovoModal(false)
    setCartaoParaEditar(null)
  }

  // Calcular KPIs
  const limiteTotal = cartoes.reduce((acc, c) => acc + c.limite, 0)
  const limiteUtilizado = cartoes.reduce((acc, c) => acc + (c.limiteUtilizado || 0), 0)
  const limiteDisponivel = limiteTotal - limiteUtilizado
  const percentUtilizado = limiteTotal > 0 ? (limiteUtilizado / limiteTotal) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fyn-text">Cartões de Crédito</h1>
          <p className="text-sm text-fyn-muted mt-1">Gerencie seus cartões e faturas</p>
        </div>
        <Button size="sm" onClick={() => setShowNovoModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-fyn-muted">Limite Total</p>
              <p className="text-lg font-bold text-fyn-text">{formatCurrency(limiteTotal)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-fyn-muted">Limite Utilizado</p>
              <p className="text-lg font-bold text-fyn-text">{formatCurrency(limiteUtilizado)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-fyn-muted">Limite Disponível</p>
              <p className="text-lg font-bold text-fyn-text">{formatCurrency(limiteDisponivel)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-fyn-muted">Uso do Limite</p>
              <p className="text-lg font-bold text-fyn-text">{percentUtilizado.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Cartões */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-fyn-muted" />
        </div>
      ) : cartoes.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="h-12 w-12 text-fyn-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fyn-text mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-sm text-fyn-muted mb-4">
            Adicione seu primeiro cartão de crédito para começar a controlar suas faturas.
          </p>
          <Button onClick={() => setShowNovoModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Cartão
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cartoes.map((cartao) => (
            <CartaoCard
              key={cartao.id}
              cartao={cartao}
              onEdit={() => handleEditar(cartao)}
              onDelete={() => handleExcluir(cartao.id)}
              onViewFaturas={() => handleVerFaturas(cartao)}
            />
          ))}
        </div>
      )}

      {/* Modal Novo/Editar Cartão */}
      {showNovoModal && (
        <NovoCartaoModal
          key={cartaoParaEditar?.id || "novo"}
          cartao={cartaoParaEditar}
          onClose={() => {
            setShowNovoModal(false)
            setCartaoParaEditar(null)
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Modal de Faturas */}
      {cartaoParaFaturas && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-fyn-border">
              <div>
                <h2 className="text-lg font-semibold text-fyn-text">
                  Faturas - {cartaoParaFaturas.nome}
                </h2>
                <p className="text-sm text-fyn-muted">
                  **** {cartaoParaFaturas.ultimos4Digitos}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCartaoParaFaturas(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {loadingFaturas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-fyn-muted" />
                </div>
              ) : faturas.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 text-fyn-muted mx-auto mb-3" />
                  <p className="text-sm text-fyn-muted">Nenhuma fatura encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {faturas.map((fatura) => {
                    const meses = [
                      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                    ]
                    const mesNome = meses[fatura.mesReferencia - 1]

                    return (
                      <Card
                        key={fatura.id}
                        className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                          fatura.pago ? "bg-green-50" : "bg-yellow-50"
                        }`}
                        onClick={() => setFaturaDetalhe(fatura)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-fyn-text">
                              {mesNome}/{fatura.anoReferencia}
                            </h4>
                            <p className="text-xs text-fyn-muted">
                              Vencimento: {new Date(fatura.dataVencimento).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-fyn-text">
                              {formatCurrency(fatura.valorTotal)}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              fatura.pago
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {fatura.pago ? "Paga" : "Aberta"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modal Detalhe Fatura */}
      {faturaDetalhe && (
        <FaturaModal
          fatura={faturaDetalhe}
          onClose={() => setFaturaDetalhe(null)}
          onPago={() => {
            setFaturaDetalhe(null)
            if (cartaoParaFaturas) {
              loadFaturas(cartaoParaFaturas.id)
            }
            loadCartoes()
          }}
        />
      )}
    </div>
  )
}
