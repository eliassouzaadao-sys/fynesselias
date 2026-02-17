"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { KpiCard } from "@/components/ui/kpi-card"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { BankSelector } from "@/components/bank/bank-selector"
import { BankAccountCard } from "@/components/bank/bank-account-card"
import { BANK_DATA } from "@/lib/bank-data"
import { formatCurrency } from "@/lib/format"
import { Plus, ArrowRight, ArrowLeft, Download } from "lucide-react"

const mockContas = [
  {
    id: "1",
    bankId: "banco-do-brasil",
    agencia: "1234-5",
    conta: "12345-6",
    tipo: "Conta Corrente",
    saldo: 45230.5,
    limiteCredito: 50000,
    limiteChequeEspecial: 15000,
    limiteContaGarantida: 100000,
    saldoInvestimentoLiquido: 25000,
    utilizadoChequeEspecial: 0,
  },
  {
    id: "2",
    bankId: "itau",
    agencia: "0987",
    conta: "98765-4",
    tipo: "Conta Corrente",
    saldo: 32150.0,
    limiteCredito: 80000,
    limiteChequeEspecial: 20000,
    limiteContaGarantida: 50000,
    saldoInvestimentoLiquido: 0,
    utilizadoChequeEspecial: 5000,
  },
  {
    id: "3",
    bankId: "bradesco",
    agencia: "4567",
    conta: "45678-9",
    tipo: "Conta Corrente",
    saldo: 18500.0,
    limiteCredito: 30000,
    limiteChequeEspecial: 10000,
    limiteContaGarantida: 0,
    saldoInvestimentoLiquido: 15000,
    utilizadoChequeEspecial: 0,
  },
  {
    id: "4",
    bankId: "nubank",
    agencia: "0001",
    conta: "789456-1",
    tipo: "Conta Digital",
    saldo: 8750.0,
    limiteCredito: 25000,
    limiteChequeEspecial: 0,
    limiteContaGarantida: 0,
    saldoInvestimentoLiquido: 0,
    utilizadoChequeEspecial: 0,
  },
  {
    id: "5",
    bankId: "caixa",
    agencia: "2468",
    conta: "00123456-7",
    tipo: "Conta Corrente",
    saldo: 15320.82,
    limiteCredito: 40000,
    limiteChequeEspecial: 8000,
    limiteContaGarantida: 75000,
    saldoInvestimentoLiquido: 30000,
    utilizadoChequeEspecial: 0,
  },
]

export function ContasBancariasContent() {
  const [contas, setContas] = useState(mockContas)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState(1)
  const [editingConta, setEditingConta] = useState(null)
  const [selectedBankId, setSelectedBankId] = useState("")
  const [formData, setFormData] = useState({
    agencia: "",
    conta: "",
    tipo: "Conta Corrente",
    saldo: "",
    limiteCredito: "",
    limiteChequeEspecial: "",
    limiteContaGarantida: "",
    saldoInvestimentoLiquido: "",
  })

  const saldoTotal = contas.reduce((acc, c) => acc + c.saldo, 0)
  const limiteTotal = contas.reduce((acc, c) => acc + c.limiteCredito, 0)
  const chequeEspecialTotal = contas.reduce((acc, c) => acc + c.limiteChequeEspecial, 0)
  const chequeEspecialUtilizado = contas.reduce((acc, c) => acc + c.utilizadoChequeEspecial, 0)

  function handleOpenModal(conta = null) {
    if (conta) {
      setEditingConta(conta)
      setSelectedBankId(conta.bankId)
      setFormData({
        agencia: conta.agencia,
        conta: conta.conta,
        tipo: conta.tipo,
        saldo: conta.saldo.toString(),
        limiteCredito: conta.limiteCredito.toString(),
        limiteChequeEspecial: conta.limiteChequeEspecial.toString(),
        limiteContaGarantida: (conta.limiteContaGarantida || 0).toString(),
        saldoInvestimentoLiquido: (conta.saldoInvestimentoLiquido || 0).toString(),
      })
      setModalStep(2)
    } else {
      setEditingConta(null)
      setSelectedBankId("")
      setFormData({
        agencia: "",
        conta: "",
        tipo: "Conta Corrente",
        saldo: "",
        limiteCredito: "",
        limiteChequeEspecial: "",
        limiteContaGarantida: "",
        saldoInvestimentoLiquido: "",
      })
      setModalStep(1)
    }
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setModalStep(1)
    setSelectedBankId("")
    setEditingConta(null)
  }

  function handleNextStep() {
    if (selectedBankId) {
      setModalStep(2)
    }
  }

  function handleSave() {
    const novaConta = {
      id: editingConta?.id || Date.now().toString(),
      bankId: selectedBankId,
      agencia: formData.agencia,
      conta: formData.conta,
      tipo: formData.tipo,
      saldo: Number.parseFloat(formData.saldo) || 0,
      limiteCredito: Number.parseFloat(formData.limiteCredito) || 0,
      limiteChequeEspecial: Number.parseFloat(formData.limiteChequeEspecial) || 0,
      limiteContaGarantida: Number.parseFloat(formData.limiteContaGarantida) || 0,
      saldoInvestimentoLiquido: Number.parseFloat(formData.saldoInvestimentoLiquido) || 0,
      utilizadoChequeEspecial: editingConta?.utilizadoChequeEspecial || 0,
    }

    if (editingConta) {
      setContas(contas.map((c) => (c.id === editingConta.id ? novaConta : c)))
    } else {
      setContas([...contas, novaConta])
    }
    handleCloseModal()
  }

  function handleDelete(id) {
    setContas(contas.filter((c) => c.id !== id))
  }

  const selectedBank = selectedBankId ? BANK_DATA[selectedBankId] : null

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contas Bancárias"
        description="Gerencie suas contas bancárias, saldos e limites de crédito"
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Download className="mr-1 h-3.5 w-3.5" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => handleOpenModal()}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Nova Conta
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Saldo Total"
          value={formatCurrency(saldoTotal)}
          trend={saldoTotal >= 0 ? "up" : "down"}
          trendValue={saldoTotal >= 0 ? "Positivo" : "Negativo"}
          variant={saldoTotal >= 0 ? "default" : "danger"}
        />
        <KpiCard label="Limite de Crédito" value={formatCurrency(limiteTotal)} subvalue="Total disponível em linhas" />
        <KpiCard
          label="Cheque Especial"
          value={formatCurrency(chequeEspecialTotal)}
          subvalue={`${formatCurrency(chequeEspecialUtilizado)} utilizado`}
          variant={chequeEspecialUtilizado > 0 ? "warning" : "default"}
        />
        <KpiCard label="Contas Ativas" value={contas.length.toString()} subvalue="Bancos cadastrados" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Suas Contas Bancárias</h2>
          <span className="text-xs text-muted-foreground">{contas.length} conta(s) cadastrada(s)</span>
        </div>

        {/* Lista de Contas */}
        <div className="grid grid-cols-2 gap-4">
          {contas.map((conta) => (
            <BankAccountCard key={conta.id} conta={conta} onEdit={handleOpenModal} onDelete={handleDelete} />
          ))}

          <button
            onClick={() => handleOpenModal()}
            className="group relative flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/50 p-6 min-h-[180px] transition-all duration-200 hover:border-primary hover:bg-muted"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-all duration-200 group-hover:bg-primary/20 group-hover:scale-110">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Nova Conta Bancária</p>
              <p className="text-xs text-muted-foreground mt-0.5">Clique para adicionar</p>
            </div>
          </button>
        </div>
      </div>

      {/* Modal - Step 1: Selecionar Banco */}
      <Modal
        isOpen={isModalOpen && modalStep === 1}
        onClose={handleCloseModal}
        title="Selecione o Banco"
        size="lg"
        variant="light"
      >
        <div className="space-y-4">
          <BankSelector selectedBank={selectedBankId} onSelect={setSelectedBankId} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" size="sm" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleNextStep} disabled={!selectedBankId}>
              Continuar
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal - Step 2: Detalhes da Conta */}
      <Modal
        isOpen={isModalOpen && modalStep === 2}
        onClose={handleCloseModal}
        title={editingConta ? `Editar Conta - ${selectedBank?.name}` : `Nova Conta - ${selectedBank?.name}`}
        size="lg"
        variant="light"
      >
        <div className="space-y-4">
          {/* Preview do card do banco */}
          {selectedBank && (
            <div className="rounded-xl p-4 mb-4" style={{ background: selectedBank.cardBg }}>
              <p
                className="text-sm font-medium"
                style={{
                  color: ["banco-do-brasil", "neon", "pan"].includes(selectedBankId)
                    ? selectedBank.textColor
                    : "#FFFFFF",
                }}
              >
                Preview do card da conta
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Agência</label>
              <input
                type="text"
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                placeholder="0000-0"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Conta</label>
              <input
                type="text"
                value={formData.conta}
                onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                placeholder="00000-0"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Conta</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Conta Corrente">Conta Corrente</option>
              <option value="Conta Digital">Conta Digital</option>
              <option value="Conta Poupança">Conta Poupança</option>
              <option value="Conta Investimento">Conta Investimento</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Saldo Atual</label>
            <input
              type="number"
              value={formData.saldo}
              onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
              placeholder="0,00"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Limite de Crédito</label>
              <input
                type="number"
                value={formData.limiteCredito}
                onChange={(e) => setFormData({ ...formData, limiteCredito: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Limite Cheque Especial</label>
              <input
                type="number"
                value={formData.limiteChequeEspecial}
                onChange={(e) => setFormData({ ...formData, limiteChequeEspecial: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Conta Garantida/Rotativo</label>
              <input
                type="number"
                value={formData.limiteContaGarantida}
                onChange={(e) => setFormData({ ...formData, limiteContaGarantida: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Investimento Resgate Automático</label>
              <input
                type="number"
                value={formData.saldoInvestimentoLiquido}
                onChange={(e) => setFormData({ ...formData, saldoInvestimentoLiquido: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" size="sm" onClick={() => setModalStep(1)}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Voltar
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!formData.agencia || !formData.conta}>
                {editingConta ? "Salvar Alterações" : "Adicionar Conta"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
