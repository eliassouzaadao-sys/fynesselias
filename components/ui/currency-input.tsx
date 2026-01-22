"use client";

import { Input } from "./input";
import { forwardRef, useState, useEffect } from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string;
  onValueChange?: (value: number) => void;
}

/**
 * Input formatado para moeda brasileira (R$)
 * - Formata automaticamente enquanto o usuário digita
 * - Retorna o valor numérico via onValueChange
 * - Exibe no formato R$ 1.234,56
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("");

    // Converte número para formato de exibição
    const formatToCurrency = (num: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(num);
    };

    // Converte string formatada para número
    const parseFromCurrency = (str: string): number => {
      // Remove tudo exceto números
      const numbers = str.replace(/\D/g, '');
      // Converte centavos para reais (divide por 100)
      return numbers ? parseInt(numbers) / 100 : 0;
    };

    // Atualiza display quando value externo muda
    useEffect(() => {
      if (value !== undefined && value !== null) {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          setDisplayValue(formatToCurrency(numValue));
        }
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Remove tudo exceto números
      const numbers = inputValue.replace(/\D/g, '');

      if (!numbers) {
        setDisplayValue('');
        onValueChange?.(0);
        return;
      }

      // Converte para número (divide por 100 para ter os centavos)
      const numValue = parseInt(numbers) / 100;

      // Formata para exibição
      const formatted = formatToCurrency(numValue);

      setDisplayValue(formatted);
      onValueChange?.(numValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="R$ 0,00"
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
