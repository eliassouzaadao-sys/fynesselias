/**
 * Custom hook for managing pessoas (contacts)
 */

import { useState, useEffect, useCallback } from 'react';
import { pessoasService } from '@/lib/services';
import { Pessoa } from '@/lib/types';
import { toast } from 'sonner';

interface UsePessoasOptions {
  tipo?: 'cliente' | 'fornecedor' | 'ambos';
  autoLoad?: boolean;
}

export function usePessoas(options: UsePessoasOptions = {}) {
  const { tipo, autoLoad = true } = options;

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPessoas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: any = {};
      if (tipo) filters.tipo = tipo;
      if (searchQuery) filters.search = searchQuery;

      const result = await pessoasService.getAll(filters);

      if (result.success && result.data) {
        setPessoas(result.data);
      } else {
        throw new Error(result.error || 'Erro ao carregar pessoas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tipo, searchQuery]);

  const createPessoa = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await pessoasService.create(data);

      if (result.success && result.data) {
        setPessoas((prev) => [...prev, result.data!]);
        toast.success('Pessoa criada com sucesso!');
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao criar pessoa');
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

  const updatePessoa = useCallback(async (id: string, data: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await pessoasService.update(id, data);

      if (result.success && result.data) {
        setPessoas((prev) => prev.map((pessoa) => (pessoa.id === id ? result.data! : pessoa)));
        toast.success('Pessoa atualizada com sucesso!');
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao atualizar pessoa');
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

  const deletePessoa = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await pessoasService.deletePessoa(id);

      if (result.success) {
        setPessoas((prev) => prev.filter((pessoa) => pessoa.id !== id));
        toast.success('Pessoa excluída com sucesso!');
        return true;
      } else {
        throw new Error(result.error || 'Erro ao excluir pessoa');
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

  const search = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const refresh = useCallback(() => {
    loadPessoas();
  }, [loadPessoas]);

  useEffect(() => {
    if (autoLoad) {
      loadPessoas();
    }
  }, [autoLoad, loadPessoas]);

  return {
    pessoas,
    loading,
    error,
    searchQuery,
    createPessoa,
    updatePessoa,
    deletePessoa,
    search,
    refresh,
  };
}
