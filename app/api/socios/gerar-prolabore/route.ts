import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// POST - Gerar contas de pró-labore para todos os sócios do mês atual
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const data = await request.json().catch(() => ({}));
    const { mes, ano } = data;

    // Usar mês/ano atual se não fornecido
    const hoje = new Date();
    const mesReferencia = mes ?? hoje.getMonth() + 1; // 1-12
    const anoReferencia = ano ?? hoje.getFullYear();

    // Verificar se já existe histórico para este mês (evitar duplicação)
    const whereHistorico: any = {
      userId: user.id,
      mesReferencia,
      anoReferencia,
    };
    if (empresaId) whereHistorico.empresaId = empresaId;

    const historicoExistente = await prisma.historicoProLabore.findFirst({
      where: whereHistorico,
    });

    if (historicoExistente) {
      return NextResponse.json({
        error: `Pró-labore já foi gerado para ${mesReferencia.toString().padStart(2, '0')}/${anoReferencia}. Verifique o histórico.`,
        jaGerado: true
      }, { status: 400 });
    }

    // Buscar todos os sócios ativos do usuário
    const whereSocios: any = {
      userId: user.id,
      isSocio: true,
      ativo: true,
    };
    if (empresaId) whereSocios.empresaId = empresaId;

    const socios = await prisma.centroCusto.findMany({
      where: whereSocios,
    });

    if (socios.length === 0) {
      return NextResponse.json({
        error: "Nenhum sócio encontrado"
      }, { status: 404 });
    }

    const contasCriadas = [];
    const historicoCriado = [];
    const erros = [];

    // Para cada sócio, calcular os descontos e criar conta de pró-labore
    for (const socio of socios) {
      try {
        // 1. Buscar descontos recorrentes (previstos) ativos do sócio
        const whereDescontosRecorrentes: any = {
          socioId: socio.id,
          userId: user.id,
          ativo: true,
        };
        if (empresaId) whereDescontosRecorrentes.empresaId = empresaId;

        const descontosRecorrentes = await prisma.descontoRecorrente.findMany({
          where: whereDescontosRecorrentes,
          select: {
            id: true,
            nome: true,
            valor: true,
          },
        });

        const descontosPrevistos = descontosRecorrentes.reduce((acc, d) => acc + Number(d.valor), 0);

        // 2. Buscar contas pagas vinculadas a este sócio que ainda NÃO foram processadas (descontos reais)
        const whereContas: any = {
          userId: user.id,
          socioResponsavelId: socio.id,
          pago: true,
          proLaboreProcessado: false, // Apenas contas não processadas
        };
        if (empresaId) whereContas.empresaId = empresaId;

        const contasPagasMes = await prisma.conta.findMany({
          where: whereContas,
          select: {
            id: true,
            descricao: true,
            valor: true,
            dataPagamento: true,
            parentId: true,
            totalParcelas: true,
          },
        });

        // Filtrar: excluir contas pai de parcelamento
        const contasValidas = contasPagasMes.filter(c => {
          if (c.parentId !== null) return true;
          if (c.parentId === null && c.totalParcelas === null) return true;
          return false;
        });

        const descontosReais = contasValidas.reduce((acc, c) => acc + Number(c.valor), 0);

        // Total de descontos = previstos + reais
        const totalDescontos = descontosPrevistos + descontosReais;
        const proLaboreBase = socio.previsto || 0;
        const proLaboreLiquido = proLaboreBase - totalDescontos;

        // Criar conta a pagar do pró-labore
        const contaProLabore = await prisma.conta.create({
          data: {
            descricao: `Pró-labore ${socio.nome} - ${mesReferencia.toString().padStart(2, '0')}/${anoReferencia}`,
            valor: proLaboreLiquido,
            vencimento: new Date(anoReferencia, mesReferencia, 0, 12, 0, 0), // Último dia do mês
            tipo: "pagar",
            categoria: "Pró-labore",
            subcategoria: socio.nome,
            codigoTipo: "PRO-LABORE",
            observacoes: `Pró-labore Base: R$ ${proLaboreBase.toFixed(2)} | Descontos Previstos: R$ ${descontosPrevistos.toFixed(2)} | Descontos Reais: R$ ${descontosReais.toFixed(2)} | Total Descontos: R$ ${totalDescontos.toFixed(2)} | Líquido: R$ ${proLaboreLiquido.toFixed(2)}`,
            pago: false,
            status: "pendente",
            userId: user.id,
            empresaId: empresaId || undefined,
          },
        });

        // Preparar detalhes dos descontos previstos (recorrentes)
        const descontosPrevistosDetalhes = descontosRecorrentes.map(d => ({
          id: d.id,
          nome: d.nome,
          valor: d.valor,
        }));

        // Preparar detalhes dos descontos reais (contas pagas)
        const descontosReaisDetalhes = contasValidas.map(c => ({
          id: c.id,
          descricao: c.descricao,
          valor: c.valor,
          dataPagamento: c.dataPagamento,
        }));

        // Criar registro no histórico
        const historico = await prisma.historicoProLabore.create({
          data: {
            mesReferencia,
            anoReferencia,
            socioId: socio.id,
            socioNome: socio.nome,
            socioCpf: socio.cpfSocio,
            proLaboreBase,
            totalDescontos,
            proLaboreLiquido,
            // Novos campos para separar descontos
            descontosPrevistos,
            descontosPrevistosJson: JSON.stringify(descontosPrevistosDetalhes),
            descontosReais,
            descontosReaisJson: JSON.stringify(descontosReaisDetalhes),
            // Campo antigo para retrocompatibilidade
            descontosJson: JSON.stringify([...descontosPrevistosDetalhes, ...descontosReaisDetalhes]),
            contaGeradaId: contaProLabore.id,
            pago: false,
            userId: user.id,
            empresaId: empresaId || undefined,
          },
        });

        // Marcar todas as contas usadas como processadas (para não contar novamente)
        if (contasValidas.length > 0) {
          await prisma.conta.updateMany({
            where: {
              id: { in: contasValidas.map(c => c.id) },
            },
            data: {
              proLaboreProcessado: true,
            },
          });
        }

        contasCriadas.push({
          socio: socio.nome,
          proLaboreBase,
          descontosPrevistos,
          descontosReais,
          totalDescontos,
          proLaboreLiquido,
          contaId: contaProLabore.id,
          contasProcessadas: contasValidas.length,
          descontosRecorrentesCount: descontosRecorrentes.length,
        });

        historicoCriado.push({
          historicoId: historico.id,
          socio: socio.nome,
        });

        // Zerar o campo realizado do sócio para o próximo mês
        await prisma.centroCusto.update({
          where: { id: socio.id },
          data: { realizado: 0 },
        });

      } catch (err: any) {
        erros.push({
          socio: socio.nome,
          erro: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pró-labore gerado para ${contasCriadas.length} sócio(s)`,
      mesReferencia,
      anoReferencia,
      contasCriadas,
      historicoCriado,
      erros: erros.length > 0 ? erros : undefined,
    });

  } catch (error: any) {
    console.error("Erro ao gerar pró-labore:", error);
    return NextResponse.json({
      error: "Falha ao gerar pró-labore",
      details: error.message
    }, { status: 500 });
  }
}

// GET - Verificar se pró-labore já foi gerado para um mês
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");

    const hoje = new Date();
    const mesReferencia = mes ? parseInt(mes) : hoje.getMonth() + 1;
    const anoReferencia = ano ? parseInt(ano) : hoje.getFullYear();

    // Verificar pelo histórico (mais confiável)
    const whereHistorico: any = {
      userId: user.id,
      mesReferencia,
      anoReferencia,
    };
    if (empresaId) whereHistorico.empresaId = empresaId;

    const historico = await prisma.historicoProLabore.findMany({
      where: whereHistorico,
      select: {
        id: true,
        socioNome: true,
        proLaboreBase: true,
        totalDescontos: true,
        proLaboreLiquido: true,
        pago: true,
        contaGeradaId: true,
      },
    });

    return NextResponse.json({
      mesReferencia,
      anoReferencia,
      jaGerado: historico.length > 0,
      quantidade: historico.length,
      historico,
    });

  } catch (error: any) {
    console.error("Erro ao verificar pró-labore:", error);
    return NextResponse.json({
      error: "Falha ao verificar pró-labore"
    }, { status: 500 });
  }
}
