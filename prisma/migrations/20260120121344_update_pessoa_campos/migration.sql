/*
  Warnings:

  - You are about to drop the column `cartao` on the `Pessoa` table. All the data in the column will be lost.
  - You are about to drop the column `outrosDados` on the `Pessoa` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pessoa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "contato" TEXT,
    "chavePix" TEXT,
    "banco" TEXT,
    "agencia" TEXT,
    "contaBancaria" TEXT,
    "tipoConta" TEXT,
    "observacoes" TEXT
);
INSERT INTO "new_Pessoa" ("chavePix", "contato", "id", "nome") SELECT "chavePix", "contato", "id", "nome" FROM "Pessoa";
DROP TABLE "Pessoa";
ALTER TABLE "new_Pessoa" RENAME TO "Pessoa";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
