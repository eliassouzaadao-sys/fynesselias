/**
 * Zod validation schemas for Conta (Bills/Transactions)
 */

import { z } from 'zod';

export const contaSchema = z.object({
  tipo: z.enum(['pagar', 'receber'], {
    required_error: 'O tipo é obrigatório',
    invalid_type_error: 'Tipo inválido',
  }),
  descricao: z
    .string({
      required_error: 'A descrição é obrigatória',
    })
    .min(3, 'A descrição deve ter no mínimo 3 caracteres')
    .max(255, 'A descrição deve ter no máximo 255 caracteres'),
  valor: z
    .number({
      required_error: 'O valor é obrigatório',
      invalid_type_error: 'O valor deve ser um número',
    })
    .positive('O valor deve ser positivo')
    .or(
      z
        .string()
        .regex(/^\d+([.,]\d{1,2})?$/, 'Formato de valor inválido')
        .transform((val) => parseFloat(val.replace(',', '.')))
    ),
  dataVencimento: z
    .string({
      required_error: 'A data de vencimento é obrigatória',
    })
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  dataPagamento: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .optional()
    .nullable(),
  status: z
    .enum(['pago', 'pendente', 'vencido', 'cancelado'], {
      required_error: 'O status é obrigatório',
    })
    .default('pendente'),
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
  centroCusto: z.string().optional(),
  subCentroCusto: z.string().optional(),
  formaPagamento: z
    .enum([
      'dinheiro',
      'pix',
      'transferencia',
      'cartao_credito',
      'cartao_debito',
      'boleto',
      'cheque',
    ])
    .optional(),
  banco: z.string().optional(),
  beneficiario: z.string().optional(),
  documento: z.string().optional(),
  observacoes: z.string().max(1000, 'As observações devem ter no máximo 1000 caracteres').optional(),
  pessoaId: z.string().optional(),
  recorrente: z.boolean().optional().default(false),
  parcela: z.number().int().positive().optional(),
  totalParcelas: z.number().int().positive().optional(),
});

export const contaUpdateSchema = contaSchema.partial();

export const contaPagamentoSchema = z.object({
  dataPagamento: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  status: z.literal('pago'),
});

export const contaRecorrenteSchema = contaSchema.extend({
  recorrente: z.literal(true),
  frequency: z.enum(['mensal', 'semanal', 'anual'], {
    required_error: 'A frequência é obrigatória para contas recorrentes',
  }),
  occurrences: z
    .number({
      required_error: 'O número de ocorrências é obrigatório',
    })
    .int()
    .positive()
    .min(1, 'Deve ter no mínimo 1 ocorrência')
    .max(120, 'Máximo de 120 ocorrências'),
});

export const contaFilterSchema = z.object({
  tipo: z.enum(['pagar', 'receber', 'all']).optional(),
  status: z.enum(['pago', 'pendente', 'vencido', 'cancelado', 'all']).optional(),
  search: z.string().optional(),
  categoria: z.string().optional(),
  dataInicio: z.string().or(z.date()).optional(),
  dataFim: z.string().or(z.date()).optional(),
  banco: z.string().optional(),
  formaPagamento: z
    .enum([
      'dinheiro',
      'pix',
      'transferencia',
      'cartao_credito',
      'cartao_debito',
      'boleto',
      'cheque',
    ])
    .optional(),
});

export type ContaFormInput = z.infer<typeof contaSchema>;
export type ContaUpdateInput = z.infer<typeof contaUpdateSchema>;
export type ContaPagamentoInput = z.infer<typeof contaPagamentoSchema>;
export type ContaRecorrenteInput = z.infer<typeof contaRecorrenteSchema>;
export type ContaFilterInput = z.infer<typeof contaFilterSchema>;
