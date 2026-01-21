"use client"

export function CreditoReportContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="rounded-lg bg-muted p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Relatório de Crédito Temporariamente Indisponível
          </h2>
          <p className="text-sm text-muted-foreground">
            Este relatório está em desenvolvimento e estará disponível em breve.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Entre em contato com o suporte para mais informações.
          </p>
        </div>
      </div>
    </div>
  )
}
