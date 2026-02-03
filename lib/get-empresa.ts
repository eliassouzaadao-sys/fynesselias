import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";

const EMPRESA_COOKIE_NAME = "empresaAtiva";

/**
 * Get the active empresa ID from cookies
 * Returns null if no empresa is selected
 */
export async function getEmpresaAtiva(): Promise<number | null> {
  const cookieStore = await cookies();
  const empresaId = cookieStore.get(EMPRESA_COOKIE_NAME)?.value;

  if (!empresaId) {
    return null;
  }

  const id = parseInt(empresaId);
  if (isNaN(id)) {
    return null;
  }

  return id;
}

/**
 * Get the active empresa with validation that it belongs to the current user
 * Returns the empresa object or null if invalid/not found
 */
export async function getEmpresaAtivaComValidacao() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const empresaId = await getEmpresaAtiva();
  if (!empresaId) {
    // Try to get the user's first empresa as default
    const primeiraEmpresa = await prisma.empresa.findFirst({
      where: { userId: user.id, ativo: true },
      orderBy: { criadoEm: "asc" },
    });
    return primeiraEmpresa;
  }

  // Validate the empresa belongs to the user
  const empresa = await prisma.empresa.findFirst({
    where: {
      id: empresaId,
      userId: user.id,
      ativo: true,
    },
  });

  // If empresa not found or doesn't belong to user, try to get default
  if (!empresa) {
    const primeiraEmpresa = await prisma.empresa.findFirst({
      where: { userId: user.id, ativo: true },
      orderBy: { criadoEm: "asc" },
    });
    return primeiraEmpresa;
  }

  return empresa;
}

/**
 * Get empresaId with validation - helper for API routes
 * Returns empresaId or null
 */
export async function getEmpresaIdValidada(userId: number): Promise<number | null> {
  const empresaIdCookie = await getEmpresaAtiva();

  if (empresaIdCookie) {
    // Validate it belongs to user
    const empresa = await prisma.empresa.findFirst({
      where: {
        id: empresaIdCookie,
        userId: userId,
        ativo: true,
      },
      select: { id: true },
    });

    if (empresa) {
      return empresa.id;
    }
  }

  // Get default empresa
  const primeiraEmpresa = await prisma.empresa.findFirst({
    where: { userId: userId, ativo: true },
    orderBy: { criadoEm: "asc" },
    select: { id: true },
  });

  return primeiraEmpresa?.id || null;
}

/**
 * Create a default empresa for a new user
 */
export async function criarEmpresaPadrao(userId: number, nomeUsuario: string) {
  const empresaExistente = await prisma.empresa.findFirst({
    where: { userId },
  });

  if (empresaExistente) {
    return empresaExistente;
  }

  return prisma.empresa.create({
    data: {
      nome: `Empresa de ${nomeUsuario}`,
      userId,
    },
  });
}
