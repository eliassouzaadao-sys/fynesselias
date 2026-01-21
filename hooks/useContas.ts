/**
 * Custom hook for managing contas (bills/transactions)
 */

import { useState, useEffect, useCallback } from 'react';
import { contasService } from '@/lib/services';
import { Conta, FilterState, TipoConta, StatusConta } from '@/lib/types';
import { toast } from 'sonner';

interface UseContasOptions {
  tipo?: TipoConta;
  autoLoad?: boolean;
  filters?: FilterState;
}

export function useContas(options: UseContasOptions = {}) {
  const { tipo, autoLoad = true, filters: initialFilters } = options;

  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters || {});

  const loadContas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const combinedFilters = { ...filters };
      if (tipo) {
        combinedFilters.tipo = tipo;
      }

      const result = await contasService.getAll(combinedFilters);

      if (result.success && result.data) {
        setContas(result.data);
      } else {
        throw new Error(result.error || 'Erro ao carregar contas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, tipo]);

  const createConta = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await contasService.create(data);

      if (result.success && result.data) {
        setContas((prev) => [...prev, result.data!]);
        toast.success('Conta criada com sucesso!');
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao criar conta');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConta = useCallback(async (id: string, data: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await contasService.update(id, data);

      if (result.success && result.data) {
        setContas((prev) => prev.map((conta) => (conta.id === id ? result.data! : conta)));
        toast.success('Conta atualizada com sucesso!');
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao atualizar conta');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConta = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await contasService.deleteConta(id);

      if (result.success) {
        setContas((prev) => prev.filter((conta) => conta.id !== id));
        toast.success('Conta excluída com sucesso!');
        return true;
      } else {
        throw new Error(result.error || 'Erro ao excluir conta');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsPaid = useCallback(async (id: string, dataPagamento?: Date) => {
    setLoading(true);
    setError(null);

    try {
      const result = await contasService.markAsPaid(id, dataPagamento);

      if (result.success && result.data) {
        setContas((prev) => prev.map((conta) => (conta.id === id ? result.data! : conta)));
        toast.success('Conta marcada como paga!');
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao marcar conta como paga');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelConta = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await contasService.cancel(id);

      if (result.success && result.data) {
        setContas((prev) => prev.map((conta) => (conta.id === id ? result.data! : conta)));
        toast.success('Conta cancelada com sucesso!');
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao cancelar conta');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const duplicateConta = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await contasService.duplicate(id);

      if (result.success && result.data) {
        setContas((prev) => [...prev, result.data!]);
        toast.success('Conta duplicada com sucesso!');
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao duplicar conta');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const refresh = useCallback(() => {
    loadContas();
  }, [loadContas]);

  useEffect(() => {
    if (autoLoad) {
      loadContas();
    }
  }, [autoLoad, loadContas]);

  return {
    contas,
    loading,
    error,
    filters,
    createConta,
    updateConta,
    deleteConta,
    markAsPaid,
    cancelConta,
    duplicateConta,
    updateFilters,
    clearFilters,
    refresh,
  };
}
