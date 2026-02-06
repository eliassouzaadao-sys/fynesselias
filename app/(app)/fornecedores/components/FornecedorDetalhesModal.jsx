"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  Truck,
  Phone,
  Mail,
  Building2,
  MapPin,
  Landmark,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  Copy,
} from "lucide-react"
import { toast } from "sonner"

export function FornecedorDetalhesModal({ fornecedor, onClose }) {
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

  const stats = fornecedor.estatisticas || {
    totalContas: 0,
    valorTotal: 0,
    contasPagas: 0,
    valorPago: 0,
    contasPendentes: 0,
    valorPendente: 0,
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Detalhes do Fornecedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabecalho */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{fornecedor.nome}</h2>
              {fornecedor.documento && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
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
            </div>
            <Badge variant={fornecedor.status === "ativo" ? "default" : "secondary"}>
              {fornecedor.status === "ativo" ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          {/* Estatisticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Contas</p>
                  <p className="text-xl font-bold">{stats.totalContas}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(stats.valorTotal)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagas</p>
                  <p className="text-xl font-bold">{stats.contasPagas}</p>
                  <p className="text-sm text-green-600">
                    {formatCurrency(stats.valorPago)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-xl font-bold">{stats.contasPendentes}</p>
                  <p className="text-sm text-yellow-600">
                    {formatCurrency(stats.valorPendente)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="info">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informacoes</TabsTrigger>
              <TabsTrigger value="contas">
                Contas ({fornecedor.contas?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              {/* Contato */}
              {(fornecedor.contato || fornecedor.email) && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contato
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {fornecedor.contato && (
                      <div>
                        <span className="text-muted-foreground">Telefone:</span>{" "}
                        {fornecedor.contato}
                      </div>
                    )}
                    {fornecedor.email && (
                      <div>
                        <span className="text-muted-foreground">E-mail:</span>{" "}
                        {fornecedor.email}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Endereco */}
              {(fornecedor.endereco || fornecedor.cidade) && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereco
                  </h4>
                  <div className="text-sm space-y-1">
                    {fornecedor.endereco && <p>{fornecedor.endereco}</p>}
                    <p>
                      {[fornecedor.cidade, fornecedor.estado, fornecedor.cep]
                        .filter(Boolean)
                        .join(" - ")}
                    </p>
                  </div>
                </Card>
              )}

              {/* Dados Bancarios */}
              {(fornecedor.banco || fornecedor.chavePix) && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    Dados Bancarios
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {fornecedor.banco && (
                      <div>
                        <span className="text-muted-foreground">Banco:</span>{" "}
                        {fornecedor.banco}
                      </div>
                    )}
                    {fornecedor.agencia && (
                      <div>
                        <span className="text-muted-foreground">Agencia:</span>{" "}
                        {fornecedor.agencia}
                      </div>
                    )}
                    {fornecedor.contaBancaria && (
                      <div>
                        <span className="text-muted-foreground">Conta:</span>{" "}
                        {fornecedor.contaBancaria}
                      </div>
                    )}
                    {fornecedor.tipoConta && (
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>{" "}
                        {fornecedor.tipoConta === "corrente"
                          ? "Conta Corrente"
                          : fornecedor.tipoConta === "poupanca"
                          ? "Poupanca"
                          : "Conta Pagamento"}
                      </div>
                    )}
                    {fornecedor.chavePix && (
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <span className="text-muted-foreground">Chave Pix:</span>{" "}
                        <span>{fornecedor.chavePix}</span>
                        <button
                          onClick={() => copyToClipboard(fornecedor.chavePix, "Chave Pix")}
                          className="hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Observacoes */}
              {fornecedor.observacoes && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Observacoes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {fornecedor.observacoes}
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="contas" className="mt-4">
              {!fornecedor.contas || fornecedor.contas.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma conta vinculada a este fornecedor
                  </p>
                </Card>
              ) : (
                <ScrollArea className="max-h-[300px] pr-4">
                  <div className="space-y-2">
                    {fornecedor.contas.map((conta) => (
                      <Card key={conta.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{conta.descricao}</span>
                              <Badge
                                variant={
                                  conta.pago
                                    ? "default"
                                    : new Date(conta.vencimento) < new Date()
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {conta.pago
                                  ? "Pago"
                                  : new Date(conta.vencimento) < new Date()
                                  ? "Vencida"
                                  : "Pendente"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Vencimento: {formatDate(conta.vencimento)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(conta.valor)}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
