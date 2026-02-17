"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, User, Briefcase } from "lucide-react"

interface NovoFuncionarioModalProps {
  funcionario?: {
    id: number
    nome: string
    cpf: string
    cargo: string | null
    dataAdmissao: string
    salarioBruto: number
    valeTransporte: number
    valeRefeicao: number
    planoSaude: number
    outrosBeneficios: number
    inss: number
    irrf: number
    fgts: number
  } | null
  onClose: () => void
  onSuccess: () => void
}

export function NovoFuncionarioModal({ funcionario, onClose, onSuccess }: NovoFuncionarioModalProps) {
  const isEditing = !!funcionario

  const [nome, setNome] = useState(funcionario?.nome || "")
  const [cpf, setCpf] = useState(funcionario?.cpf || "")
  const [cargo, setCargo] = useState(funcionario?.cargo || "")
  const [dataAdmissao, setDataAdmissao] = useState(
    funcionario?.dataAdmissao
      ? new Date(funcionario.dataAdmissao).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [salarioBruto, setSalarioBruto] = useState(funcionario?.salarioBruto || 0)
  const [valeTransporte, setValeTransporte] = useState(funcionario?.valeTransporte || 0)
  const [valeRefeicao, setValeRefeicao] = useState(funcionario?.valeRefeicao || 0)
  const [planoSaude, setPlanoSaude] = useState(funcionario?.planoSaude || 0)
  const [outrosBeneficios, setOutrosBeneficios] = useState(funcionario?.outrosBeneficios || 0)
  const [inss, setInss] = useState(funcionario?.inss || 0)
  const [irrf, setIrrf] = useState(funcionario?.irrf || 0)
  const [fgts, setFgts] = useState(funcionario?.fgts || 0)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11)
    let formatted = cleaned
    if (cleaned.length > 3) {
      formatted = cleaned.slice(0, 3) + "." + cleaned.slice(3)
    }
    if (cleaned.length > 6) {
      formatted = cleaned.slice(0, 3) + "." + cleaned.slice(3, 6) + "." + cleaned.slice(6)
    }
    if (cleaned.length > 9) {
      formatted = cleaned.slice(0, 3) + "." + cleaned.slice(3, 6) + "." + cleaned.slice(6, 9) + "-" + cleaned.slice(9)
    }
    return formatted
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nome.trim()) {
      setError("Nome do funcionário é obrigatório")
      return
    }

    const cpfClean = cpf.replace(/\D/g, "")
    if (!cpfClean || cpfClean.length !== 11) {
      setError("CPF deve ter 11 dígitos")
      return
    }

    if (!salarioBruto || salarioBruto <= 0) {
      setError("Informe o salário bruto")
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        id: funcionario?.id,
        nome: nome.trim(),
        cpf: cpfClean,
        cargo: cargo.trim() || null,
        dataAdmissao,
        salarioBruto,
        valeTransporte,
        valeRefeicao,
        planoSaude,
        outrosBeneficios,
        inss,
        irrf,
        fgts,
      }

      const response = await fetch("/api/funcionarios", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar funcionário")
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || "Erro ao salvar funcionário")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-orange-600" />
            {isEditing ? "Editar Funcionário" : "Novo Funcionário"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] px-6">
            <div className="space-y-6 pb-4">
              {/* Seção: Dados Pessoais */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Dados Pessoais</span>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: Maria Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      disabled={isSaving}
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      placeholder="Ex: Analista"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="dataAdmissao">Data de Admissão</Label>
                    <Input
                      id="dataAdmissao"
                      type="date"
                      value={dataAdmissao}
                      onChange={(e) => setDataAdmissao(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Remuneração */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Remuneração</span>
                  <Separator className="flex-1" />
                </div>

                <div>
                  <Label htmlFor="salarioBruto">Salário Bruto Mensal *</Label>
                  <CurrencyInput
                    value={salarioBruto}
                    onValueChange={setSalarioBruto}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Seção: Benefícios */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Benefícios</span>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="valeTransporte">Vale Transporte</Label>
                    <CurrencyInput
                      value={valeTransporte}
                      onValueChange={setValeTransporte}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="valeRefeicao">Vale Refeição</Label>
                    <CurrencyInput
                      value={valeRefeicao}
                      onValueChange={setValeRefeicao}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="planoSaude">Plano de Saúde</Label>
                    <CurrencyInput
                      value={planoSaude}
                      onValueChange={setPlanoSaude}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="outrosBeneficios">Outros Benefícios</Label>
                    <CurrencyInput
                      value={outrosBeneficios}
                      onValueChange={setOutrosBeneficios}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Encargos (Manual) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Encargos (valores mensais)</span>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="inss">INSS</Label>
                    <CurrencyInput
                      value={inss}
                      onValueChange={setInss}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="irrf">IRRF</Label>
                    <CurrencyInput
                      value={irrf}
                      onValueChange={setIrrf}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fgts">FGTS</Label>
                    <CurrencyInput
                      value={fgts}
                      onValueChange={setFgts}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-muted-foreground mt-1">8% do salário bruto</p>
                  </div>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar Alterações"
              ) : (
                "Criar Funcionário"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
