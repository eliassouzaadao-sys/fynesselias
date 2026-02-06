"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Truck,
  Phone,
  Mail,
  Building2,
  Edit,
  Trash2,
  Eye,
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  MoreVertical,
  Copy,
} from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { FornecedorModal } from "./components/FornecedorModal"
import { FornecedorDetalhesModal } from "./components/FornecedorDetalhesModal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function FornecedoresContent() {
  const [fornecedores, setFornecedores] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [fornecedorToEdit, setFornecedorToEdit] = useState(null)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [fornecedorDetalhes, setFornecedorDetalhes] = useState(null)

  const loadFornecedores = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtroStatus) params.set("status", filtroStatus)
      if (searchTerm) params.set("search", searchTerm)

      const res = await fetch(`/api/fornecedores?${params.toString()}`)
      const data = await res.json()
      setFornecedores(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Failed to load fornecedores:", e)
      setFornecedores([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFornecedores()
  }, [filtroStatus])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadFornecedores()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSuccess = () => {
    loadFornecedores()
    setShowModal(false)
    setFornecedorToEdit(null)
  }

  const handleEdit = (fornecedor) => {
    setFornecedorToEdit(fornecedor)
    setShowModal(true)
  }

  const handleVerDetalhes = async (fornecedor) => {
    try {
      const res = await fetch(`/api/fornecedores/${fornecedor.id}`)
      const data = await res.json()
      setFornecedorDetalhes(data)
      setShowDetalhes(true)
    } catch (e) {
      console.error("Erro ao carregar detalhes:", e)
      toast.error("Erro ao carregar detalhes do fornecedor")
    }
  }

  const handleDelete = async (fornecedor) => {
    if (!confirm(`Deseja realmente excluir o fornecedor "${fornecedor.nome}"?`)) {
      return
    }

    try {
      const res = await fetch("/api/fornecedores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fornecedor.id }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.inativado) {
          toast.success("Fornecedor inativado (possui contas vinculadas)")
        } else {
          toast.success("Fornecedor excluído com sucesso")
        }
        loadFornecedores()
      } else {
        toast.error(data.error || "Erro ao excluir fornecedor")
      }
    } catch (e) {
      console.error("Erro ao excluir:", e)
      toast.error("Erro ao excluir fornecedor")
    }
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  const formatDocumento = (doc) => {
    if (!doc) return ""
    const clean = doc.replace(/\D/g, "")
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return doc
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Fornecedores</h1>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CNPJ/CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroStatus || "todos"} onValueChange={(v) => setFiltroStatus(v === "todos" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{fornecedores.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold">
                {fornecedores.filter((f) => f.status === "ativo").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
              <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inativos</p>
              <p className="text-2xl font-bold">
                {fornecedores.filter((f) => f.status === "inativo").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Fornecedores */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : fornecedores.length === 0 ? (
        <Card className="p-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum fornecedor encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filtroStatus
              ? "Tente ajustar os filtros de busca"
              : "Comece cadastrando seu primeiro fornecedor"}
          </p>
          {!searchTerm && !filtroStatus && (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Fornecedor
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {fornecedores.map((fornecedor) => (
            <Card
              key={fornecedor.id}
              className={`p-4 ${
                fornecedor.status === "inativo" ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{fornecedor.nome}</h3>
                    <Badge
                      variant={fornecedor.status === "ativo" ? "default" : "secondary"}
                    >
                      {fornecedor.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {fornecedor.documento && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="h-4 w-4" />
                      <span>{formatDocumento(fornecedor.documento)}</span>
                      <button
                        onClick={() => copyToClipboard(fornecedor.documento, "Documento")}
                        className="hover:text-foreground"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {fornecedor.contato && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Phone className="h-4 w-4" />
                      <span>{fornecedor.contato}</span>
                    </div>
                  )}

                  {fornecedor.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Mail className="h-4 w-4" />
                      <span>{fornecedor.email}</span>
                    </div>
                  )}

                  {fornecedor._count?.contas > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <FileText className="h-4 w-4" />
                      <span>{fornecedor._count.contas} conta(s) vinculada(s)</span>
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleVerDetalhes(fornecedor)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(fornecedor)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(fornecedor)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {fornecedor._count?.contas > 0 ? "Inativar" : "Excluir"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <FornecedorModal
          fornecedor={fornecedorToEdit}
          onClose={() => {
            setShowModal(false)
            setFornecedorToEdit(null)
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Modal de Detalhes */}
      {showDetalhes && fornecedorDetalhes && (
        <FornecedorDetalhesModal
          fornecedor={fornecedorDetalhes}
          onClose={() => {
            setShowDetalhes(false)
            setFornecedorDetalhes(null)
          }}
        />
      )}
    </div>
  )
}
