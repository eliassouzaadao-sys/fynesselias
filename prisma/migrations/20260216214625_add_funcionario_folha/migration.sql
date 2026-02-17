-- CreateTable
CREATE TABLE "Funcionario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cargo" TEXT,
    "dataAdmissao" DATETIME NOT NULL,
    "dataDemissao" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "salarioBruto" REAL NOT NULL,
    "valeTransporte" REAL NOT NULL DEFAULT 0,
    "valeRefeicao" REAL NOT NULL DEFAULT 0,
    "planoSaude" REAL NOT NULL DEFAULT 0,
    "outrosBeneficios" REAL NOT NULL DEFAULT 0,
    "inss" REAL NOT NULL DEFAULT 0,
    "irrf" REAL NOT NULL DEFAULT 0,
    "fgts" REAL NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Funcionario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Funcionario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoricoFolha" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "funcionarioNome" TEXT NOT NULL,
    "funcionarioCpf" TEXT NOT NULL,
    "salarioBruto" REAL NOT NULL,
    "inss" REAL NOT NULL,
    "irrf" REAL NOT NULL,
    "fgts" REAL NOT NULL,
    "valeTransporte" REAL NOT NULL,
    "valeRefeicao" REAL NOT NULL,
    "planoSaude" REAL NOT NULL,
    "outrosDescontos" REAL NOT NULL DEFAULT 0,
    "salarioLiquido" REAL NOT NULL,
    "custoEmpresa" REAL NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" DATETIME,
    "contaGeradaId" INTEGER,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "HistoricoFolha_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistoricoFolha_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistoricoFolha_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Funcionario_userId_idx" ON "Funcionario"("userId");

-- CreateIndex
CREATE INDEX "Funcionario_empresaId_idx" ON "Funcionario"("empresaId");

-- CreateIndex
CREATE INDEX "Funcionario_status_idx" ON "Funcionario"("status");

-- CreateIndex
CREATE INDEX "Funcionario_cpf_idx" ON "Funcionario"("cpf");

-- CreateIndex
CREATE INDEX "HistoricoFolha_funcionarioId_idx" ON "HistoricoFolha"("funcionarioId");

-- CreateIndex
CREATE INDEX "HistoricoFolha_mesReferencia_anoReferencia_idx" ON "HistoricoFolha"("mesReferencia", "anoReferencia");

-- CreateIndex
CREATE INDEX "HistoricoFolha_pago_idx" ON "HistoricoFolha"("pago");

-- CreateIndex
CREATE INDEX "HistoricoFolha_userId_idx" ON "HistoricoFolha"("userId");

-- CreateIndex
CREATE INDEX "HistoricoFolha_empresaId_idx" ON "HistoricoFolha"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricoFolha_funcionarioId_mesReferencia_anoReferencia_key" ON "HistoricoFolha"("funcionarioId", "mesReferencia", "anoReferencia");
