-- CreateTable
CREATE TABLE "CentroCusto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "previsto" REAL NOT NULL DEFAULT 0,
    "realizado" REAL NOT NULL DEFAULT 0,
    "parentId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "CentroCusto_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CentroCusto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CentroCusto_sigla_key" ON "CentroCusto"("sigla");

-- CreateIndex
CREATE INDEX "CentroCusto_tipo_idx" ON "CentroCusto"("tipo");

-- CreateIndex
CREATE INDEX "CentroCusto_ativo_idx" ON "CentroCusto"("ativo");

-- CreateIndex
CREATE INDEX "CentroCusto_parentId_idx" ON "CentroCusto"("parentId");
