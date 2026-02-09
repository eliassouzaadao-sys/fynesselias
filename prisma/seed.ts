/**
 * Seed script para popular o banco de dados com dados iniciais
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bancos = [
  { nome: 'Banco do Brasil', codigo: '001' },
  { nome: 'Santander', codigo: '033' },
  { nome: 'Caixa Econômica Federal', codigo: '104' },
  { nome: 'Bradesco', codigo: '237' },
  { nome: 'Itaú', codigo: '341' },
  { nome: 'Nubank', codigo: '260' },
  { nome: 'Inter', codigo: '077' },
  { nome: 'C6 Bank', codigo: '336' },
  { nome: 'Banco Original', codigo: '212' },
  { nome: 'Banco BS2', codigo: '218' },
  { nome: 'Banco PagSeguro', codigo: '290' },
  { nome: 'Mercado Pago', codigo: '323' },
  { nome: 'Banco Safra', codigo: '422' },
  { nome: 'Sicoob', codigo: '756' },
  { nome: 'Sicredi', codigo: '748' },
];

// Categorias para contas a PAGAR
const categoriasPagar = [
  {
    nome: 'Folha de Pagamento',
    subcategorias: ['Salários', 'Benefícios', '13º Salário', 'Férias', 'FGTS', 'INSS'],
  },
  {
    nome: 'Impostos e Taxas',
    subcategorias: ['Municipais', 'Estaduais', 'Federais', 'Taxas Bancárias'],
  },
  {
    nome: 'Fornecedores',
    subcategorias: ['Matéria-Prima', 'Produtos para Revenda', 'Serviços Terceirizados'],
  },
  {
    nome: 'Despesas Administrativas',
    subcategorias: ['Aluguel', 'Água', 'Energia', 'Internet', 'Telefone', 'Material de Escritório'],
  },
  {
    nome: 'Despesas Operacionais',
    subcategorias: ['Manutenção', 'Combustível', 'Transporte', 'Equipamentos'],
  },
  {
    nome: 'Marketing e Vendas',
    subcategorias: ['Publicidade', 'Eventos', 'Comissões', 'Brindes'],
  },
];

// Categorias para contas a RECEBER
const categoriasReceber = [
  {
    nome: 'Vendas de Produtos',
    subcategorias: ['Atacado', 'Varejo', 'E-commerce', 'Marketplace'],
  },
  {
    nome: 'Prestação de Serviços',
    subcategorias: ['Consultoria', 'Manutenção', 'Projetos', 'Assinaturas'],
  },
  {
    nome: 'Investimentos',
    subcategorias: ['Rendimentos', 'Dividendos', 'Juros'],
  },
  {
    nome: 'Outras Receitas',
    subcategorias: ['Aluguéis', 'Royalties', 'Comissões Recebidas'],
  },
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Seed Bancos - Comentado pois Banco agora requer userId
  // console.log('📦 Criando bancos...');
  // for (const banco of bancos) {
  //   const existingBanco = await prisma.banco.findFirst({
  //     where: { nome: banco.nome },
  //   });
  //   if (!existingBanco) {
  //     await prisma.banco.create({
  //       data: banco,
  //     });
  //   }
  // }
  // console.log(`✅ ${bancos.length} bancos criados/atualizados`);
  console.log('📦 Seed de bancos ignorado (requer userId)');

  // Seed Categorias a Pagar - Comentado pois Categoria agora requer userId
  // console.log('📁 Criando categorias de contas a pagar...');
  // for (const cat of categoriasPagar) {
  //   const categoria = await prisma.categoria.upsert({
  //     where: { nome_tipo: { nome: cat.nome, tipo: 'pagar' } },
  //     update: {},
  //     create: { nome: cat.nome, tipo: 'pagar' },
  //   });
  //   for (const subNome of cat.subcategorias) {
  //     await prisma.subcategoria.upsert({
  //       where: { nome_categoriaId: { nome: subNome, categoriaId: categoria.id } },
  //       update: {},
  //       create: { nome: subNome, categoriaId: categoria.id },
  //     });
  //   }
  // }
  console.log('📁 Seed de categorias a pagar ignorado (requer userId)');

  // Seed Categorias a Receber - Comentado pois Categoria agora requer userId
  // console.log('📁 Criando categorias de contas a receber...');
  // for (const cat of categoriasReceber) {
  //   const categoria = await prisma.categoria.upsert({
  //     where: { nome_tipo: { nome: cat.nome, tipo: 'receber' } },
  //     update: {},
  //     create: { nome: cat.nome, tipo: 'receber' },
  //   });
  //   for (const subNome of cat.subcategorias) {
  //     await prisma.subcategoria.upsert({
  //       where: { nome_categoriaId: { nome: subNome, categoriaId: categoria.id } },
  //       update: {},
  //       create: { nome: subNome, categoriaId: categoria.id },
  //     });
  //   }
  // }
  console.log('📁 Seed de categorias a receber ignorado (requer userId)');

  console.log('✨ Seed concluído com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
