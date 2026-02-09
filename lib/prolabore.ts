import prisma from "@/lib/prisma";

/**
 * Atualiza a conta de pró-labore do mês atual de um sócio,
 * recalculando o valor líquido com base nos descontos.
 */
export async function atualizarContaProLabore(
  socioId: number,
  userId: number,
  empresaId?: number | null
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔄 atualizarContaProLabore chamada para sócio ID: ${socioId}`);
  console.log(`   userId: ${userId}, empresaId: ${empresaId}`);

  try {
    // Buscar o sócio
    const whereSocio: any = { id: socioId, userId, isSocio: true };
    if (empresaId) whereSocio.empresaId = empresaId;

    console.log(`🔍 Buscando sócio com:`, whereSocio);

    const socio = await prisma.centroCusto.findFirst({
      where: whereSocio,
    });

    if (!socio) {
      console.log(`⚠️ Sócio ${socioId} não encontrado`);
      return null;
    }

    console.log(`✅ Sócio encontrado: ${socio.nome} (sigla: ${socio.sigla})`);

    const proLaboreBase = socio.previsto || 0;
    console.log(`💰 Pró-labore base (previsto): R$ ${proLaboreBase}`);

    // Calcular mês/ano atual
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    const inicioMes = new Date(anoAtual, mesAtual - 1, 1);
    const fimMes = new Date(anoAtual, mesAtual, 0, 23, 59, 59);

    // 1. Buscar descontos recorrentes ativos
    const whereDescontos: any = {
      socioId: socio.id,
      userId,
      ativo: true,
    };
    if (empresaId) whereDescontos.empresaId = empresaId;

    const descontosRecorrentes = await prisma.descontoRecorrente.findMany({
      where: whereDescontos,
    });

    const totalDescontosRecorrentes = descontosRecorrentes.reduce(
      (acc: number, d: any) => acc + Number(d.valor),
      0
    );

    // 2. Buscar TODAS as contas vinculadas ao sócio (por socioResponsavelId OU codigoTipo)
    // Excluindo a própria conta de pró-labore
    // IMPORTANTE: Usar OR para incluir contas com categoria null (não é "Pró-labore")
    const whereContas: any = {
      userId,
      OR: [
        { categoria: null }, // Contas sem categoria definida
        { categoria: { not: "Pró-labore" } }, // Contas com categoria diferente de Pró-labore
      ],
      isContaMacro: false, // Excluir contas macro (só contar as individuais)
    };
    if (empresaId) whereContas.empresaId = empresaId;

    const todasContas = await prisma.conta.findMany({
      where: whereContas,
      select: {
        id: true,
        valor: true,
        pago: true,
        codigoTipo: true,
        socioResponsavelId: true,
        proLaboreProcessado: true,
        descricao: true,
      },
    });

    console.log(`📋 Total de contas encontradas (exceto pró-labore): ${todasContas.length}`);

    // Filtrar contas vinculadas ao sócio
    const contasDoSocio = todasContas.filter((c: any) => {
      const vinculadoPorSocioId = c.socioResponsavelId === socio.id;
      const vinculadoPorCodigo = c.codigoTipo === socio.sigla;
      if (vinculadoPorSocioId || vinculadoPorCodigo) {
        console.log(`   ✓ Conta ${c.id} vinculada: "${c.descricao}" (valor: ${c.valor}, pago: ${c.pago}, socioResponsavelId: ${c.socioResponsavelId}, codigoTipo: ${c.codigoTipo})`);
      }
      return vinculadoPorSocioId || vinculadoPorCodigo;
    });

    console.log(`📊 Contas vinculadas ao sócio ${socio.nome}: ${contasDoSocio.length}`);

    // Separar pendentes e pagas
    const contasPendentes = contasDoSocio.filter((c: any) => !c.pago);
    const contasPagas = contasDoSocio.filter((c: any) => c.pago && !c.proLaboreProcessado);

    const descontosVariaveisMes = contasPendentes.reduce(
      (acc: number, c: any) => acc + Number(c.valor),
      0
    );

    const descontosReais = contasPagas.reduce(
      (acc: number, c: any) => acc + Number(c.valor),
      0
    );

    // 3. Buscar lançamentos diretos no fluxo de caixa (sem contaId) vinculados ao sócio no mês atual
    const whereFluxoDireto: any = {
      userId,
      centroCustoSigla: socio.sigla,
      tipo: "saida",
      contaId: null,
      dia: {
        gte: inicioMes,
        lte: fimMes,
      },
    };
    if (empresaId) whereFluxoDireto.empresaId = empresaId;

    const fluxosDiretos = await prisma.fluxoCaixa.findMany({
      where: whereFluxoDireto,
      select: { id: true, valor: true },
    });

    const descontosFluxoDireto = fluxosDiretos.reduce(
      (acc: number, f: any) => acc + Number(f.valor),
      0
    );

    // Total de descontos
    const totalDescontos = totalDescontosRecorrentes + descontosVariaveisMes + descontosReais + descontosFluxoDireto;
    const proLaboreLiquido = proLaboreBase - totalDescontos;

    console.log(`📊 Cálculo pró-labore ${socio.nome}:`, {
      proLaboreBase,
      descontosRecorrentes: totalDescontosRecorrentes,
      descontosVariaveis: descontosVariaveisMes,
      descontosReais,
      descontosFluxoDireto,
      totalDescontos,
      proLaboreLiquido,
      contasPendentesCount: contasPendentes.length,
      contasPagasCount: contasPagas.length,
      fluxosDiretosCount: fluxosDiretos.length,
    });

    // Buscar a conta de pró-labore do sócio (não paga)
    console.log(`\n🔍 Buscando conta de pró-labore para sócio: ${socio.nome} (sigla: ${socio.sigla})`);

    const whereContaProLabore: any = {
      userId,
      categoria: "Pró-labore",
      pago: false,
      OR: [
        { codigoTipo: socio.sigla },
        { beneficiario: socio.nome },
        { descricao: { contains: socio.nome } },
      ],
    };
    if (empresaId) whereContaProLabore.empresaId = empresaId;

    console.log(`   Critérios: categoria="Pró-labore", pago=false, codigoTipo="${socio.sigla}" OU beneficiario="${socio.nome}" OU descricao contém "${socio.nome}"`);

    // Buscar conta de pró-labore
    let contaProLabore = await prisma.conta.findFirst({
      where: whereContaProLabore,
      orderBy: { vencimento: "desc" },
    });

    // Debug: listar todas as contas de pró-labore para ver o que existe
    const todasContasProlabore = await prisma.conta.findMany({
      where: {
        userId,
        categoria: "Pró-labore",
        pago: false,
      },
      select: { id: true, descricao: true, beneficiario: true, codigoTipo: true, valor: true },
    });
    console.log(`   Todas as contas de pró-labore não pagas (${todasContasProlabore.length}):`, todasContasProlabore);

    if (contaProLabore) {
      console.log(`✅ Conta de pró-labore ENCONTRADA: ID ${contaProLabore.id}, valor atual: R$ ${contaProLabore.valor}`);

      // Atualizar o valor da conta
      const contaAtualizada = await prisma.conta.update({
        where: { id: contaProLabore.id },
        data: {
          valor: proLaboreLiquido,
          observacoes: `Pró-labore Base: R$ ${proLaboreBase.toFixed(2)} | Descontos Recorrentes: R$ ${totalDescontosRecorrentes.toFixed(2)} | Descontos Variáveis: R$ ${descontosVariaveisMes.toFixed(2)} | Descontos Reais (Contas): R$ ${descontosReais.toFixed(2)} | Descontos Fluxo Direto: R$ ${descontosFluxoDireto.toFixed(2)} | Total Descontos: R$ ${totalDescontos.toFixed(2)} | Líquido: R$ ${proLaboreLiquido.toFixed(2)}`,
        },
      });

      console.log(
        `✅ Conta de pró-labore ${contaAtualizada.id} ATUALIZADA: R$ ${proLaboreLiquido.toFixed(2)} (Base: ${proLaboreBase} - Descontos: ${totalDescontos})`
      );
      console.log(`${"=".repeat(60)}\n`);

      return contaAtualizada;
    } else {
      console.log(`❌ Conta de pró-labore NÃO ENCONTRADA para sócio ${socio.nome}`);
      console.log(`   Verifique se existe uma conta com categoria="Pró-labore" vinculada a este sócio`);
      console.log(`${"=".repeat(60)}\n`);
      return null;
    }
  } catch (error) {
    console.error("Erro ao atualizar conta de pró-labore:", error);
    return null;
  }
}

/**
 * Atualiza o pró-labore de todos os sócios do usuário.
 * Útil para garantir que tudo esteja sincronizado.
 */
export async function atualizarTodosProlabores(
  userId: number,
  empresaId?: number | null
) {
  try {
    const whereSocios: any = { userId, isSocio: true };
    if (empresaId) whereSocios.empresaId = empresaId;

    const socios = await prisma.centroCusto.findMany({
      where: whereSocios,
    });

    console.log(`🔄 Atualizando pró-labore de ${socios.length} sócios...`);

    for (const socio of socios) {
      await atualizarContaProLabore(socio.id, userId, empresaId);
    }

    console.log(`✅ Todos os pró-labores atualizados`);
  } catch (error) {
    console.error("Erro ao atualizar todos os pró-labores:", error);
  }
}
