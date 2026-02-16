import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// GET - Listar todos os cartões ativos do usuário
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const whereClause: any = { ativo: true, userId: user.id };
    if (empresaId) whereClause.empresaId = empresaId;

    const cartoes = await prisma.cartaoCredito.findMany({
      where: whereClause,
      include: {
        banco: true
      },
      orderBy: { nome: "asc" }
    });

    // Buscar IDs dos cartões para query única
    const cartaoIds = cartoes.map((c: typeof cartoes[number]) => c.id);

    // Query única para calcular limite utilizado de todos os cartões
    const contasWhere: any = {
      cartaoId: { in: cartaoIds },
      userId: user.id,
      pago: false,
      OR: [
        { totalParcelas: null }, // Contas simples
        { parentId: { not: null } }, // Parcelas individuais
      ]
    };
    if (empresaId) contasWhere.empresaId = empresaId;

    const contasAgrupadas = await prisma.conta.groupBy({
      by: ['cartaoId'],
      where: contasWhere,
      _sum: { valor: true }
    });

    // Criar mapa de limite utilizado por cartão
    const limiteUtilizadoMap = new Map<number, number>();
    for (const grupo of contasAgrupadas) {
      if (grupo.cartaoId) {
        limiteUtilizadoMap.set(grupo.cartaoId, grupo._sum.valor || 0);
      }
    }

    // Montar resposta com limite calculado
    const cartoesComLimite = cartoes.map((cartao: typeof cartoes[number]) => {
      const limiteUtilizado = limiteUtilizadoMap.get(cartao.id) || 0;
      return {
        ...cartao,
        limiteUtilizado,
        limiteDisponivel: cartao.limite - limiteUtilizado
      };
    });

    return NextResponse.json(cartoesComLimite);
  } catch (error) {
    console.error("Erro ao buscar cartões:", error);
    return NextResponse.json([]);
  }
}

// POST - Criar novo cartão
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    let data;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        { error: "JSON inválido" },
        { status: 400 }
      );
    }

    if (!data.nome?.trim()) {
      return NextResponse.json(
        { error: "Nome do cartão é obrigatório" },
        { status: 400 }
      );
    }

    const bandeirasValidas = ["visa", "mastercard", "elo", "amex", "hipercard", "diners"];
    if (data.bandeira && !bandeirasValidas.includes(data.bandeira.toLowerCase())) {
      return NextResponse.json(
        { error: "Bandeira inválida" },
        { status: 400 }
      );
    }

    const diaVencimento = parseInt(data.diaVencimento);
    if (isNaN(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
      return NextResponse.json(
        { error: "Dia de vencimento deve ser entre 1 e 31" },
        { status: 400 }
      );
    }

    const diaFechamento = parseInt(data.diaFechamento);
    if (isNaN(diaFechamento) || diaFechamento < 1 || diaFechamento > 31) {
      return NextResponse.json(
        { error: "Dia de fechamento deve ser entre 1 e 31" },
        { status: 400 }
      );
    }

    const limite = parseFloat(data.limite);
    if (isNaN(limite) || limite <= 0) {
      return NextResponse.json(
        { error: "Limite deve ser maior que zero" },
        { status: 400 }
      );
    }

    const cartao = await prisma.cartaoCredito.create({
      data: {
        nome: data.nome.trim(),
        bandeira: data.bandeira ? data.bandeira.toLowerCase() : "",
        ultimos4Digitos: data.ultimos4Digitos || "",
        diaVencimento,
        diaFechamento,
        limite,
        bancoId: data.bancoId ? parseInt(data.bancoId) : null,
        userId: user.id,
        empresaId: empresaId || undefined
      },
      include: { banco: true }
    });

    return NextResponse.json(cartao, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar cartão:", error);
    return NextResponse.json(
      { error: "Erro ao criar cartão" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cartão
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    let data;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        { error: "JSON inválido" },
        { status: 400 }
      );
    }

    if (!data.id) {
      return NextResponse.json(
        { error: "ID do cartão é obrigatório" },
        { status: 400 }
      );
    }

    const id = parseInt(data.id);

    // Verificar se cartão pertence ao usuário
    const whereClause: any = { id, userId: user.id };
    if (empresaId) whereClause.empresaId = empresaId;

    const cartaoExistente = await prisma.cartaoCredito.findFirst({
      where: whereClause
    });

    if (!cartaoExistente) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (data.nome?.trim()) {
      updateData.nome = data.nome.trim();
    }

    if (data.bandeira?.trim()) {
      const bandeirasValidas = ["visa", "mastercard", "elo", "amex", "hipercard", "diners"];
      if (!bandeirasValidas.includes(data.bandeira.toLowerCase())) {
        return NextResponse.json(
          { error: "Bandeira inválida" },
          { status: 400 }
        );
      }
      updateData.bandeira = data.bandeira.toLowerCase();
    }

    if (data.ultimos4Digitos !== undefined) {
      updateData.ultimos4Digitos = data.ultimos4Digitos || "";
    }

    if (data.diaVencimento !== undefined) {
      const diaVencimento = parseInt(data.diaVencimento);
      if (isNaN(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
        return NextResponse.json(
          { error: "Dia de vencimento deve ser entre 1 e 31" },
          { status: 400 }
        );
      }
      updateData.diaVencimento = diaVencimento;
    }

    if (data.diaFechamento !== undefined) {
      const diaFechamento = parseInt(data.diaFechamento);
      if (isNaN(diaFechamento) || diaFechamento < 1 || diaFechamento > 31) {
        return NextResponse.json(
          { error: "Dia de fechamento deve ser entre 1 e 31" },
          { status: 400 }
        );
      }
      updateData.diaFechamento = diaFechamento;
    }

    if (data.limite !== undefined) {
      const limite = parseFloat(data.limite);
      if (isNaN(limite) || limite <= 0) {
        return NextResponse.json(
          { error: "Limite deve ser maior que zero" },
          { status: 400 }
        );
      }
      updateData.limite = limite;
    }

    if (data.bancoId !== undefined) {
      updateData.bancoId = data.bancoId ? parseInt(data.bancoId) : null;
    }

    const cartao = await prisma.cartaoCredito.update({
      where: { id },
      data: updateData,
      include: { banco: true }
    });

    return NextResponse.json(cartao);
  } catch (error: any) {
    console.error("Erro ao atualizar cartão:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cartão" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do cartão é obrigatório" },
        { status: 400 }
      );
    }

    const cartaoId = parseInt(id);

    // Verificar se cartão pertence ao usuário
    const whereClause: any = { id: cartaoId, userId: user.id };
    if (empresaId) whereClause.empresaId = empresaId;

    const cartaoExistente = await prisma.cartaoCredito.findFirst({
      where: whereClause
    });

    if (!cartaoExistente) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    await prisma.cartaoCredito.update({
      where: { id: cartaoId },
      data: { ativo: false }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao desativar cartão:", error);
    return NextResponse.json(
      { error: "Erro ao desativar cartão" },
      { status: 500 }
    );
  }
}
