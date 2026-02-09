"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Truck, Users } from "lucide-react"
import { toast } from "sonner"

export function FornecedorModal({ pessoa, tipo = "fornecedor", onClose, onSuccess }) {
  const isEditing = !!pessoa

  // Labels dinâmicos baseados no tipo
  const labels = {
    fornecedor: {
      singular: "Fornecedor",
      novo: "Novo Fornecedor",
      editar: "Editar Fornecedor",
      placeholder: "Nome do fornecedor",
      documento: "CNPJ",
      docPlaceholder: "00.000.000/0000-00",
      icon: Truck,
    },
    cliente: {
      singular: "Cliente",
      novo: "Novo Cliente",
      editar: "Editar Cliente",
      placeholder: "Nome do cliente",
      documento: "CPF/CNPJ",
      docPlaceholder: "000.000.000-00 ou 00.000.000/0000-00",
      icon: Users,
    },
  }
  const label = labels[tipo] || labels.fornecedor
  const IconeTipo = label.icon

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    documento: "",
    contato: "",
    email: "",
    chavePix: "",
  })

  useEffect(() => {
    if (pessoa) {
      setFormData({
        nome: pessoa.nome || "",
        documento: pessoa.documento || "",
        contato: pessoa.contato || "",
        email: pessoa.email || "",
        chavePix: pessoa.chavePix || "",
      })
    }
  }, [pessoa])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formatTelefone = (value) => {
    const clean = value.replace(/\D/g, "")
    if (clean.length <= 10) {
      return clean
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
    }
    return clean
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
  }

  const formatCNPJ = (value) => {
    const clean = value.replace(/\D/g, "").slice(0, 14)
    return clean
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    setLoading(true)

    try {
      const payload = {
        nome: formData.nome,
        documento: formData.documento || null,
        email: formData.email || null,
        contato: formData.contato.replace(/\D/g, "") || null,
        chavePix: formData.chavePix || null,
        status: pessoa?.status || "ativo",
        tipo: tipo,
      }

      if (isEditing) {
        payload.id = pessoa.id
      }

      const res = await fetch("/api/fornecedores", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(isEditing ? `${label.singular} atualizado!` : `${label.singular} cadastrado!`)
        onSuccess()
      } else {
        toast.error(data.error || `Erro ao salvar ${label.singular.toLowerCase()}`)
      }
    } catch (error) {
      console.error("Erro:", error)
      toast.error(`Erro ao salvar ${label.singular.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <IconeTipo className="h-5 w-5" />
            {isEditing ? label.editar : label.novo}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[50vh] px-6">
            <div className="space-y-4 pb-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  placeholder={label.placeholder}
                />
              </div>

              <div>
                <Label htmlFor="documento">{label.documento}</Label>
                <Input
                  id="documento"
                  value={formatCNPJ(formData.documento)}
                  onChange={(e) => handleChange("documento", e.target.value.replace(/\D/g, ""))}
                  placeholder={label.docPlaceholder}
                  maxLength={18}
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="contato">Telefone</Label>
                <Input
                  id="contato"
                  value={formatTelefone(formData.contato)}
                  onChange={(e) => handleChange("contato", e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div>
                <Label htmlFor="chavePix">Chave Pix</Label>
                <Input
                  id="chavePix"
                  value={formData.chavePix}
                  onChange={(e) => handleChange("chavePix", e.target.value)}
                  placeholder="Informe a chave Pix"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
