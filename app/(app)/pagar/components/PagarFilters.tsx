"use client";

import { Search, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PagarFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoriaFilter: string;
  onCategoriaChange: (value: string) => void;
}

export function PagarFilters({
  searchTerm,
  onSearchChange,
  categoriaFilter,
  onCategoriaChange,
}: PagarFiltersProps) {
  return (
    <Card className="p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fyn-muted" />
          <Input
            placeholder="Buscar por fornecedor, documento..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoriaFilter} onValueChange={onCategoriaChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas Categorias</SelectItem>
            <SelectItem value="Fornecedores">Fornecedores</SelectItem>
            <SelectItem value="Folha de Pagamento">Folha de Pagamento</SelectItem>
            <SelectItem value="Impostos e Taxas">Impostos e Taxas</SelectItem>
            <SelectItem value="Despesas Administrativas">Desp. Administrativas</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="w-full">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Este Mês
        </Button>
      </div>
    </Card>
  );
}
