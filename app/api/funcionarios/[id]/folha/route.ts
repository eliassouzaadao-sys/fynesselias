import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// GET - Histórico de folha do funcionário
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const { id } = await params;
    const funcionarioId = parseInt(id);

    // Verificar se funcionário pertence ao usuário
    const whereFuncionario: any = { id: funcionarioId, userId: user.id };
    if (empresaId) whereFuncionario.empresaId = empresaId;

    const funcionario = await prisma.funcionario.findFirst({
      where: whereFuncionario,
    });

    if (!funcionario) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    // Buscar histórico de folha
    const whereHistorico: any = {
      funcionarioId,
      userId: user.id,
    };
    if (empresaId) whereHistorico.empresaId = empresaId;

    const historico = await prisma.historicoFolha.findMany({
      where: whereHistorico,
      orderBy: [
        { anoReferencia: "desc" },
        { mesReferencia: "desc" },
      ],
    });

    return NextResponse.json({
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        cargo: funcionario.cargo,
        salarioBruto: funcionario.salarioBruto,
        status: funcionario.status,
      },
      historico,
    });
  } catch (error) {
    console.error("Error fetching histórico de folha:", error);
    return NextResponse.json({ error: "Falha ao buscar histórico" }, { status: 500 });
  }
}

// POST - Gerar/registrar folha do mês
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const { id } = await params;
    const funcionarioId = parseInt(id);

    const data = await request.json();
    const {
      mesReferencia,
      anoReferencia,
      salarioBruto,
      inss,
      irrf,
      fgts,
      valeTransporte,
      valeRefeicao,
      planoSaude,
      outrosDescontos = 0,
      pago = false,
      dataPagamento,
    } = data;

    // Validações
    if (!mesReferencia || !anoReferencia) {
      return NextResponse.json(
        { error: "Mês e ano de referência são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se funcionário pertence ao usuário
    const whereFuncionario: any = { id: funcionarioId, userId: user.id };
    if (empresaId) whereFuncionario.empresaId = empresaId;

    const funcionario = await prisma.funcionario.findFirst({
      where: whereFuncionario,
    });

    if (!funcionario) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    // Usar valores do funcionário se não fornecidos
    const valorSalarioBruto = salarioBruto !== undefined ? parseFloat(salarioBruto) : funcionario.salarioBruto;
    const valorInss = inss !== undefined ? parseFloat(inss) : funcionario.inss;
    const valorIrrf = irrf !== undefined ? parseFloat(irrf) : funcionario.irrf;
    const valorFgts = fgts !== undefined ? parseFloat(fgts) : funcionario.fgts;
    const valorVT = valeTransporte !== undefined ? parseFloat(valeTransporte) : funcionario.valeTransporte;
    const valorVR = valeRefeicao !== undefined ? parseFloat(valeRefeicao) : funcionario.valeRefeicao;
    const valorPlanoSaude = planoSaude !== undefined ? parseFloat(planoSaude) : funcionario.planoSaude;
    const valorOutrosDescontos = parseFloat(outrosDescontos) || 0;

    // Calcular líquido e custo empresa
    const descontosTotal = valorInss + valorIrrf + valorOutrosDescontos;
    const salarioLiquido = valorSalarioBruto - descontosTotal;
    const custoEmpresa = valorSalarioBruto + valorFgts + valorVR + valorPlanoSaude;

    // Verificar se já existe histórico para este mês
    const whereExisting: any = {
      funcionarioId,
      mesReferencia: parseInt(mesReferencia),
      anoReferencia: parseInt(anoReferencia),
    };

    const existingHistorico = await prisma.historicoFolha.findFirst({
      where: whereExisting,
    });

    let historicoFolha;
    let contaGerada = null;

    if (existingHistorico) {
      // Atualizar histórico existente
      historicoFolha = await prisma.historicoFolha.update({
        where: { id: existingHistorico.id },
        data: {
          salarioBruto: valorSalarioBruto,
          inss: valorInss,
          irrf: valorIrrf,
          fgts: valorFgts,
          valeTransporte: valorVT,
          valeRefeicao: valorVR,
          planoSaude: valorPlanoSaude,
          outrosDescontos: valorOutrosDescontos,
          salarioLiquido,
          custoEmpresa,
          pago,
          dataPagamento: pago && dataPagamento ? new Date(dataPagamento) : null,
        },
      });
    } else {
      // Criar novo histórico
      historicoFolha = await prisma.historicoFolha.create({
        data: {
          mesReferencia: parseInt(mesReferencia),
          anoReferencia: parseInt(anoReferencia),
          funcionarioId,
          funcionarioNome: funcionario.nome,
          funcionarioCpf: funcionario.cpf,
          salarioBruto: valorSalarioBruto,
          inss: valorInss,
          irrf: valorIrrf,
          fgts: valorFgts,
          valeTransporte: valorVT,
          valeRefeicao: valorVR,
          planoSaude: valorPlanoSaude,
          outrosDescontos: valorOutrosDescontos,
          salarioLiquido,
          custoEmpresa,
          pago,
          dataPagamento: pago && dataPagamento ? new Date(dataPagamento) : null,
          userId: user.id,
          empresaId: empresaId || undefined,
        },
      });
    }

    // Se marcou como pago e não tem conta vinculada, gerar conta a pagar
    if (pago && !historicoFolha.contaGeradaId) {
      const mesStr = mesReferencia.toString().padStart(2, '0');
      const ultimoDiaMes = new Date(parseInt(anoReferencia), parseInt(mesReferencia), 0, 12, 0, 0);

      contaGerada = await prisma.conta.create({
        data: {
          descricao: `Salário ${funcionario.nome} - ${mesStr}/${anoReferencia}`,
          valor: salarioLiquido,
          vencimento: ultimoDiaMes,
          tipo: "pagar",
          categoria: "Folha de Pagamento",
          subcategoria: funcionario.cargo || "Funcionário",
          beneficiario: funcionario.nome,
          observacoes: `Folha de pagamento - ${funcionario.nome} (CPF: ${funcionario.cpf})`,
          pago: true,
          dataPagamento: dataPagamento ? new Date(dataPagamento) : new Date(),
          status: "pago",
          userId: user.id,
          empresaId: empresaId || undefined,
        },
      });

      // Atualizar histórico com ID da conta
      await prisma.historicoFolha.update({
        where: { id: historicoFolha.id },
        data: { contaGeradaId: contaGerada.id },
      });

      console.log(`✅ Folha de ${funcionario.nome} paga - Conta gerada (ID: ${contaGerada.id})`);
    }

    return NextResponse.json({
      historicoFolha,
      contaGerada,
    }, { status: existingHistorico ? 200 : 201 });
  } catch (error: any) {
    console.error("Error creating/updating folha:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe registro de folha para este mês" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Falha ao registrar folha" }, { status: 500 });
  }
}
