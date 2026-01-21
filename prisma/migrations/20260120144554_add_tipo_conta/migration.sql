-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "pessoaId" INTEGER,
    "tipo" TEXT NOT NULL DEFAULT 'pagar',
    CONSTRAINT "Conta_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Conta" ("atualizadoEm", "criadoEm", "descricao", "id", "pago", "pessoaId", "valor", "vencimento") SELECT "atualizadoEm", "criadoEm", "descricao", "id", "pago", "pessoaId", "valor", "vencimento" FROM "Conta";
DROP TABLE "Conta";
ALTER TABLE "new_Conta" RENAME TO "Conta";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
