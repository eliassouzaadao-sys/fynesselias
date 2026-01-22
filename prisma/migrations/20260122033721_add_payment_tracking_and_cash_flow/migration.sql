/*
  Warnings:

  - Added the required column `atualizadoEm` to the `Pessoa` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "WhatsAppMessage" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhatsAppMessage_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" DATETIME,
    "tipo" TEXT NOT NULL,
    "beneficiario" TEXT,
    "banco" TEXT,
    "categoria" TEXT,
    "formaPagamento" TEXT,
    "numeroDocumento" TEXT,
    "observacoes" TEXT,
    "comprovante" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "noFluxoCaixa" BOOLEAN NOT NULL DEFAULT false,
    "createdViaWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" REAL,
    "pessoaId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Conta_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Conta" ("atualizadoEm", "banco", "beneficiario", "criadoEm", "descricao", "id", "pago", "pessoaId", "tipo", "valor", "vencimento") SELECT "atualizadoEm", "banco", "beneficiario", "criadoEm", "descricao", "id", "pago", "pessoaId", "tipo", "valor", "vencimento" FROM "Conta";
DROP TABLE "Conta";
ALTER TABLE "new_Conta" RENAME TO "Conta";
CREATE INDEX "Conta_tipo_idx" ON "Conta"("tipo");
CREATE INDEX "Conta_status_idx" ON "Conta"("status");
CREATE INDEX "Conta_pago_idx" ON "Conta"("pago");
CREATE INDEX "Conta_vencimento_idx" ON "Conta"("vencimento");
CREATE TABLE "new_Pessoa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "contato" TEXT,
    "chavePix" TEXT,
    "banco" TEXT,
    "agencia" TEXT,
    "contaBancaria" TEXT,
    "tipoConta" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
INSERT INTO "new_Pessoa" ("agencia", "banco", "chavePix", "contaBancaria", "contato", "id", "nome", "observacoes", "tipoConta", "criadoEm", "atualizadoEm") SELECT "agencia", "banco", "chavePix", "contaBancaria", "contato", "id", "nome", "observacoes", "tipoConta", COALESCE("criadoEm", CURRENT_TIMESTAMP), CURRENT_TIMESTAMP FROM "Pessoa";
DROP TABLE "Pessoa";
ALTER TABLE "new_Pessoa" RENAME TO "Pessoa";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WhatsAppMessage_phoneNumber_idx" ON "WhatsAppMessage"("phoneNumber");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_status_idx" ON "WhatsAppMessage"("status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_createdAt_idx" ON "WhatsAppMessage"("createdAt");
