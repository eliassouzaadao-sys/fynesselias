import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/get-user";
import { getEmpresaIdValidada } from "@/lib/get-empresa";

// Meses do ano
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Frequências suportadas
type Frequencia = "semanal" | "quinzenal" | "mensal" | "anual";

// Helper para parsear data local
function parseLocalDate(dateStr: string): Date {
  if (dateStr && dateStr.includes('-') && dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  return new Date(dateStr);
}

// Calcula as datas de ocorrência com base na frequência e período (usando datas completas)
function calcularOcorrencias(
  dataBase: Date,
  frequencia: Frequencia,
  dataInicio: Date,
  dataFim: Date
): Date[] {
  const ocorrencias: Date[] = [];
  const diaVencimento = dataBase.getDate();

  // Ajusta dia para meses com menos dias
  function ajustarDia(data: Date, dia: number): Date {
    const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
    data.setDate(Math.min(dia, ultimoDia));
    return data;
  }

  if (frequencia === "mensal") {
    // Gera uma ocorrência por mês no período
    let dataAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1, 12, 0, 0);
    ajustarDia(dataAtual, diaVencimento);

    while (dataAtual <= dataFim) {
      ocorrencias.push(new Date(dataAtual));
      // Próximo mês
      dataAtual = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1, 12, 0, 0);
      ajustarDia(dataAtual, diaVencimento);
    }
  } else if (frequencia === "quinzenal") {
    // Gera uma ocorrência a cada 15 dias
    let dataAtual = new Date(dataInicio);
    ajustarDia(dataAtual, diaVencimento);

    while (dataAtual <= dataFim) {
      ocorrencias.push(new Date(dataAtual));
      dataAtual.setDate(dataAtual.getDate() + 15);
    }
  } else if (frequencia === "semanal") {
    // Gera uma ocorrência por semana no período
    let dataAtual = new Date(dataInicio);
    ajustarDia(dataAtual, diaVencimento);

    while (dataAtual <= dataFim) {
      ocorrencias.push(new Date(dataAtual));
      dataAtual.setDate(dataAtual.getDate() + 7);
    }
  } else if (frequencia === "anual") {
    // Gera uma ocorrência por ano no período
    let dataAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1, 12, 0, 0);
    ajustarDia(dataAtual, diaVencimento);

    while (dataAtual <= dataFim) {
      ocorrencias.push(new Date(dataAtual));
      // Próximo ano
      dataAtual = new Date(dataAtual.getFullYear() + 1, dataAtual.getMonth(), 1, 12, 0, 0);
      ajustarDia(dataAtual, diaVencimento);
    }
  }

  return ocorrencias;
}

// Buscar ID do sócio pelo código do centro de custo
async function getSocioIdByCentroCusto(codigoTipo: string | null, userId: number, empresaId?: number | null): Promise<number | null> {
  if (!codigoTipo) return null;

  const where: any = {
    sigla: codigoTipo,
    userId: userId,
    isSocio: true,
  };
  if (empresaId) where.empresaId = empresaId;

  const centro = await prisma.centroCusto.findFirst({
    where,
    select: { id: true },
  });

  return centro?.id || null;
}

// POST - Criar conta recorrente
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const data = await request.json();

    // Validar campos obrigatórios para recorrência
    const { frequencia, dataInicioRecorrencia, dataFimRecorrencia } = data;

    if (!frequencia || !["semanal", "quinzenal", "mensal", "anual"].includes(frequencia)) {
      return NextResponse.json(
        { error: "Frequência inválida. Use: semanal, quinzenal, mensal ou anual" },
        { status: 400 }
      );
    }

    if (!dataInicioRecorrencia || !dataFimRecorrencia) {
      return NextResponse.json(
        { error: "Data de início e fim da recorrência são obrigatórias" },
        { status: 400 }
      );
    }

    const dataInicio = parseLocalDate(dataInicioRecorrencia);
    const dataFim = parseLocalDate(dataFimRecorrencia);

    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      return NextResponse.json(
        { error: "Datas de recorrência inválidas" },
        { status: 400 }
      );
    }

    if (dataInicio > dataFim) {
      return NextResponse.json(
        { error: "Data inicial deve ser menor ou igual à data final" },
        { status: 400 }
      );
    }

    const vencimentoBase = parseLocalDate(data.vencimento);
    const valorRecorrente = Number(data.valor);

    // Calcular todas as ocorrências
    const ocorrencias = calcularOcorrencias(
      vencimentoBase,
      frequencia as Frequencia,
      dataInicio,
      dataFim
    );

    if (ocorrencias.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma ocorrência gerada para o período especificado" },
        { status: 400 }
      );
    }

    // Formatar datas para log
    const formatDateLog = (d: Date) => d.toLocaleDateString("pt-BR");

    console.log(`📝 Criando conta recorrente: ${data.descricao}`);
    console.log(`   Frequência: ${frequencia}`);
    console.log(`   Período: ${formatDateLog(dataInicio)} a ${formatDateLog(dataFim)}`);
    console.log(`   Total de ocorrências: ${ocorrencias.length}`);

    // Buscar ID do sócio pelo centro de custo
    const socioIdFromCentro = await getSocioIdByCentroCusto(data.codigoTipo, user.id, empresaId);

    // Criar conta template (pai)
    const templateData: any = {
      descricao: data.descricao,
      valor: valorRecorrente * ocorrencias.length,
      valorTotal: valorRecorrente * ocorrencias.length,
      vencimento: ocorrencias[0],
      pago: false,
      tipo: data.tipo || "pagar",
      status: "recorrente",
      isRecorrente: true,
      frequencia: frequencia,
      recorrenciaDataInicio: dataInicio,
      recorrenciaDataFim: dataFim,
      userId: user.id,
      empresaId: empresaId || undefined,
    };

    // Campos opcionais
    if (data.beneficiario) templateData.beneficiario = data.beneficiario;
    if (data.fonte) templateData.fonte = data.fonte;
    if (data.banco) templateData.banco = data.banco;
    if (data.pessoaId) templateData.pessoaId = Number(data.pessoaId);
    if (data.categoria) templateData.categoria = data.categoria;
    if (data.subcategoria) templateData.subcategoria = data.subcategoria;
    if (data.formaPagamento) templateData.formaPagamento = data.formaPagamento;
    if (data.numeroDocumento) templateData.numeroDocumento = data.numeroDocumento;
    if (data.codigoTipo) templateData.codigoTipo = data.codigoTipo;
    if (data.observacoes) templateData.observacoes = data.observacoes;
    if (data.cartaoId) templateData.cartaoId = Number(data.cartaoId);
    if (data.bancoContaId) templateData.bancoContaId = Number(data.bancoContaId);
    if (socioIdFromCentro) templateData.socioResponsavelId = socioIdFromCentro;

    const contaTemplate = await prisma.conta.create({
      data: templateData,
      include: { pessoa: true },
    });

    console.log(`✅ Template recorrente criado com ID: ${contaTemplate.id}`);

    // Criar as instâncias recorrentes
    const instanciasCriadas = [];
    for (let i = 0; i < ocorrencias.length; i++) {
      const dataVencimento = ocorrencias[i];
      const mesDescricao = MESES[dataVencimento.getMonth()];
      const anoDescricao = dataVencimento.getFullYear();

      const instanciaData: any = {
        descricao: `${data.descricao} - ${mesDescricao}/${anoDescricao}`,
        valor: valorRecorrente,
        vencimento: dataVencimento,
        pago: false,
        tipo: data.tipo || "pagar",
        status: "pendente",
        recorrenciaParentId: contaTemplate.id,
        userId: user.id,
        empresaId: empresaId || undefined,
      };

      // Campos opcionais herdados do template
      if (data.beneficiario) instanciaData.beneficiario = data.beneficiario;
      if (data.codigoTipo) instanciaData.codigoTipo = data.codigoTipo;
      if (data.cartaoId) instanciaData.cartaoId = Number(data.cartaoId);
      if (data.pessoaId) instanciaData.pessoaId = Number(data.pessoaId);
      if (data.categoria) instanciaData.categoria = data.categoria;
      if (data.subcategoria) instanciaData.subcategoria = data.subcategoria;
      if (data.bancoContaId) instanciaData.bancoContaId = Number(data.bancoContaId);
      if (socioIdFromCentro) instanciaData.socioResponsavelId = socioIdFromCentro;

      const novaInstancia = await prisma.conta.create({
        data: instanciaData,
        include: { pessoa: true },
      });

      console.log(`✅ Instância ${i + 1}/${ocorrencias.length} criada - ${mesDescricao}/${anoDescricao}`);
      instanciasCriadas.push(novaInstancia);
    }

    // Atualizar previsto do centro de custo ou descontoPrevisto do sócio
    if (data.codigoTipo) {
      console.log(`🔍 Buscando centro de custo: sigla=${data.codigoTipo}, userId=${user.id}, empresaId=${empresaId}`);

      const whereCentro: any = { sigla: data.codigoTipo, userId: user.id };
      if (empresaId) whereCentro.empresaId = empresaId;

      const centro = await prisma.centroCusto.findFirst({
        where: whereCentro,
        select: { id: true, isSocio: true, previsto: true, descontoPrevisto: true, nome: true, sigla: true },
      });

      console.log(`🔍 Centro encontrado:`, centro ? `id=${centro.id}, nome=${centro.nome}, isSocio=${centro.isSocio}` : 'NÃO ENCONTRADO');

      if (centro) {
        if (centro.isSocio) {
          // Se for sócio, atualizar descontoPrevisto
          const novoDesconto = (centro.descontoPrevisto || 0) + (valorRecorrente * ocorrencias.length);
          await prisma.centroCusto.update({
            where: { id: centro.id },
            data: { descontoPrevisto: novoDesconto },
          });
          console.log(`📊 Desconto previsto do sócio ${data.codigoTipo} atualizado: ${centro.descontoPrevisto || 0} -> ${novoDesconto}`);
        } else {
          // Se não for sócio, atualizar previsto normal
          await prisma.centroCusto.update({
            where: { id: centro.id },
            data: { previsto: (centro.previsto || 0) + (valorRecorrente * ocorrencias.length) },
          });
          console.log(`📊 Previsto do centro ${data.codigoTipo} atualizado`);
        }
      } else {
        console.log(`⚠️ Centro de custo ${data.codigoTipo} NÃO ENCONTRADO!`);
      }
    } else {
      console.log(`⚠️ Nenhum codigoTipo fornecido para a conta recorrente`);
    }

    // Retornar template com instâncias
    const contaComRecorrencias = await prisma.conta.findUnique({
      where: { id: contaTemplate.id },
      include: {
        pessoa: true,
        recorrencias: {
          orderBy: { vencimento: "asc" },
        },
      },
    });

    console.log(`✅ Total de ${instanciasCriadas.length} instâncias recorrentes criadas`);

    return NextResponse.json({
      success: true,
      message: `Conta recorrente criada com ${instanciasCriadas.length} ocorrências`,
      conta: contaComRecorrencias,
      totalInstancias: instanciasCriadas.length,
    });
  } catch (error) {
    console.error("Erro ao criar conta recorrente:", error);
    return NextResponse.json(
      { error: "Falha ao criar conta recorrente" },
      { status: 500 }
    );
  }
}

// GET - Listar contas recorrentes (templates)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);

    const where: any = {
      userId: user.id,
      isRecorrente: true,
      recorrenciaParentId: null, // Apenas templates (pais)
    };

    if (empresaId) where.empresaId = empresaId;

    const recorrentes = await prisma.conta.findMany({
      where,
      include: {
        pessoa: true,
        recorrencias: {
          orderBy: { vencimento: "asc" },
        },
      },
      orderBy: { criadoEm: "desc" },
    });

    return NextResponse.json(recorrentes);
  } catch (error) {
    console.error("Erro ao buscar contas recorrentes:", error);
    return NextResponse.json(
      { error: "Falha ao buscar contas recorrentes" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir conta recorrente
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const empresaId = await getEmpresaIdValidada(user.id);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const mode = searchParams.get("mode") || "all"; // 'single', 'future', 'all'

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const contaId = parseInt(id);

    // Buscar a conta
    const where: any = { id: contaId, userId: user.id };
    if (empresaId) where.empresaId = empresaId;

    const conta = await prisma.conta.findFirst({
      where,
      include: { recorrencias: true },
    });

    if (!conta) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    if (mode === "single") {
      // Excluir apenas esta instância
      if (conta.pago) {
        return NextResponse.json(
          { error: "Não é possível excluir uma conta já paga" },
          { status: 400 }
        );
      }
      await prisma.conta.delete({ where: { id: contaId } });
      return NextResponse.json({ success: true, message: "Instância excluída" });
    }

    if (mode === "future") {
      // Excluir esta e todas as futuras (não pagas)
      const templateId = conta.recorrenciaParentId || conta.id;
      const dataReferencia = conta.vencimento;

      await prisma.conta.deleteMany({
        where: {
          recorrenciaParentId: templateId,
          vencimento: { gte: dataReferencia },
          pago: false,
          userId: user.id,
        },
      });

      return NextResponse.json({ success: true, message: "Instâncias futuras excluídas" });
    }

    // mode === 'all' - Excluir template e todas as instâncias não pagas
    const templateId = conta.recorrenciaParentId || conta.id;

    // Primeiro exclui as instâncias não pagas
    await prisma.conta.deleteMany({
      where: {
        recorrenciaParentId: templateId,
        pago: false,
        userId: user.id,
      },
    });

    // Verifica se ainda há instâncias pagas
    const instanciasPagas = await prisma.conta.count({
      where: {
        recorrenciaParentId: templateId,
        userId: user.id,
      },
    });

    // Se não houver mais instâncias, exclui o template
    if (instanciasPagas === 0) {
      await prisma.conta.delete({ where: { id: templateId } });
      return NextResponse.json({ success: true, message: "Recorrência completamente excluída" });
    }

    return NextResponse.json({
      success: true,
      message: `Instâncias não pagas excluídas. ${instanciasPagas} instância(s) paga(s) mantida(s).`,
    });
  } catch (error) {
    console.error("Erro ao excluir conta recorrente:", error);
    return NextResponse.json(
      { error: "Falha ao excluir conta recorrente" },
      { status: 500 }
    );
  }
}
