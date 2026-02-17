/*
  Warnings:

  - Added the required column `userId` to the `Banco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Categoria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `CentroCusto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Conta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `FluxoCaixa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Pessoa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `WhatsAppMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "DescontoRecorrente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "socioId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "DescontoRecorrente_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "CentroCusto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DescontoRecorrente_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DescontoRecorrente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CartaoCredito" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "bandeira" TEXT NOT NULL,
    "ultimos4Digitos" TEXT NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "diaFechamento" INTEGER NOT NULL,
    "limite" REAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "bancoId" INTEGER,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "CartaoCredito_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "Banco" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CartaoCredito_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CartaoCredito_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fatura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "valorTotal" REAL NOT NULL DEFAULT 0,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" DATETIME,
    "dataVencimento" DATETIME NOT NULL,
    "dataFechamento" DATETIME NOT NULL,
    "cartaoId" INTEGER NOT NULL,
    "contaFaturaId" INTEGER,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Fatura_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "CartaoCredito" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Fatura_contaFaturaId_fkey" FOREIGN KEY ("contaFaturaId") REFERENCES "Conta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Fatura_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Fatura_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoricoProLabore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "socioId" INTEGER NOT NULL,
    "socioNome" TEXT NOT NULL,
    "socioCpf" TEXT,
    "proLaboreBase" REAL NOT NULL,
    "totalDescontos" REAL NOT NULL,
    "proLaboreLiquido" REAL NOT NULL,
    "descontosPrevistos" REAL NOT NULL DEFAULT 0,
    "descontosPrevistosJson" TEXT,
    "descontosReais" REAL NOT NULL DEFAULT 0,
    "descontosReaisJson" TEXT,
    "descontosJson" TEXT,
    "contaGeradaId" INTEGER,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" DATETIME,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "HistoricoProLabore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistoricoProLabore_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "nomeFantasia" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Empresa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoricoParcelamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grupoParcelamentoId" TEXT NOT NULL,
    "contaMacroId" INTEGER,
    "tipoAlteracao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "snapshotAnterior" TEXT NOT NULL,
    "valorTotalAnterior" REAL,
    "valorTotalNovo" REAL,
    "qtdParcelasAnterior" INTEGER,
    "qtdParcelasNovo" INTEGER,
    "dataAlteracao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    CONSTRAINT "HistoricoParcelamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistoricoParcelamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
INSERT INTO "new_Banco" ("agencia", "ativo", "atualizadoEm", "chavePix", "codigo", "conta", "criadoEm", "id", "nome", "tipoChavePix") SELECT "agencia", "ativo", "atualizadoEm", "chavePix", "codigo", "conta", "criadoEm", "id", "nome", "tipoChavePix" FROM "Banco";
DROP TABLE "Banco";
ALTER TABLE "new_Banco" RENAME TO "Banco";
CREATE INDEX "Banco_userId_idx" ON "Banco"("userId");
CREATE INDEX "Banco_empresaId_idx" ON "Banco"("empresaId");
CREATE TABLE "new_Categoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    CONSTRAINT "Categoria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Categoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Categoria" ("ativo", "atualizadoEm", "criadoEm", "id", "nome", "tipo") SELECT "ativo", "atualizadoEm", "criadoEm", "id", "nome", "tipo" FROM "Categoria";
DROP TABLE "Categoria";
ALTER TABLE "new_Categoria" RENAME TO "Categoria";
CREATE INDEX "Categoria_tipo_idx" ON "Categoria"("tipo");
CREATE INDEX "Categoria_userId_idx" ON "Categoria"("userId");
CREATE INDEX "Categoria_empresaId_idx" ON "Categoria"("empresaId");
CREATE UNIQUE INDEX "Categoria_nome_tipo_empresaId_key" ON "Categoria"("nome", "tipo", "empresaId");
CREATE TABLE "new_CentroCusto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "previsto" REAL NOT NULL DEFAULT 0,
    "realizado" REAL NOT NULL DEFAULT 0,
    "parentId" INTEGER,
    "isSocio" BOOLEAN NOT NULL DEFAULT false,
    "cpfSocio" TEXT,
    "descontoPrevisto" REAL NOT NULL DEFAULT 0,
    "descontoReal" REAL NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "CentroCusto_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CentroCusto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CentroCusto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CentroCusto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CentroCusto" ("ativo", "atualizadoEm", "criadoEm", "id", "nome", "parentId", "previsto", "realizado", "sigla", "tipo") SELECT "ativo", "atualizadoEm", "criadoEm", "id", "nome", "parentId", "previsto", "realizado", "sigla", "tipo" FROM "CentroCusto";
DROP TABLE "CentroCusto";
ALTER TABLE "new_CentroCusto" RENAME TO "CentroCusto";
CREATE INDEX "CentroCusto_tipo_idx" ON "CentroCusto"("tipo");
CREATE INDEX "CentroCusto_ativo_idx" ON "CentroCusto"("ativo");
CREATE INDEX "CentroCusto_parentId_idx" ON "CentroCusto"("parentId");
CREATE INDEX "CentroCusto_isSocio_idx" ON "CentroCusto"("isSocio");
CREATE INDEX "CentroCusto_userId_idx" ON "CentroCusto"("userId");
CREATE INDEX "CentroCusto_empresaId_idx" ON "CentroCusto"("empresaId");
CREATE UNIQUE INDEX "CentroCusto_sigla_empresaId_key" ON "CentroCusto"("sigla", "empresaId");
CREATE TABLE "new_Conta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" DATETIME,
    "valorPago" REAL,
    "tipo" TEXT NOT NULL,
    "beneficiario" TEXT,
    "fonte" TEXT,
    "banco" TEXT,
    "categoria" TEXT,
    "subcategoria" TEXT,
    "formaPagamento" TEXT,
    "numeroDocumento" TEXT,
    "numeroParcela" TEXT,
    "codigoTipo" TEXT,
    "observacoes" TEXT,
    "comprovante" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "noFluxoCaixa" BOOLEAN NOT NULL DEFAULT false,
    "createdViaWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" REAL,
    "pessoaId" INTEGER,
    "cartaoId" INTEGER,
    "bancoContaId" INTEGER,
    "socioResponsavelId" INTEGER,
    "proLaboreProcessado" BOOLEAN NOT NULL DEFAULT false,
    "isContaMacro" BOOLEAN NOT NULL DEFAULT false,
    "grupoParcelamentoId" TEXT,
    "totalParcelas" INTEGER,
    "parentId" INTEGER,
    "valorTotal" REAL,
    "isRecorrente" BOOLEAN NOT NULL DEFAULT false,
    "frequencia" TEXT,
    "recorrenciaInicio" INTEGER,
    "recorrenciaFim" INTEGER,
    "recorrenciaAno" INTEGER,
    "recorrenciaDataInicio" DATETIME,
    "recorrenciaDataFim" DATETIME,
    "recorrenciaParentId" INTEGER,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Conta_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conta_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "CartaoCredito" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conta_bancoContaId_fkey" FOREIGN KEY ("bancoContaId") REFERENCES "Banco" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conta_socioResponsavelId_fkey" FOREIGN KEY ("socioResponsavelId") REFERENCES "CentroCusto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conta_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Conta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conta_recorrenciaParentId_fkey" FOREIGN KEY ("recorrenciaParentId") REFERENCES "Conta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Conta" ("aiConfidence", "atualizadoEm", "banco", "beneficiario", "categoria", "codigoTipo", "comprovante", "createdViaWhatsApp", "criadoEm", "dataPagamento", "descricao", "formaPagamento", "id", "noFluxoCaixa", "numeroDocumento", "numeroParcela", "observacoes", "pago", "pessoaId", "status", "subcategoria", "tipo", "valor", "vencimento") SELECT "aiConfidence", "atualizadoEm", "banco", "beneficiario", "categoria", "codigoTipo", "comprovante", "createdViaWhatsApp", "criadoEm", "dataPagamento", "descricao", "formaPagamento", "id", "noFluxoCaixa", "numeroDocumento", "numeroParcela", "observacoes", "pago", "pessoaId", "status", "subcategoria", "tipo", "valor", "vencimento" FROM "Conta";
DROP TABLE "Conta";
ALTER TABLE "new_Conta" RENAME TO "Conta";
CREATE INDEX "Conta_tipo_idx" ON "Conta"("tipo");
CREATE INDEX "Conta_status_idx" ON "Conta"("status");
CREATE INDEX "Conta_pago_idx" ON "Conta"("pago");
CREATE INDEX "Conta_vencimento_idx" ON "Conta"("vencimento");
CREATE INDEX "Conta_cartaoId_idx" ON "Conta"("cartaoId");
CREATE INDEX "Conta_socioResponsavelId_idx" ON "Conta"("socioResponsavelId");
CREATE INDEX "Conta_parentId_idx" ON "Conta"("parentId");
CREATE INDEX "Conta_grupoParcelamentoId_idx" ON "Conta"("grupoParcelamentoId");
CREATE INDEX "Conta_isContaMacro_idx" ON "Conta"("isContaMacro");
CREATE INDEX "Conta_isRecorrente_idx" ON "Conta"("isRecorrente");
CREATE INDEX "Conta_recorrenciaParentId_idx" ON "Conta"("recorrenciaParentId");
CREATE INDEX "Conta_bancoContaId_idx" ON "Conta"("bancoContaId");
CREATE INDEX "Conta_userId_idx" ON "Conta"("userId");
CREATE INDEX "Conta_empresaId_idx" ON "Conta"("empresaId");
CREATE TABLE "new_FluxoCaixa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dia" DATETIME NOT NULL,
    "codigoTipo" TEXT,
    "fornecedorCliente" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" REAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "fluxo" REAL NOT NULL,
    "contaId" INTEGER,
    "centroCustoSigla" TEXT,
    "bancoId" INTEGER,
    "cartaoId" INTEGER,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "FluxoCaixa_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FluxoCaixa_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "Banco" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FluxoCaixa_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "CartaoCredito" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FluxoCaixa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FluxoCaixa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FluxoCaixa" ("atualizadoEm", "bancoId", "centroCustoSigla", "codigoTipo", "contaId", "criadoEm", "dia", "fluxo", "fornecedorCliente", "id", "tipo", "valor") SELECT "atualizadoEm", "bancoId", "centroCustoSigla", "codigoTipo", "contaId", "criadoEm", "dia", "fluxo", "fornecedorCliente", "id", "tipo", "valor" FROM "FluxoCaixa";
DROP TABLE "FluxoCaixa";
ALTER TABLE "new_FluxoCaixa" RENAME TO "FluxoCaixa";
CREATE UNIQUE INDEX "FluxoCaixa_contaId_key" ON "FluxoCaixa"("contaId");
CREATE INDEX "FluxoCaixa_dia_idx" ON "FluxoCaixa"("dia");
CREATE INDEX "FluxoCaixa_tipo_idx" ON "FluxoCaixa"("tipo");
CREATE INDEX "FluxoCaixa_centroCustoSigla_idx" ON "FluxoCaixa"("centroCustoSigla");
CREATE INDEX "FluxoCaixa_bancoId_idx" ON "FluxoCaixa"("bancoId");
CREATE INDEX "FluxoCaixa_cartaoId_idx" ON "FluxoCaixa"("cartaoId");
CREATE INDEX "FluxoCaixa_userId_idx" ON "FluxoCaixa"("userId");
CREATE INDEX "FluxoCaixa_empresaId_idx" ON "FluxoCaixa"("empresaId");
CREATE TABLE "new_Pessoa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'fornecedor',
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "contato" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "chavePix" TEXT,
    "tipoChavePix" TEXT,
    "banco" TEXT,
    "agencia" TEXT,
    "contaBancaria" TEXT,
    "tipoConta" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    CONSTRAINT "Pessoa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pessoa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Pessoa" ("agencia", "atualizadoEm", "banco", "chavePix", "contaBancaria", "contato", "criadoEm", "id", "nome", "observacoes", "tipoConta") SELECT "agencia", "atualizadoEm", "banco", "chavePix", "contaBancaria", "contato", "criadoEm", "id", "nome", "observacoes", "tipoConta" FROM "Pessoa";
DROP TABLE "Pessoa";
ALTER TABLE "new_Pessoa" RENAME TO "Pessoa";
CREATE INDEX "Pessoa_userId_idx" ON "Pessoa"("userId");
CREATE INDEX "Pessoa_empresaId_idx" ON "Pessoa"("empresaId");
CREATE INDEX "Pessoa_tipo_idx" ON "Pessoa"("tipo");
CREATE INDEX "Pessoa_status_idx" ON "Pessoa"("status");
CREATE TABLE "new_WhatsAppMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiConfidence" REAL,
    "extractedData" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "contaId" INTEGER,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmationDate" DATETIME,
    "userId" INTEGER NOT NULL,
    "empresaId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhatsAppMessage_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WhatsAppMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WhatsAppMessage_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WhatsAppMessage" ("aiConfidence", "confirmationDate", "confirmed", "contaId", "createdAt", "errorMessage", "extractedData", "id", "message", "phoneNumber", "processedAt", "status", "updatedAt") SELECT "aiConfidence", "confirmationDate", "confirmed", "contaId", "createdAt", "errorMessage", "extractedData", "id", "message", "phoneNumber", "processedAt", "status", "updatedAt" FROM "WhatsAppMessage";
DROP TABLE "WhatsAppMessage";
ALTER TABLE "new_WhatsAppMessage" RENAME TO "WhatsAppMessage";
CREATE INDEX "WhatsAppMessage_phoneNumber_idx" ON "WhatsAppMessage"("phoneNumber");
CREATE INDEX "WhatsAppMessage_status_idx" ON "WhatsAppMessage"("status");
CREATE INDEX "WhatsAppMessage_createdAt_idx" ON "WhatsAppMessage"("createdAt");
CREATE INDEX "WhatsAppMessage_userId_idx" ON "WhatsAppMessage"("userId");
CREATE INDEX "WhatsAppMessage_empresaId_idx" ON "WhatsAppMessage"("empresaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DescontoRecorrente_socioId_idx" ON "DescontoRecorrente"("socioId");

-- CreateIndex
CREATE INDEX "DescontoRecorrente_ativo_idx" ON "DescontoRecorrente"("ativo");

-- CreateIndex
CREATE INDEX "DescontoRecorrente_userId_idx" ON "DescontoRecorrente"("userId");

-- CreateIndex
CREATE INDEX "DescontoRecorrente_empresaId_idx" ON "DescontoRecorrente"("empresaId");

-- CreateIndex
CREATE INDEX "CartaoCredito_ativo_idx" ON "CartaoCredito"("ativo");

-- CreateIndex
CREATE INDEX "CartaoCredito_bancoId_idx" ON "CartaoCredito"("bancoId");

-- CreateIndex
CREATE INDEX "CartaoCredito_userId_idx" ON "CartaoCredito"("userId");

-- CreateIndex
CREATE INDEX "CartaoCredito_empresaId_idx" ON "CartaoCredito"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_contaFaturaId_key" ON "Fatura"("contaFaturaId");

-- CreateIndex
CREATE INDEX "Fatura_cartaoId_idx" ON "Fatura"("cartaoId");

-- CreateIndex
CREATE INDEX "Fatura_pago_idx" ON "Fatura"("pago");

-- CreateIndex
CREATE INDEX "Fatura_anoReferencia_mesReferencia_idx" ON "Fatura"("anoReferencia", "mesReferencia");

-- CreateIndex
CREATE INDEX "Fatura_userId_idx" ON "Fatura"("userId");

-- CreateIndex
CREATE INDEX "Fatura_empresaId_idx" ON "Fatura"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Fatura_cartaoId_mesReferencia_anoReferencia_key" ON "Fatura"("cartaoId", "mesReferencia", "anoReferencia");

-- CreateIndex
CREATE INDEX "HistoricoProLabore_socioId_idx" ON "HistoricoProLabore"("socioId");

-- CreateIndex
CREATE INDEX "HistoricoProLabore_anoReferencia_mesReferencia_idx" ON "HistoricoProLabore"("anoReferencia", "mesReferencia");

-- CreateIndex
CREATE INDEX "HistoricoProLabore_pago_idx" ON "HistoricoProLabore"("pago");

-- CreateIndex
CREATE INDEX "HistoricoProLabore_userId_idx" ON "HistoricoProLabore"("userId");

-- CreateIndex
CREATE INDEX "HistoricoProLabore_empresaId_idx" ON "HistoricoProLabore"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricoProLabore_socioId_mesReferencia_anoReferencia_userId_key" ON "HistoricoProLabore"("socioId", "mesReferencia", "anoReferencia", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Empresa_userId_idx" ON "Empresa"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "HistoricoParcelamento_grupoParcelamentoId_idx" ON "HistoricoParcelamento"("grupoParcelamentoId");

-- CreateIndex
CREATE INDEX "HistoricoParcelamento_contaMacroId_idx" ON "HistoricoParcelamento"("contaMacroId");

-- CreateIndex
CREATE INDEX "HistoricoParcelamento_dataAlteracao_idx" ON "HistoricoParcelamento"("dataAlteracao");

-- CreateIndex
CREATE INDEX "HistoricoParcelamento_userId_idx" ON "HistoricoParcelamento"("userId");

-- CreateIndex
CREATE INDEX "HistoricoParcelamento_empresaId_idx" ON "HistoricoParcelamento"("empresaId");
