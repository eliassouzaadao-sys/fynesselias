import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";
import { Funcionario } from "@prisma/client";

// GET - Lista todos os funcionários do usuário
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    // Extrair parâmetros de filtro da URL
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // ativo, ferias, afastado, demitido
    const dataInicioParam = searchParams.get('dataInicio');
    const dataFimParam = searchParams.get('dataFim');

    // Construir filtro base
    const where: any = {
      userId: user.id,
    };
    if (empresaId) where.empresaId = empresaId;
    if (status) where.status = status;

    // Buscar funcionários
    const funcionarios = await prisma.funcionario.findMany({
      where,
      orderBy: { nome: "asc" },
    });

    // Calcular período para folha
    const hoje = new Date();
    let inicioMes: Date;
    let fimMes: Date;

    if (dataInicioParam && dataFimParam) {
      inicioMes = new Date(dataInicioParam + 'T00:00:00');
      fimMes = new Date(dataFimParam + 'T23:59:59');
    } else {
      inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
    }

    const mesReferencia = inicioMes.getMonth() + 1;
    const anoReferencia = inicioMes.getFullYear();

    // Calcular valores para cada funcionário
    const funcionariosComFolha = await Promise.all(
      funcionarios.map(async (func: Funcionario) => {
        // Buscar histórico do mês atual (se existir)
        const whereHistorico: any = {
          funcionarioId: func.id,
          mesReferencia,
          anoReferencia,
          userId: user.id,
        };
        if (empresaId) whereHistorico.empresaId = empresaId;

        const historicoMes = await prisma.historicoFolha.findFirst({
          where: whereHistorico,
        });

        // Calcular valores
        const salarioBruto = func.salarioBruto;
        const inss = func.inss;
        const irrf = func.irrf;
        const fgts = func.fgts;
        const valeTransporte = func.valeTransporte;
        const valeRefeicao = func.valeRefeicao;
        const planoSaude = func.planoSaude;
        const outrosBeneficios = func.outrosBeneficios;

        // Salário líquido = Bruto - INSS - IRRF - VT (desconto)
        const descontosTotal = inss + irrf + (valeTransporte * 0.06); // VT é 6% do salário
        const salarioLiquido = salarioBruto - descontosTotal;

        // Custo para empresa = Bruto + FGTS + VR + Plano Saúde + Outros
        const custoEmpresa = salarioBruto + fgts + valeRefeicao + planoSaude + outrosBeneficios;

        return {
          ...func,
          salarioLiquido,
          custoEmpresa,
          descontosTotal,
          folhaMes: historicoMes,
          pago: historicoMes?.pago || false,
        };
      })
    );

    return NextResponse.json(funcionariosComFolha);
  } catch (error) {
    console.error("Error fetching funcionários:", error);
    return NextResponse.json({ error: "Falha ao buscar funcionários" }, { status: 500 });
  }
}

// POST - Criar novo funcionário
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();
    const {
      nome,
      cpf,
      cargo,
      dataAdmissao,
      salarioBruto,
      valeTransporte = 0,
      valeRefeicao = 0,
      planoSaude = 0,
      outrosBeneficios = 0,
      inss = 0,
      irrf = 0,
      fgts = 0,
    } = data;

    // Validações
    if (!nome || !cpf || !salarioBruto) {
      return NextResponse.json(
        { error: "Nome, CPF e salário bruto são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se CPF já existe
    const whereExistingCpf: any = { cpf, userId: user.id };
    if (empresaId) whereExistingCpf.empresaId = empresaId;

    const existingCpf = await prisma.funcionario.findFirst({
      where: whereExistingCpf,
    });

    if (existingCpf) {
      return NextResponse.json(
        { error: "Já existe um funcionário com este CPF" },
        { status: 400 }
      );
    }

    const funcionario = await prisma.funcionario.create({
      data: {
        nome,
        cpf,
        cargo: cargo || null,
        dataAdmissao: dataAdmissao ? new Date(dataAdmissao) : new Date(),
        status: "ativo",
        salarioBruto: parseFloat(salarioBruto),
        valeTransporte: parseFloat(valeTransporte) || 0,
        valeRefeicao: parseFloat(valeRefeicao) || 0,
        planoSaude: parseFloat(planoSaude) || 0,
        outrosBeneficios: parseFloat(outrosBeneficios) || 0,
        inss: parseFloat(inss) || 0,
        irrf: parseFloat(irrf) || 0,
        fgts: parseFloat(fgts) || 0,
        userId: user.id,
        empresaId: empresaId || undefined,
      },
    });

    console.log(`✅ Funcionário ${nome} criado com sucesso (ID: ${funcionario.id})`);

    return NextResponse.json(funcionario, { status: 201 });
  } catch (error: any) {
    console.error("Error creating funcionário:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um funcionário com este CPF" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Falha ao criar funcionário" }, { status: 500 });
  }
}

// PUT - Atualizar funcionário
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json();
    const {
      id,
      nome,
      cpf,
      cargo,
      dataAdmissao,
      dataDemissao,
      status,
      salarioBruto,
      valeTransporte,
      valeRefeicao,
      planoSaude,
      outrosBeneficios,
      inss,
      irrf,
      fgts,
    } = data;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const idNum = typeof id === 'number' ? id : parseInt(id);

    // Verificar se pertence ao usuário
    const whereExisting: any = { id: idNum, userId: user.id };
    if (empresaId) whereExisting.empresaId = empresaId;

    const existing = await prisma.funcionario.findFirst({
      where: whereExisting,
    });

    if (!existing) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    // Se CPF mudou, verificar duplicidade
    if (cpf && cpf !== existing.cpf) {
      const whereCpf: any = {
        cpf,
        userId: user.id,
        id: { not: idNum },
      };
      if (empresaId) whereCpf.empresaId = empresaId;

      const cpfExistente = await prisma.funcionario.findFirst({
        where: whereCpf,
      });

      if (cpfExistente) {
        return NextResponse.json(
          { error: "Já existe outro funcionário com este CPF" },
          { status: 400 }
        );
      }
    }

    const funcionario = await prisma.funcionario.update({
      where: { id: idNum },
      data: {
        nome: nome || undefined,
        cpf: cpf || undefined,
        cargo: cargo !== undefined ? cargo : undefined,
        dataAdmissao: dataAdmissao ? new Date(dataAdmissao) : undefined,
        dataDemissao: dataDemissao ? new Date(dataDemissao) : undefined,
        status: status || undefined,
        salarioBruto: salarioBruto !== undefined ? parseFloat(salarioBruto) : undefined,
        valeTransporte: valeTransporte !== undefined ? parseFloat(valeTransporte) : undefined,
        valeRefeicao: valeRefeicao !== undefined ? parseFloat(valeRefeicao) : undefined,
        planoSaude: planoSaude !== undefined ? parseFloat(planoSaude) : undefined,
        outrosBeneficios: outrosBeneficios !== undefined ? parseFloat(outrosBeneficios) : undefined,
        inss: inss !== undefined ? parseFloat(inss) : undefined,
        irrf: irrf !== undefined ? parseFloat(irrf) : undefined,
        fgts: fgts !== undefined ? parseFloat(fgts) : undefined,
      },
    });

    return NextResponse.json(funcionario);
  } catch (error: any) {
    console.error("Error updating funcionário:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ error: "Falha ao atualizar funcionário" }, { status: 500 });
  }
}

// DELETE - Excluir funcionário permanentemente
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Verificar se pertence ao usuário
    const whereDelete: any = { id: parseInt(id), userId: user.id };
    if (empresaId) whereDelete.empresaId = empresaId;

    const existing = await prisma.funcionario.findFirst({
      where: whereDelete,
    });

    if (!existing) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    // Excluir histórico de folha do funcionário primeiro
    await prisma.historicoFolha.deleteMany({
      where: { funcionarioId: parseInt(id) },
    });

    // Excluir funcionário permanentemente
    await prisma.funcionario.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting funcionário:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ error: "Falha ao excluir funcionário" }, { status: 500 });
  }
}
