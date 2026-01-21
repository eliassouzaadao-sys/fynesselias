/**
 * Zod validation schemas for Pessoa (Contacts/People)
 */

import { z } from 'zod';

// CPF validation
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cpfNumericRegex = /^\d{11}$/;

// CNPJ validation
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const cnpjNumericRegex = /^\d{14}$/;

// Combined CPF/CNPJ validation
const cpfCnpjValidator = z
  .string()
  .refine(
    (val) => {
      if (!val) return true; // Optional field
      return (
        cpfRegex.test(val) ||
        cpfNumericRegex.test(val) ||
        cnpjRegex.test(val) ||
        cnpjNumericRegex.test(val)
      );
    },
    {
      message: 'CPF/CNPJ inválido',
    }
  )
  .optional();

// Phone validation (Brazilian format)
const phoneRegex = /^\(?([1-9]{2})\)?\s?([9]{1})?([0-9]{4})-?([0-9]{4})$/;

export const pessoaSchema = z.object({
  nome: z
    .string({
      required_error: 'O nome é obrigatório',
    })
    .min(3, 'O nome deve ter no mínimo 3 caracteres')
    .max(255, 'O nome deve ter no máximo 255 caracteres'),
  tipo: z.enum(['cliente', 'fornecedor', 'ambos'], {
    required_error: 'O tipo é obrigatório',
    invalid_type_error: 'Tipo inválido',
  }),
  cpfCnpj: cpfCnpjValidator,
  email: z
    .string()
    .email('E-mail inválido')
    .max(255, 'O e-mail deve ter no máximo 255 caracteres')
    .optional()
    .or(z.literal('')),
  telefone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido. Use o formato: (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')),
  endereco: z.string().max(500, 'O endereço deve ter no máximo 500 caracteres').optional(),
  cidade: z.string().max(100, 'A cidade deve ter no máximo 100 caracteres').optional(),
  estado: z
    .string()
    .length(2, 'O estado deve ter 2 caracteres')
    .regex(/^[A-Z]{2}$/, 'Estado inválido')
    .optional()
    .or(z.literal('')),
  cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido. Use o formato: XXXXX-XXX')
    .optional()
    .or(z.literal('')),
  banco: z.string().max(100).optional(),
  agencia: z.string().max(20).optional(),
  conta: z.string().max(20).optional(),
  tipoConta: z.enum(['corrente', 'poupanca', 'investimento']).optional().or(z.literal('')),
  chavePix: z.string().max(255).optional(),
});

export const pessoaUpdateSchema = pessoaSchema.partial();

export const pessoaFilterSchema = z.object({
  tipo: z.enum(['cliente', 'fornecedor', 'ambos', 'all']).optional(),
  search: z.string().optional(),
});

export const cpfCnpjCheckSchema = z.object({
  cpfCnpj: z.string({
    required_error: 'CPF/CNPJ é obrigatório',
  }),
  excludeId: z.string().optional(),
});

export type PessoaFormInput = z.infer<typeof pessoaSchema>;
export type PessoaUpdateInput = z.infer<typeof pessoaUpdateSchema>;
export type PessoaFilterInput = z.infer<typeof pessoaFilterSchema>;
export type CpfCnpjCheckInput = z.infer<typeof cpfCnpjCheckSchema>;
