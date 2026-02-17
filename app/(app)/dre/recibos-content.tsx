"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/format"
import {
  Loader2,
  FileText,
  Download,
  Printer,
  Users,
  Briefcase,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
} from "lucide-react"

interface Socio {
  id: number
  nome: string
  cpfSocio: string | null
  sigla: string
}

interface Funcionario {
  id: number
  nome: string
  cpf: string
  cargo: string | null
}

interface HistoricoProLabore {
  id: number | string
  mesReferencia: number
  anoReferencia: number
  socioId: number
  socioNome: string
  socioCpf: string | null
  proLaboreBase: number
  totalDescontos: number
  proLaboreLiquido: number
  descontosPrevistos: number
  descontosReais: number
  descontosPrevistosJson: string | null
  descontosReaisJson: string | null
  pago: boolean
  dataPagamento: string | null
  isTempoReal?: boolean
}

interface HistoricoFolha {
  id: number | string
  mesReferencia: number
  anoReferencia: number
  funcionarioId: number
  funcionarioNome: string
  funcionarioCpf: string
  salarioBruto: number
  inss: number
  irrf: number
  fgts: number
  valeTransporte: number
  valeRefeicao: number
  planoSaude: number
  outrosDescontos: number
  salarioLiquido: number
  custoEmpresa: number
  pago: boolean
  dataPagamento: string | null
  isTempoReal?: boolean
}

const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

function formatCPF(cpf: string | null) {
  if (!cpf) return "-"
  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length !== 11) return cpf
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
}

function extensoPorExtenso(valor: number): string {
  const unidades = ['', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
  const dezADezenove = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

  function converterGrupo(n: number): string {
    if (n === 0) return ''
    if (n === 100) return 'cem'

    let resultado = ''

    if (n >= 100) {
      resultado += centenas[Math.floor(n / 100)]
      n %= 100
      if (n > 0) resultado += ' e '
    }

    if (n >= 20) {
      resultado += dezenas[Math.floor(n / 10)]
      n %= 10
      if (n > 0) resultado += ' e '
    } else if (n >= 10) {
      resultado += dezADezenove[n - 10]
      return resultado
    }

    if (n > 0) {
      resultado += unidades[n]
    }

    return resultado
  }

  const inteiro = Math.floor(valor)
  const centavos = Math.round((valor - inteiro) * 100)

  let resultado = ''

  if (inteiro === 0) {
    resultado = 'zero reais'
  } else if (inteiro === 1) {
    resultado = 'um real'
  } else if (inteiro >= 1000000) {
    const milhoes = Math.floor(inteiro / 1000000)
    const resto = inteiro % 1000000
    resultado = milhoes === 1 ? 'um milhao' : converterGrupo(milhoes) + ' milhoes'
    if (resto > 0) {
      const milhares = Math.floor(resto / 1000)
      const unidadesMil = resto % 1000
      if (milhares > 0) {
        resultado += milhares === 1 ? ' e um mil' : ' ' + converterGrupo(milhares) + ' mil'
      }
      if (unidadesMil > 0) {
        resultado += ' e ' + converterGrupo(unidadesMil)
      }
    }
    resultado += ' reais'
  } else if (inteiro >= 1000) {
    const milhares = Math.floor(inteiro / 1000)
    const resto = inteiro % 1000
    resultado = milhares === 1 ? 'um mil' : converterGrupo(milhares) + ' mil'
    if (resto > 0) {
      resultado += (resto < 100 ? ' e ' : ' ') + converterGrupo(resto)
    }
    resultado += ' reais'
  } else {
    resultado = converterGrupo(inteiro) + ' reais'
  }

  if (centavos > 0) {
    resultado += centavos === 1 ? ' e um centavo' : ' e ' + converterGrupo(centavos) + ' centavos'
  }

  return resultado.charAt(0).toUpperCase() + resultado.slice(1)
}

// Componente de Recibo de Pro-labore
function ReciboProLabore({ registro, empresa }: { registro: HistoricoProLabore; empresa: string }) {
  const reciboRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = reciboRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        .recibo { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { font-size: 14px; color: #666; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px; background: #f5f5f5; }
        .info-item { flex: 1; }
        .info-item label { font-size: 12px; color: #666; display: block; }
        .info-item span { font-size: 16px; font-weight: bold; }
        .valores { margin: 20px 0; }
        .valores table { width: 100%; border-collapse: collapse; }
        .valores th, .valores td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .valores th { background: #f0f0f0; font-size: 14px; }
        .valores .total { background: #e8f5e9; font-weight: bold; }
        .valores .desconto { color: #d32f2f; }
        .extenso { margin: 20px 0; padding: 15px; background: #fff3e0; border-left: 4px solid #ff9800; }
        .extenso label { font-size: 12px; color: #666; }
        .extenso p { font-size: 14px; font-style: italic; }
        .assinatura { margin-top: 60px; display: flex; justify-content: space-between; }
        .assinatura-item { text-align: center; width: 45%; }
        .assinatura-item .linha { border-top: 1px solid #333; padding-top: 10px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        @media print { body { padding: 20px; } .recibo { border: 1px solid #333; } }
      </style>
    `

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo de Pro-labore - ${registro.socioNome}</title>
          ${styles}
        </head>
        <body>
          <div class="recibo">
            <div class="header">
              <h1>RECIBO DE PRO-LABORE</h1>
              <p>${empresa}</p>
            </div>

            <div class="info-row">
              <div class="info-item">
                <label>Beneficiario</label>
                <span>${registro.socioNome}</span>
              </div>
              <div class="info-item">
                <label>CPF</label>
                <span>${formatCPF(registro.socioCpf)}</span>
              </div>
              <div class="info-item">
                <label>Competencia</label>
                <span>${MESES[registro.mesReferencia - 1]}/${registro.anoReferencia}</span>
              </div>
            </div>

            <div class="valores">
              <table>
                <thead>
                  <tr>
                    <th>Descricao</th>
                    <th style="text-align: right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Pro-labore Bruto</td>
                    <td style="text-align: right">${formatCurrency(registro.proLaboreBase)}</td>
                  </tr>
                  <tr class="desconto">
                    <td>Descontos Previstos (INSS, etc.)</td>
                    <td style="text-align: right">- ${formatCurrency(registro.descontosPrevistos)}</td>
                  </tr>
                  <tr class="desconto">
                    <td>Descontos Reais (Cartao/Outros)</td>
                    <td style="text-align: right">- ${formatCurrency(registro.descontosReais)}</td>
                  </tr>
                  <tr class="total">
                    <td>PRO-LABORE LIQUIDO</td>
                    <td style="text-align: right">${formatCurrency(registro.proLaboreLiquido)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="extenso">
              <label>Valor por extenso:</label>
              <p>${extensoPorExtenso(registro.proLaboreLiquido)}</p>
            </div>

            <p style="margin: 20px 0; text-align: justify; font-size: 14px;">
              Recebi da empresa ${empresa} a importancia liquida acima discriminada,
              referente ao pro-labore do mes de ${MESES[registro.mesReferencia - 1]} de ${registro.anoReferencia}.
            </p>

            <div class="assinatura">
              <div class="assinatura-item">
                <div class="linha">
                  <p>Local e Data</p>
                </div>
              </div>
              <div class="assinatura-item">
                <div class="linha">
                  <p>${registro.socioNome}</p>
                  <p style="font-size: 12px; color: #666;">CPF: ${formatCPF(registro.socioCpf)}</p>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  return (
    <Card className="p-6" ref={reciboRef}>
      {/* Cabecalho */}
      <div className="text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold text-foreground">RECIBO DE PRO-LABORE</h2>
        <p className="text-sm text-muted-foreground">{empresa}</p>
      </div>

      {/* Informacoes */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg mb-4">
        <div>
          <Label className="text-xs text-muted-foreground">Beneficiario</Label>
          <p className="font-semibold text-foreground">{registro.socioNome}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">CPF</Label>
          <p className="font-semibold text-foreground">{formatCPF(registro.socioCpf)}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Competencia</Label>
          <p className="font-semibold text-foreground">
            {MESES[registro.mesReferencia - 1]}/{registro.anoReferencia}
          </p>
        </div>
      </div>

      {/* Valores */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
          <span className="text-sm">Pro-labore Bruto</span>
          <span className="font-semibold text-green-700 dark:text-green-400">
            {formatCurrency(registro.proLaboreBase)}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
          <span className="text-sm text-red-700 dark:text-red-400">Descontos Previstos</span>
          <span className="font-semibold text-red-700 dark:text-red-400">
            - {formatCurrency(registro.descontosPrevistos)}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
          <span className="text-sm text-red-700 dark:text-red-400">Descontos Reais</span>
          <span className="font-semibold text-red-700 dark:text-red-400">
            - {formatCurrency(registro.descontosReais)}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between items-center p-3 bg-primary/10 rounded">
          <span className="font-semibold">PRO-LABORE LIQUIDO</span>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(registro.proLaboreLiquido)}
          </span>
        </div>
      </div>

      {/* Valor por extenso */}
      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded mb-4">
        <Label className="text-xs text-muted-foreground">Valor por extenso:</Label>
        <p className="text-sm italic text-foreground">{extensoPorExtenso(registro.proLaboreLiquido)}</p>
      </div>

      {/* Status e Acoes */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          {registro.pago ? (
            <span className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 dark:bg-green-800/50 dark:text-green-300 rounded-full">
              <CheckCircle className="h-4 w-4" />
              Pago {registro.dataPagamento && `em ${new Date(registro.dataPagamento).toLocaleDateString('pt-BR')}`}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 text-sm bg-yellow-100 text-yellow-700 dark:bg-yellow-800/50 dark:text-yellow-300 rounded-full">
              <Clock className="h-4 w-4" />
              Pendente
            </span>
          )}
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir Recibo
        </Button>
      </div>
    </Card>
  )
}

// Componente de Holerite
function Holerite({ registro, empresa }: { registro: HistoricoFolha; empresa: string }) {
  const holeriteRef = useRef<HTMLDivElement>(null)

  const totalDescontos = registro.inss + registro.irrf + registro.valeTransporte + registro.outrosDescontos
  const totalBeneficios = registro.valeRefeicao + registro.planoSaude

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        .holerite { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { font-size: 14px; color: #666; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; padding: 10px; background: #f5f5f5; }
        .info-item { flex: 1; }
        .info-item label { font-size: 12px; color: #666; display: block; }
        .info-item span { font-size: 14px; font-weight: bold; }
        .section { margin: 20px 0; }
        .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; padding: 5px; background: #e0e0e0; }
        .valores table { width: 100%; border-collapse: collapse; }
        .valores th, .valores td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 13px; }
        .valores th { background: #f5f5f5; }
        .proventos { color: #2e7d32; }
        .descontos { color: #c62828; }
        .totais { margin-top: 20px; display: flex; justify-content: space-between; }
        .total-box { padding: 15px; border: 1px solid #ddd; width: 32%; text-align: center; }
        .total-box label { font-size: 11px; color: #666; display: block; }
        .total-box span { font-size: 18px; font-weight: bold; }
        .total-box.liquido { background: #e3f2fd; border-color: #1976d2; }
        .total-box.liquido span { color: #1976d2; }
        .extenso { margin: 20px 0; padding: 15px; background: #fff3e0; border-left: 4px solid #ff9800; }
        .assinatura { margin-top: 50px; display: flex; justify-content: space-between; }
        .assinatura-item { text-align: center; width: 45%; }
        .assinatura-item .linha { border-top: 1px solid #333; padding-top: 10px; }
        .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
        @media print { body { padding: 20px; } }
      </style>
    `

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Holerite - ${registro.funcionarioNome}</title>
          ${styles}
        </head>
        <body>
          <div class="holerite">
            <div class="header">
              <h1>HOLERITE / DEMONSTRATIVO DE PAGAMENTO</h1>
              <p>${empresa}</p>
            </div>

            <div class="info-row">
              <div class="info-item">
                <label>Funcionario</label>
                <span>${registro.funcionarioNome}</span>
              </div>
              <div class="info-item">
                <label>CPF</label>
                <span>${formatCPF(registro.funcionarioCpf)}</span>
              </div>
              <div class="info-item">
                <label>Competencia</label>
                <span>${MESES[registro.mesReferencia - 1]}/${registro.anoReferencia}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">PROVENTOS</div>
              <div class="valores">
                <table>
                  <tr class="proventos">
                    <td>Salario Base</td>
                    <td style="text-align: right">${formatCurrency(registro.salarioBruto)}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div class="section">
              <div class="section-title">DESCONTOS</div>
              <div class="valores">
                <table>
                  <tr class="descontos">
                    <td>INSS</td>
                    <td style="text-align: right">- ${formatCurrency(registro.inss)}</td>
                  </tr>
                  <tr class="descontos">
                    <td>IRRF</td>
                    <td style="text-align: right">- ${formatCurrency(registro.irrf)}</td>
                  </tr>
                  <tr class="descontos">
                    <td>Vale Transporte</td>
                    <td style="text-align: right">- ${formatCurrency(registro.valeTransporte)}</td>
                  </tr>
                  ${registro.outrosDescontos > 0 ? `
                  <tr class="descontos">
                    <td>Outros Descontos</td>
                    <td style="text-align: right">- ${formatCurrency(registro.outrosDescontos)}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </div>

            <div class="section">
              <div class="section-title">BENEFICIOS</div>
              <div class="valores">
                <table>
                  <tr>
                    <td>Vale Refeicao</td>
                    <td style="text-align: right">${formatCurrency(registro.valeRefeicao)}</td>
                  </tr>
                  <tr>
                    <td>Plano de Saude</td>
                    <td style="text-align: right">${formatCurrency(registro.planoSaude)}</td>
                  </tr>
                  <tr>
                    <td>FGTS (Depositado)</td>
                    <td style="text-align: right">${formatCurrency(registro.fgts)}</td>
                  </tr>
                </table>
              </div>
            </div>

            <div class="totais">
              <div class="total-box">
                <label>Total Proventos</label>
                <span style="color: #2e7d32">${formatCurrency(registro.salarioBruto)}</span>
              </div>
              <div class="total-box">
                <label>Total Descontos</label>
                <span style="color: #c62828">${formatCurrency(totalDescontos)}</span>
              </div>
              <div class="total-box liquido">
                <label>Salario Liquido</label>
                <span>${formatCurrency(registro.salarioLiquido)}</span>
              </div>
            </div>

            <div class="extenso">
              <label style="font-size: 11px; color: #666;">Valor liquido por extenso:</label>
              <p style="font-size: 13px; font-style: italic;">${extensoPorExtenso(registro.salarioLiquido)}</p>
            </div>

            <div class="assinatura">
              <div class="assinatura-item">
                <div class="linha">
                  <p>Empregador</p>
                  <p style="font-size: 11px; color: #666;">${empresa}</p>
                </div>
              </div>
              <div class="assinatura-item">
                <div class="linha">
                  <p>${registro.funcionarioNome}</p>
                  <p style="font-size: 11px; color: #666;">CPF: ${formatCPF(registro.funcionarioCpf)}</p>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  return (
    <Card className="p-6" ref={holeriteRef}>
      {/* Cabecalho */}
      <div className="text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-bold text-foreground">HOLERITE</h2>
        <p className="text-sm text-muted-foreground">{empresa}</p>
      </div>

      {/* Informacoes */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg mb-4">
        <div>
          <Label className="text-xs text-muted-foreground">Funcionario</Label>
          <p className="font-semibold text-foreground">{registro.funcionarioNome}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">CPF</Label>
          <p className="font-semibold text-foreground">{formatCPF(registro.funcionarioCpf)}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Competencia</Label>
          <p className="font-semibold text-foreground">
            {MESES[registro.mesReferencia - 1]}/{registro.anoReferencia}
          </p>
        </div>
      </div>

      {/* Proventos */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 p-2 bg-green-100 dark:bg-green-900/30 rounded">
          PROVENTOS
        </h3>
        <div className="flex justify-between items-center p-2">
          <span className="text-sm">Salario Base</span>
          <span className="font-semibold text-green-700 dark:text-green-400">
            {formatCurrency(registro.salarioBruto)}
          </span>
        </div>
      </div>

      {/* Descontos */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 p-2 bg-red-100 dark:bg-red-900/30 rounded">
          DESCONTOS
        </h3>
        <div className="space-y-1">
          <div className="flex justify-between items-center p-2">
            <span className="text-sm">INSS</span>
            <span className="text-sm text-red-700 dark:text-red-400">
              - {formatCurrency(registro.inss)}
            </span>
          </div>
          <div className="flex justify-between items-center p-2">
            <span className="text-sm">IRRF</span>
            <span className="text-sm text-red-700 dark:text-red-400">
              - {formatCurrency(registro.irrf)}
            </span>
          </div>
          <div className="flex justify-between items-center p-2">
            <span className="text-sm">Vale Transporte</span>
            <span className="text-sm text-red-700 dark:text-red-400">
              - {formatCurrency(registro.valeTransporte)}
            </span>
          </div>
          {registro.outrosDescontos > 0 && (
            <div className="flex justify-between items-center p-2">
              <span className="text-sm">Outros Descontos</span>
              <span className="text-sm text-red-700 dark:text-red-400">
                - {formatCurrency(registro.outrosDescontos)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Beneficios */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
          BENEFICIOS / ENCARGOS
        </h3>
        <div className="space-y-1">
          <div className="flex justify-between items-center p-2">
            <span className="text-sm">Vale Refeicao</span>
            <span className="text-sm">{formatCurrency(registro.valeRefeicao)}</span>
          </div>
          <div className="flex justify-between items-center p-2">
            <span className="text-sm">Plano de Saude</span>
            <span className="text-sm">{formatCurrency(registro.planoSaude)}</span>
          </div>
          <div className="flex justify-between items-center p-2">
            <span className="text-sm">FGTS (Depositado)</span>
            <span className="text-sm text-orange-700 dark:text-orange-400">
              {formatCurrency(registro.fgts)}
            </span>
          </div>
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-center">
          <Label className="text-xs text-muted-foreground">Total Proventos</Label>
          <p className="text-lg font-bold text-green-700 dark:text-green-400">
            {formatCurrency(registro.salarioBruto)}
          </p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-center">
          <Label className="text-xs text-muted-foreground">Total Descontos</Label>
          <p className="text-lg font-bold text-red-700 dark:text-red-400">
            {formatCurrency(totalDescontos)}
          </p>
        </div>
        <div className="p-3 bg-primary/10 rounded text-center">
          <Label className="text-xs text-muted-foreground">Salario Liquido</Label>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(registro.salarioLiquido)}
          </p>
        </div>
      </div>

      {/* Valor por extenso */}
      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded mb-4">
        <Label className="text-xs text-muted-foreground">Valor liquido por extenso:</Label>
        <p className="text-sm italic text-foreground">{extensoPorExtenso(registro.salarioLiquido)}</p>
      </div>

      {/* Status e Acoes */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          {registro.pago ? (
            <span className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 dark:bg-green-800/50 dark:text-green-300 rounded-full">
              <CheckCircle className="h-4 w-4" />
              Pago {registro.dataPagamento && `em ${new Date(registro.dataPagamento).toLocaleDateString('pt-BR')}`}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 text-sm bg-yellow-100 text-yellow-700 dark:bg-yellow-800/50 dark:text-yellow-300 rounded-full">
              <Clock className="h-4 w-4" />
              Pendente
            </span>
          )}
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir Holerite
        </Button>
      </div>
    </Card>
  )
}

export function RecibosContent() {
  const [activeTab, setActiveTab] = useState("prolabore")
  const [loading, setLoading] = useState(true)
  const [empresa, setEmpresa] = useState("Empresa")

  // Pro-labore
  const [socios, setSocios] = useState<Socio[]>([])
  const [socioSelecionado, setSocioSelecionado] = useState<string>("")
  const [historicoProLabore, setHistoricoProLabore] = useState<HistoricoProLabore[]>([])
  const [registroProLaboreSelecionado, setRegistroProLaboreSelecionado] = useState<HistoricoProLabore | null>(null)

  // Funcionarios
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string>("")
  const [historicoFolha, setHistoricoFolha] = useState<HistoricoFolha[]>([])
  const [registroFolhaSelecionado, setRegistroFolhaSelecionado] = useState<HistoricoFolha | null>(null)

  // Filtros
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear().toString())
  const [mesSelecionado, setMesSelecionado] = useState("all")

  // Carregar empresa
  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const res = await fetch('/api/empresa')
        const data = await res.json()
        if (data.nome) setEmpresa(data.nome)
      } catch (e) {
        console.error("Erro ao carregar empresa:", e)
      }
    }
    fetchEmpresa()
  }, [])

  // Carregar socios
  useEffect(() => {
    const fetchSocios = async () => {
      try {
        const res = await fetch('/api/socios')
        const data = await res.json()
        setSocios(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error("Erro ao carregar socios:", e)
        setSocios([])
      }
    }
    fetchSocios()
  }, [])

  // Carregar funcionarios
  useEffect(() => {
    const fetchFuncionarios = async () => {
      try {
        const res = await fetch('/api/funcionarios')
        const data = await res.json()
        setFuncionarios(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error("Erro ao carregar funcionarios:", e)
        setFuncionarios([])
      }
    }
    fetchFuncionarios()
  }, [])

  // Carregar historico de pro-labore
  useEffect(() => {
    const fetchHistoricoProLabore = async () => {
      if (!socioSelecionado) {
        setHistoricoProLabore([])
        return
      }

      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.append('ano', anoSelecionado)
        if (socioSelecionado !== 'todos') params.append('socioId', socioSelecionado)

        const res = await fetch(`/api/recibos/prolabore?${params.toString()}`)
        const data = await res.json()
        setHistoricoProLabore(data.historico || [])
      } catch (e) {
        console.error("Erro ao carregar historico:", e)
        setHistoricoProLabore([])
      } finally {
        setLoading(false)
      }
    }

    if (activeTab === "prolabore") {
      fetchHistoricoProLabore()
    }
  }, [socioSelecionado, anoSelecionado, activeTab])

  // Carregar historico de folha
  useEffect(() => {
    const fetchHistoricoFolha = async () => {
      if (!funcionarioSelecionado) {
        setHistoricoFolha([])
        return
      }

      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.append('ano', anoSelecionado)
        if (funcionarioSelecionado !== 'todos') params.append('funcionarioId', funcionarioSelecionado)

        const res = await fetch(`/api/recibos/holerite?${params.toString()}`)
        const data = await res.json()
        setHistoricoFolha(data.historico || [])
      } catch (e) {
        console.error("Erro ao carregar historico:", e)
        setHistoricoFolha([])
      } finally {
        setLoading(false)
      }
    }

    if (activeTab === "holerite") {
      fetchHistoricoFolha()
    }
  }, [funcionarioSelecionado, anoSelecionado, activeTab])

  // Filtrar por mes se selecionado
  const historicoProLaboreFiltrado = mesSelecionado && mesSelecionado !== "all"
    ? historicoProLabore.filter(h => h.mesReferencia === parseInt(mesSelecionado))
    : historicoProLabore

  const historicoFolhaFiltrado = mesSelecionado && mesSelecionado !== "all"
    ? historicoFolha.filter(h => h.mesReferencia === parseInt(mesSelecionado))
    : historicoFolha

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="prolabore" className="gap-2">
            <Users className="h-4 w-4" />
            Recibo Pro-labore
          </TabsTrigger>
          <TabsTrigger value="holerite" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Holerite
          </TabsTrigger>
        </TabsList>

        {/* Aba Pro-labore */}
        <TabsContent value="prolabore">
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Socio:</Label>
                <Select value={socioSelecionado} onValueChange={setSocioSelecionado}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione o socio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os socios</SelectItem>
                    {socios.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Ano:</Label>
                <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(ano => (
                      <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Mes:</Label>
                <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {MESES.map((mes, idx) => (
                      <SelectItem key={idx} value={(idx + 1).toString()}>{mes}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {!socioSelecionado ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Selecione um Socio</h3>
              <p className="text-sm text-muted-foreground">
                Escolha um socio para visualizar e gerar recibos de pro-labore
              </p>
            </Card>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : historicoProLaboreFiltrado.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum registro encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Nao ha historico de pro-labore para o periodo selecionado
              </p>
            </Card>
          ) : registroProLaboreSelecionado ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setRegistroProLaboreSelecionado(null)}
                className="mb-4"
              >
                Voltar para lista
              </Button>
              <ReciboProLabore registro={registroProLaboreSelecionado} empresa={empresa} />
            </div>
          ) : (
            <div className="space-y-3">
              {historicoProLaboreFiltrado.map(registro => (
                <Card
                  key={registro.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${registro.isTempoReal ? 'border-blue-200 dark:border-blue-800' : ''}`}
                  onClick={() => setRegistroProLaboreSelecionado(registro)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${registro.isTempoReal ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-primary/10'}`}>
                        <Calendar className={`h-5 w-5 ${registro.isTempoReal ? 'text-blue-600' : 'text-primary'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {registro.socioNome} - {MESES[registro.mesReferencia - 1]}/{registro.anoReferencia}
                          </p>
                          {registro.isTempoReal && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300 rounded-full">
                              Previsao
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          CPF: {formatCPF(registro.socioCpf)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Liquido</p>
                        <p className="font-bold text-primary">{formatCurrency(registro.proLaboreLiquido)}</p>
                      </div>
                      {registro.pago ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Aba Holerite */}
        <TabsContent value="holerite">
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Funcionario:</Label>
                <Select value={funcionarioSelecionado} onValueChange={setFuncionarioSelecionado}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione o funcionario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os funcionarios</SelectItem>
                    {funcionarios.map(f => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Ano:</Label>
                <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(ano => (
                      <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Mes:</Label>
                <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {MESES.map((mes, idx) => (
                      <SelectItem key={idx} value={(idx + 1).toString()}>{mes}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {!funcionarioSelecionado ? (
            <Card className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Selecione um Funcionario</h3>
              <p className="text-sm text-muted-foreground">
                Escolha um funcionario para visualizar e gerar holerites
              </p>
            </Card>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : historicoFolhaFiltrado.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum registro encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Nao ha historico de folha para o periodo selecionado
              </p>
            </Card>
          ) : registroFolhaSelecionado ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setRegistroFolhaSelecionado(null)}
                className="mb-4"
              >
                Voltar para lista
              </Button>
              <Holerite registro={registroFolhaSelecionado} empresa={empresa} />
            </div>
          ) : (
            <div className="space-y-3">
              {historicoFolhaFiltrado.map(registro => (
                <Card
                  key={registro.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${registro.isTempoReal ? 'border-blue-200 dark:border-blue-800' : ''}`}
                  onClick={() => setRegistroFolhaSelecionado(registro)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${registro.isTempoReal ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                        <Briefcase className={`h-5 w-5 ${registro.isTempoReal ? 'text-blue-600' : 'text-orange-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {registro.funcionarioNome} - {MESES[registro.mesReferencia - 1]}/{registro.anoReferencia}
                          </p>
                          {registro.isTempoReal && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300 rounded-full">
                              Previsao
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          CPF: {formatCPF(registro.funcionarioCpf)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Liquido</p>
                        <p className="font-bold text-primary">{formatCurrency(registro.salarioLiquido)}</p>
                      </div>
                      {registro.pago ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
