import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-user';
import { getEmpresaIdValidada } from '@/lib/get-empresa';

// GET - Listar todos os bancos do usuário
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const whereClause: any = { ativo: true, userId: user.id };
    if (empresaId) whereClause.empresaId = empresaId;

    const bancos = await prisma.banco.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(bancos);
  } catch (error) {
    console.error('Error fetching bancos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar bancos' },
      { status: 500 }
    );
  }
}

// POST - Criar novo banco
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();

    const createData: any = {
      nome: data.nome,
      codigo: data.codigo,
      agencia: data.agencia,
      conta: data.conta,
      chavePix: data.chavePix || null,
      tipoChavePix: data.tipoChavePix || null,
      userId: user.id,
      empresaId: empresaId || undefined,
    };

    if (data.saldoInicial !== undefined) {
      createData.saldoInicial = Number(data.saldoInicial);
    }
    if (data.limiteContaGarantida !== undefined) {
      createData.limiteContaGarantida = Number(data.limiteContaGarantida);
    }
    if (data.utilizadoContaGarantida !== undefined) {
      createData.utilizadoContaGarantida = Number(data.utilizadoContaGarantida);
    }
    if (data.limiteChequeEspecial !== undefined) {
      createData.limiteChequeEspecial = Number(data.limiteChequeEspecial);
    }
    if (data.utilizadoChequeEspecial !== undefined) {
      createData.utilizadoChequeEspecial = Number(data.utilizadoChequeEspecial);
    }
    if (data.saldoInvestimentoLiquido !== undefined) {
      createData.saldoInvestimentoLiquido = Number(data.saldoInvestimentoLiquido);
    }

    const banco = await prisma.banco.create({
      data: createData,
    });

    return NextResponse.json(banco, { status: 201 });
  } catch (error) {
    console.error('Error creating banco:', error);
    return NextResponse.json(
      { error: 'Erro ao criar banco' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar banco
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    let data;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }

    if (!data.id) {
      return NextResponse.json(
        { error: 'ID do banco é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o banco pertence ao usuário E empresa
    const whereClause: any = { id: data.id, userId: user.id };
    if (empresaId) whereClause.empresaId = empresaId;

    const existing = await prisma.banco.findFirst({
      where: whereClause,
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Banco não encontrado' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Campos editáveis do banco
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.codigo !== undefined) updateData.codigo = data.codigo;
    if (data.agencia !== undefined) updateData.agencia = data.agencia;
    if (data.conta !== undefined) updateData.conta = data.conta;
    if (data.chavePix !== undefined) updateData.chavePix = data.chavePix || null;
    if (data.tipoChavePix !== undefined) updateData.tipoChavePix = data.tipoChavePix || null;
    if (data.saldoInicial !== undefined) updateData.saldoInicial = Number(data.saldoInicial);
    if (data.limiteContaGarantida !== undefined) updateData.limiteContaGarantida = Number(data.limiteContaGarantida);
    if (data.utilizadoContaGarantida !== undefined) updateData.utilizadoContaGarantida = Number(data.utilizadoContaGarantida);
    if (data.limiteChequeEspecial !== undefined) updateData.limiteChequeEspecial = Number(data.limiteChequeEspecial);
    if (data.utilizadoChequeEspecial !== undefined) updateData.utilizadoChequeEspecial = Number(data.utilizadoChequeEspecial);
    if (data.saldoInvestimentoLiquido !== undefined) updateData.saldoInvestimentoLiquido = Number(data.saldoInvestimentoLiquido);

    // Conciliação bancária
    if (data.conciliar !== undefined) {
      updateData.conciliadoEm = data.conciliar ? new Date() : null;
    }

    const banco = await prisma.banco.update({
      where: { id: data.id },
      data: updateData,
    });

    return NextResponse.json(banco);
  } catch (error) {
    console.error('Error updating banco:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar banco' },
      { status: 500 }
    );
  }
}

// DELETE - Remover banco (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID do banco é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o banco pertence ao usuário
    const whereClause: any = { id, userId: user.id };
    if (empresaId) whereClause.empresaId = empresaId;

    const existing = await prisma.banco.findFirst({
      where: whereClause,
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Banco não encontrado' },
        { status: 404 }
      );
    }

    await prisma.banco.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banco:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar banco' },
      { status: 500 }
    );
  }
}
