/**
 * Service for managing people/contacts (Pessoas)
 */

import { ApiService } from './api.service';
import { Pessoa, PessoaFormData, ApiResponse } from '@/lib/types';
import { API_ROUTES } from '@/lib/constants';

class PessoasService extends ApiService {
  constructor() {
    super();
  }

  /**
   * Get all pessoas with optional filters
   */
  async getAll(filters?: { tipo?: string; search?: string }): Promise<ApiResponse<Pessoa[]>> {
    const params: Record<string, any> = {};

    if (filters?.tipo && filters.tipo !== 'all') {
      params.tipo = filters.tipo;
    }

    if (filters?.search) {
      params.search = filters.search;
    }

    return this.get<Pessoa[]>(API_ROUTES.pessoas, params);
  }

  /**
   * Get a single pessoa by ID
   */
  async getById(id: string): Promise<ApiResponse<Pessoa>> {
    return this.get<Pessoa>(`${API_ROUTES.pessoas}/${id}`);
  }

  /**
   * Create a new pessoa
   */
  async create(data: PessoaFormData): Promise<ApiResponse<Pessoa>> {
    return this.post<Pessoa>(API_ROUTES.pessoas, data);
  }

  /**
   * Update an existing pessoa
   */
  async update(id: string, data: Partial<PessoaFormData>): Promise<ApiResponse<Pessoa>> {
    return this.put<Pessoa>(`${API_ROUTES.pessoas}/${id}`, data);
  }

  /**
   * Delete a pessoa
   */
  async deletePessoa(id: string): Promise<ApiResponse<void>> {
    return super.delete<void>(`${API_ROUTES.pessoas}/${id}`);
  }

  /**
   * Get clientes (customers)
   */
  async getClientes(): Promise<ApiResponse<Pessoa[]>> {
    return this.get<Pessoa[]>(API_ROUTES.pessoas, { tipo: 'cliente' });
  }

  /**
   * Get fornecedores (suppliers)
   */
  async getFornecedores(): Promise<ApiResponse<Pessoa[]>> {
    return this.get<Pessoa[]>(API_ROUTES.pessoas, { tipo: 'fornecedor' });
  }

  /**
   * Search pessoas by name or CPF/CNPJ
   */
  async search(query: string): Promise<ApiResponse<Pessoa[]>> {
    return this.get<Pessoa[]>(API_ROUTES.pessoas, { search: query });
  }

  /**
   * Check if CPF/CNPJ already exists
   */
  async checkCpfCnpjExists(cpfCnpj: string, excludeId?: string): Promise<ApiResponse<{ exists: boolean }>> {
    const params: Record<string, any> = { cpfCnpj, check: true };
    if (excludeId) {
      params.excludeId = excludeId;
    }
    return this.get<{ exists: boolean }>(API_ROUTES.pessoas, params);
  }

  /**
   * Get pessoa with related contas
   */
  async getWithContas(id: string): Promise<ApiResponse<Pessoa & { contas: any[] }>> {
    return this.get<Pessoa & { contas: any[] }>(`${API_ROUTES.pessoas}/${id}?includeContas=true`);
  }
}

export const pessoasService = new PessoasService();
