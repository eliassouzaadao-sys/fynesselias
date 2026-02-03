-- CreateTable
CREATE TABLE "FluxoCaixa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dia" DATETIME NOT NULL,
    "codigoTipo" TEXT NOT NULL,
    "fornecedorCliente" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "fluxo" REAL NOT NULL,
    "contaId" INTEGER,
    "centroCustoSigla" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "FluxoCaixa_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FluxoCaixa_contaId_key" ON "FluxoCaixa"("contaId");

-- CreateIndex
CREATE INDEX "FluxoCaixa_dia_idx" ON "FluxoCaixa"("dia");

-- CreateIndex
CREATE INDEX "FluxoCaixa_tipo_idx" ON "FluxoCaixa"("tipo");

-- CreateIndex
CREATE INDEX "FluxoCaixa_centroCustoSigla_idx" ON "FluxoCaixa"("centroCustoSigla");
