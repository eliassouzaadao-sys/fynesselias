/**
 * Service for managing bills and transactions (Contas)
 */

import { ApiService } from './api.service';
import { Conta, ContaFormData, ApiResponse, PaginatedResponse, FilterState, TipoConta, StatusConta } from '@/lib/types';
import { API_ROUTES } from '@/lib/constants';

class ContasService extends ApiService {
  constructor() {
    super();
  }

  /**
   * Get all contas with optional filters
   */
  async getAll(filters?: FilterState): Promise<ApiResponse<Conta[]>> {
    const params: Record<string, any> = {};

    if (filters?.tipo && filters.tipo !== 'all') {
      params.tipo = filters.tipo;
    }

    if (filters?.status && filters.status !== 'all') {
      params.status = filters.status;
    }

    if (filters?.search) {
      params.search = filters.search;
    }

    if (filters?.categoria) {
      params.categoria = filters.categoria;
    }

    if (filters?.dataInicio) {
      params.dataInicio = filters.dataInicio.toISOString();
    }

    if (filters?.dataFim) {
      params.dataFim = filters.dataFim.toISOString();
    }

    return this.get<Conta[]>(API_ROUTES.contas, params);
  }

  /**
   * Get a single conta by ID
   */
  async getById(id: string): Promise<ApiResponse<Conta>> {
    return this.get<Conta>(`${API_ROUTES.contas}/${id}`);
  }

  /**
   * Create a new conta
   */
  async create(data: ContaFormData): Promise<ApiResponse<Conta>> {
    return this.post<Conta>(API_ROUTES.contas, data);
  }

  /**
   * Update an existing conta
   */
  async update(id: string, data: Partial<ContaFormData>): Promise<ApiResponse<Conta>> {
    return this.put<Conta>(`${API_ROUTES.contas}/${id}`, data);
  }

  /**
   * Delete a conta
   */
  async deleteConta(id: string): Promise<ApiResponse<void>> {
    return super.delete<void>(`${API_ROUTES.contas}/${id}`);
  }

  /**
   * Mark conta as paid
   */
  async markAsPaid(id: string, dataPagamento?: Date): Promise<ApiResponse<Conta>> {
    return this.patch<Conta>(`${API_ROUTES.contas}/${id}/pay`, {
      dataPagamento: dataPagamento || new Date(),
      status: 'pago',
    });
  }

  /**
   * Cancel a conta
   */
  async cancel(id: string): Promise<ApiResponse<Conta>> {
    return this.patch<Conta>(`${API_ROUTES.contas}/${id}/cancel`, {
      status: 'cancelado',
    });
  }

  /**
   * Get contas by type
   */
  async getByTipo(tipo: TipoConta): Promise<ApiResponse<Conta[]>> {
    return this.get<Conta[]>(API_ROUTES.contas, { tipo });
  }

  /**
   * Get contas by status
   */
  async getByStatus(status: StatusConta): Promise<ApiResponse<Conta[]>> {
    return this.get<Conta[]>(API_ROUTES.contas, { status });
  }

  /**
   * Get overdue contas
   */
  async getOverdue(): Promise<ApiResponse<Conta[]>> {
    return this.get<Conta[]>(API_ROUTES.contas, { status: 'vencido' });
  }

  /**
   * Get contas due soon (next 7 days)
   */
  async getDueSoon(): Promise<ApiResponse<Conta[]>> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return this.get<Conta[]>(API_ROUTES.contas, {
      dataInicio: today.toISOString(),
      dataFim: nextWeek.toISOString(),
      status: 'pendente',
    });
  }

  /**
   * Get summary statistics
   */
  async getSummary(filters?: { dataInicio?: Date; dataFim?: Date }) {
    const params: Record<string, any> = { summary: true };

    if (filters?.dataInicio) {
      params.dataInicio = filters.dataInicio.toISOString();
    }

    if (filters?.dataFim) {
      params.dataFim = filters.dataFim.toISOString();
    }

    return this.get<{
      totalPagar: number;
      totalReceber: number;
      totalPago: number;
      totalRecebido: number;
      pendentes: number;
      vencidas: number;
    }>(API_ROUTES.contas, params);
  }

  /**
   * Duplicate a conta
   */
  async duplicate(id: string): Promise<ApiResponse<Conta>> {
    return this.post<Conta>(`${API_ROUTES.contas}/${id}/duplicate`);
  }

  /**
   * Create recurring contas
   */
  async createRecurring(
    data: ContaFormData,
    config: { frequency: 'mensal' | 'semanal' | 'anual'; occurrences: number }
  ): Promise<ApiResponse<Conta[]>> {
    return this.post<Conta[]>(`${API_ROUTES.contas}/recurring`, {
      ...data,
      recorrente: true,
      ...config,
    });
  }
}

export const contasService = new ContasService();
