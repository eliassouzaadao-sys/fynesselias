-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Banco" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "agencia" TEXT,
    "conta" TEXT,
    "chavePix" TEXT,
    "tipoChavePix" TEXT,
    "saldoInicial" REAL NOT NULL DEFAULT 0,
    "limiteContaGarantida" REAL NOT NULL DEFAULT 0,
    "utilizadoContaGarantida" REAL NOT NULL DEFAULT 0,
    "limiteChequeEspecial" REAL NOT NULL DEFAULT 0,
    "utilizadoChequeEspecial" REAL NOT NULL DEFAULT 0,
    "saldoInvestimentoLiquido" REAL NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "conciliadoEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    CONSTRAINT "Banco_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Banco_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Banco" ("agencia", "ativo", "atualizadoEm", "chavePix", "codigo", "conciliadoEm", "conta", "criadoEm", "empresaId", "id", "limiteChequeEspecial", "limiteContaGarantida", "nome", "saldoInicial", "saldoInvestimentoLiquido", "tipoChavePix", "userId") SELECT "agencia", "ativo", "atualizadoEm", "chavePix", "codigo", "conciliadoEm", "conta", "criadoEm", "empresaId", "id", "limiteChequeEspecial", "limiteContaGarantida", "nome", "saldoInicial", "saldoInvestimentoLiquido", "tipoChavePix", "userId" FROM "Banco";
DROP TABLE "Banco";
ALTER TABLE "new_Banco" RENAME TO "Banco";
CREATE INDEX "Banco_userId_idx" ON "Banco"("userId");
CREATE INDEX "Banco_empresaId_idx" ON "Banco"("empresaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
