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
  Users,
} from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [pessoas, setPessoas] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState("")
  const [tipoAtivo, setTipoAtivo] = useState("fornecedor") // 'fornecedor' ou 'cliente'
  const [showModal, setShowModal] = useState(false)
  const [pessoaToEdit, setPessoaToEdit] = useState(null)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [pessoaDetalhes, setPessoaDetalhes] = useState(null)

  // Labels dinamicos baseados no tipo
  const labels = {
    fornecedor: {
      singular: "Fornecedor",
      plural: "Fornecedores",
      novo: "Novo Fornecedor",
      documento: "CNPJ/CPF",
      icon: Truck,
    },
    cliente: {
      singular: "Cliente",
      plural: "Clientes",
      novo: "Novo Cliente",
      documento: "CPF/CNPJ",
      icon: Users,
    },
  }
  const label = labels[tipoAtivo]
  const IconeTipo = label.icon

  const loadPessoas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set("tipo", tipoAtivo)
      if (filtroStatus) params.set("status", filtroStatus)
      if (searchTerm) params.set("search", searchTerm)

      const res = await fetch(`/api/fornecedores?${params.toString()}`)
      const data = await res.json()
      setPessoas(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Failed to load:", e)
      setPessoas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPessoas()
  }, [filtroStatus, tipoAtivo])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPessoas()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSuccess = () => {
    loadPessoas()
    setShowModal(false)
    setPessoaToEdit(null)
  }

  const handleEdit = (pessoa) => {
    setPessoaToEdit(pessoa)
    setShowModal(true)
  }

  const handleVerDetalhes = async (pessoa) => {
    try {
      const res = await fetch(`/api/fornecedores/${pessoa.id}`)
      const data = await res.json()
      setPessoaDetalhes(data)
      setShowDetalhes(true)
    } catch (e) {
      console.error("Erro ao carregar detalhes:", e)
      toast.error(`Erro ao carregar detalhes do ${label.singular.toLowerCase()}`)
    }
  }

  const handleDelete = async (pessoa) => {
    if (!confirm(`Deseja realmente excluir ${label.singular.toLowerCase()} "${pessoa.nome}"?`)) {
      return
    }

    try {
      const res = await fetch("/api/fornecedores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pessoa.id }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.inativado) {
          toast.success(`${label.singular} inativado (possui contas vinculadas)`)
        } else {
          toast.success(`${label.singular} excluido com sucesso`)
        }
        loadPessoas()
      } else {
        toast.error(data.error || `Erro ao excluir ${label.singular.toLowerCase()}`)
      }
    } catch (e) {
      console.error("Erro ao excluir:", e)
      toast.error(`Erro ao excluir ${label.singular.toLowerCase()}`)
    }
  }

  const copyToClipboard = (text, labelText) => {
    navigator.clipboard.writeText(text)
    toast.success(`${labelText} copiado!`)
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
          <IconeTipo className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{label.plural}</h1>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {label.novo}
        </Button>
      </div>

      {/* Tabs de Tipo */}
      <Tabs value={tipoAtivo} onValueChange={setTipoAtivo} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="fornecedor" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
          <TabsTrigger value="cliente" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar por nome ou ${label.documento}...`}
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
              <IconeTipo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{pessoas.length}</p>
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
                {pessoas.filter((f) => f.status === "ativo").length}
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
                {pessoas.filter((f) => f.status === "inativo").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : pessoas.length === 0 ? (
        <Card className="p-12 text-center">
          <IconeTipo className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum {label.singular.toLowerCase()} encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filtroStatus
              ? "Tente ajustar os filtros de busca"
              : `Comece cadastrando seu primeiro ${label.singular.toLowerCase()}`}
          </p>
          {!searchTerm && !filtroStatus && (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar {label.singular}
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pessoas.map((pessoa) => (
            <Card
              key={pessoa.id}
              className={`p-4 ${
                pessoa.status === "inativo" ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg truncate">{pessoa.nome}</h3>
                    <Badge
                      variant={pessoa.status === "ativo" ? "default" : "secondary"}
                      className="flex-shrink-0"
                    >
                      {pessoa.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {pessoa.documento && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{formatDocumento(pessoa.documento)}</span>
                      <button
                        onClick={() => copyToClipboard(pessoa.documento, "Documento")}
                        className="hover:text-foreground flex-shrink-0"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {pessoa.contato && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{pessoa.contato}</span>
                    </div>
                  )}

                  {pessoa.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{pessoa.email}</span>
                    </div>
                  )}

                  {pessoa._count?.contas > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span>{pessoa._count.contas} conta(s) vinculada(s)</span>
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleVerDetalhes(pessoa)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(pessoa)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(pessoa)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {pessoa._count?.contas > 0 ? "Inativar" : "Excluir"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edicao */}
      {showModal && (
        <FornecedorModal
          pessoa={pessoaToEdit}
          tipo={tipoAtivo}
          onClose={() => {
            setShowModal(false)
            setPessoaToEdit(null)
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Modal de Detalhes */}
      {showDetalhes && pessoaDetalhes && (
        <FornecedorDetalhesModal
          pessoa={pessoaDetalhes}
          tipo={tipoAtivo}
          onClose={() => {
            setShowDetalhes(false)
            setPessoaDetalhes(null)
          }}
        />
      )}
    </div>
  )
}
