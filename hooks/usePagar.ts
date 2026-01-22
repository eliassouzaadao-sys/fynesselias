/**
 * Custom hook for managing "Contas a Pagar" logic
 */

import { useState, useEffect, useCallback } from "react";
import { contasService } from "@/lib/services";
import { ensureArray, safeFilter } from "@/lib/helpers";
import type { Conta } from "@/lib/types";

export function usePagar() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contas a pagar
  const loadContas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await contasService.getAll({ tipo: "pagar" });

      if (result.success && result.data) {
        setContas(ensureArray<Conta>(result.data));
      } else {
        setError(result.error || "Erro ao carregar contas");
        setContas([]);
      }
    } catch (err) {
      console.error("Failed to fetch contas:", err);
      setError("Erro ao carregar contas");
      setContas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadContas();
  }, [loadContas]);

  // Filter only "pagar" type
  const contasPagar = safeFilter<Conta>(contas, (c) => c.tipo === "pagar");

  // Mark as paid
  const marcarComoPago = useCallback(
    async (id: number, dataPagamento?: Date, comprovante?: string) => {
      try {
        const result = await contasService.markAsPaid(String(id), dataPagamento, comprovante);

        if (result.success) {
          await loadContas();
          return { success: true, data: result.data };
        } else {
          setError(result.error || "Erro ao marcar como pago");
          return { success: false, error: result.error };
        }
      } catch (err) {
        console.error("Failed to mark as paid:", err);
        setError("Erro ao marcar como pago");
        return { success: false, error: "Erro ao marcar como pago" };
      }
    },
    [loadContas]
  );

  // Delete conta
  const deletarConta = useCallback(
    async (id: number) => {
      try {
        const result = await contasService.deleteConta(String(id));

        if (result.success) {
          await loadContas();
          return true;
        } else {
          setError(result.error || "Erro ao deletar conta");
          return false;
        }
      } catch (err) {
        console.error("Failed to delete conta:", err);
        setError("Erro ao deletar conta");
        return false;
      }
    },
    [loadContas]
  );

  // Create conta
  const criarConta = useCallback(
    async (data: Partial<Conta>) => {
      try {
        const result = await contasService.create({
          ...data,
          tipo: "pagar",
        } as any);

        if (result.success) {
          await loadContas();
          return { success: true, data: result.data };
        } else {
          setError(result.error || "Erro ao criar conta");
          return { success: false, error: result.error };
        }
      } catch (err) {
        console.error("Failed to create conta:", err);
        setError("Erro ao criar conta");
        return { success: false, error: "Erro ao criar conta" };
      }
    },
    [loadContas]
  );

  // Update conta
  const atualizarConta = useCallback(
    async (id: number, data: Partial<Conta>) => {
      try {
        const result = await contasService.update(String(id), data as any);

        if (result.success) {
          await loadContas();
          return { success: true, data: result.data };
        } else {
          setError(result.error || "Erro ao atualizar conta");
          return { success: false, error: result.error };
        }
      } catch (err) {
        console.error("Failed to update conta:", err);
        setError("Erro ao atualizar conta");
        return { success: false, error: "Erro ao atualizar conta" };
      }
    },
    [loadContas]
  );

  return {
    contas: contasPagar,
    loading,
    error,
    refresh: loadContas,
    marcarComoPago,
    deletarConta,
    criarConta,
    atualizarConta,
  };
}
