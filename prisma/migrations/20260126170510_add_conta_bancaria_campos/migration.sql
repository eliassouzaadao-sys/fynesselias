/*
  Warnings:

  - Added the required column `agencia` to the `Banco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conta` to the `Banco` table without a default value. This is not possible if the table is not empty.
  - Made the column `codigo` on table `Banco` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Banco" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "conta" TEXT NOT NULL,
    "chavePix" TEXT,
    "tipoChavePix" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
INSERT INTO "new_Banco" ("ativo", "atualizadoEm", "codigo", "criadoEm", "id", "nome") SELECT "ativo", "atualizadoEm", "codigo", "criadoEm", "id", "nome" FROM "Banco";
DROP TABLE "Banco";
ALTER TABLE "new_Banco" RENAME TO "Banco";
CREATE TABLE "new_FluxoCaixa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dia" DATETIME NOT NULL,
    "codigoTipo" TEXT NOT NULL,
    "fornecedorCliente" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "fluxo" REAL NOT NULL,
    "contaId" INTEGER,
    "centroCustoSigla" TEXT,
    "bancoId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "FluxoCaixa_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FluxoCaixa_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "Banco" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FluxoCaixa" ("atualizadoEm", "centroCustoSigla", "codigoTipo", "contaId", "criadoEm", "dia", "fluxo", "fornecedorCliente", "id", "tipo", "valor") SELECT "atualizadoEm", "centroCustoSigla", "codigoTipo", "contaId", "criadoEm", "dia", "fluxo", "fornecedorCliente", "id", "tipo", "valor" FROM "FluxoCaixa";
DROP TABLE "FluxoCaixa";
ALTER TABLE "new_FluxoCaixa" RENAME TO "FluxoCaixa";
CREATE UNIQUE INDEX "FluxoCaixa_contaId_key" ON "FluxoCaixa"("contaId");
CREATE INDEX "FluxoCaixa_dia_idx" ON "FluxoCaixa"("dia");
CREATE INDEX "FluxoCaixa_tipo_idx" ON "FluxoCaixa"("tipo");
CREATE INDEX "FluxoCaixa_centroCustoSigla_idx" ON "FluxoCaixa"("centroCustoSigla");
CREATE INDEX "FluxoCaixa_bancoId_idx" ON "FluxoCaixa"("bancoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
