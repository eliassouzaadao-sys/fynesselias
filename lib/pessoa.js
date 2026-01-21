import prisma from "@/lib/prisma";

export async function getPessoas() {
  return prisma.pessoa.findMany();
}

export async function createPessoa(data) {
  return prisma.pessoa.create({ data });
}
