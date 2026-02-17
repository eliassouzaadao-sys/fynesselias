import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// GET - Buscar dados da empresa atual
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    if (empresaId) {
      // Buscar dados da empresa
      const empresa = await prisma.empresa.findFirst({
        where: {
          id: empresaId,
          userId: user.id,
        },
      });

      if (empresa) {
        return NextResponse.json({
          id: empresa.id,
          nome: empresa.nome,
          nomeFantasia: empresa.nomeFantasia,
          cnpj: empresa.cnpj,
          endereco: empresa.endereco,
          cidade: empresa.cidade,
          estado: empresa.estado,
          cep: empresa.cep,
          telefone: empresa.telefone,
          email: empresa.email,
        });
      }
    }

    // Se nao tiver empresa, retorna dados do usuario
    return NextResponse.json({
      id: null,
      nome: user.company || user.name || "Empresa",
      nomeFantasia: null,
      cnpj: null,
      endereco: null,
      cidade: null,
      estado: null,
      cep: null,
      telefone: user.phone,
      email: user.email,
    });
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json({ error: "Falha ao buscar empresa" }, { status: 500 });
  }
}
