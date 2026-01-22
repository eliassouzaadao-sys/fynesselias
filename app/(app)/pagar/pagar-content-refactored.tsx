"use client";

import { useState } from "react";
import { Plus, Download, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePagar } from "@/hooks/usePagar";
import { usePagination, useFilters } from "@/hooks";
import { safeFilter, isOverdue, isDueSoon, chunk } from "@/lib/helpers";
import { PagarKPIs } from "./components/PagarKPIs";
import { PagarFilters } from "./components/PagarFilters";
import { ContaCard } from "./components/ContaCard";
import { Pagination } from "./components/Pagination";
import type { Conta } from "@/lib/types";

const ITEMS_PER_PAGE = 12;

export function PagarContent() {
  const { contas, loading, error, refresh, marcarComoPago, deletarConta } = usePagar();
  const { currentPage, goToPage, paginateData } = usePagination({ initialPageSize: ITEMS_PER_PAGE });
  const { filters, updateFilter } = useFilters({
    search: "",
    categoria: "Todas",
  });

  const [selectedConta, setSelectedConta] = useState<Conta | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNovaContaModal, setShowNovaContaModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Filtrar contas
  const filteredContas = safeFilter<Conta>(contas, (conta) => {
    const matchSearch = (conta.descricao?.toLowerCase() || "").includes(
      (filters.search as string).toLowerCase()
    );
    const matchCategoria =
      filters.categoria === "Todas" || conta.categoria === filters.categoria;
    return matchSearch && matchCategoria;
  });

  // Agrupar contas por status
  const pendentes = safeFilter<Conta>(filteredContas, (c) => !c.pago && !isOverdue(c.dataVencimento));
  const vencidas = safeFilter<Conta>(filteredContas, (c) => !c.pago && isOverdue(c.dataVencimento));
  const pagas = safeFilter<Conta>(filteredContas, (c) => c.pago);

  // Paginação
  const changePage = (newPage: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      goToPage(newPage);
      setIsTransitioning(false);
    }, 150);
  };

  const getTotalPages = (data: Conta[]) => Math.ceil(data.length / ITEMS_PER_PAGE);
  const getPaginatedData = (data: Conta[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  };

  // Handlers
  const handleViewDocument = (conta: Conta) => {
    setSelectedConta(conta);
    setShowDocumentModal(true);
  };

  const handleMarcarComoPago = async (id: number) => {
    const success = await marcarComoPago(id);
    if (success) {
      setShowDetail(false);
      // Opcional: mostrar toast de sucesso
    }
  };

  const handleDeletar = async (id: number) => {
    const success = await deletarConta(id);
    if (success) {
      setShowDetail(false);
      // Opcional: mostrar toast de sucesso
    }
  };

  if (loading) {
    return <LoadingSpinner text="Carregando contas a pagar..." size="lg" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar contas</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={refresh}>Tentar Novamente</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader breadcrumb={undefined}
        title="Contas a Pagar"
        description="Gestão completa de pagamentos a beneficiários"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setShowNovaContaModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <PagarKPIs contas={contas} />

      {/* Filtros */}
      <PagarFilters
        searchTerm={filters.search as string}
        onSearchChange={(value) => updateFilter("search", value)}
        categoriaFilter={filters.categoria as string}
        onCategoriaChange={(value) => updateFilter("categoria", value)}
      />

      {/* Tabs de Contas */}
      <Tabs defaultValue="pendentes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pendentes">
            <Clock className="mr-2 h-4 w-4" />
            Pendentes ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="vencidas">
            <AlertCircle className="mr-2 h-4 w-4" />
            Vencidas ({vencidas.length})
          </TabsTrigger>
          <TabsTrigger value="pagas">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Pagas ({pagas.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Pendentes */}
        <TabsContent value="pendentes" className="space-y-3">
          {pendentes.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nenhuma conta pendente"
              description="Todas as contas estão em dia!"
            />
          ) : (
            <>
              <div
                className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150 ${
                  isTransitioning ? "opacity-0" : "opacity-100"
                }`}
              >
                {getPaginatedData(pendentes, currentPage).map((conta) => (
                  <ContaCard
                    key={conta.id}
                    conta={conta}
                    onClick={() => {
                      setSelectedConta(conta);
                      setShowDetail(true);
                    }}
                    onViewDocument={() => handleViewDocument(conta)}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={getTotalPages(pendentes)}
                totalItems={pendentes.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={changePage}
              />
            </>
          )}
        </TabsContent>

        {/* Tab Vencidas */}
        <TabsContent value="vencidas" className="space-y-3">
          {vencidas.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nenhuma conta vencida"
              description="Parabéns! Todas as contas estão em dia."
            />
          ) : (
            <>
              <div
                className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150 ${
                  isTransitioning ? "opacity-0" : "opacity-100"
                }`}
              >
                {getPaginatedData(vencidas, currentPage).map((conta) => (
                  <ContaCard
                    key={conta.id}
                    conta={conta}
                    onClick={() => {
                      setSelectedConta(conta);
                      setShowDetail(true);
                    }}
                    onViewDocument={() => handleViewDocument(conta)}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={getTotalPages(vencidas)}
                totalItems={vencidas.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={changePage}
              />
            </>
          )}
        </TabsContent>

        {/* Tab Pagas */}
        <TabsContent value="pagas" className="space-y-3">
          {pagas.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="Nenhum pagamento realizado"
              description="Comece pagando suas contas pendentes."
            />
          ) : (
            <>
              <div
                className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150 ${
                  isTransitioning ? "opacity-0" : "opacity-100"
                }`}
              >
                {getPaginatedData(pagas, currentPage).map((conta) => (
                  <ContaCard
                    key={conta.id}
                    conta={conta}
                    onClick={() => {
                      setSelectedConta(conta);
                      setShowDetail(true);
                    }}
                    onViewDocument={() => handleViewDocument(conta)}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={getTotalPages(pagas)}
                totalItems={pagas.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={changePage}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* TODO: Implementar modais de detalhes, nova conta, visualização de documento */}
      {/* Esses modais devem ser componentizados separadamente */}
    </div>
  );
}
