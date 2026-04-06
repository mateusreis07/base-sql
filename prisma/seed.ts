const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando dados antigos...');
  await prisma.scriptTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.script.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log('🏢 Criando equipes corporativas...');
  const timeComercial = await prisma.team.create({ data: { nome: 'Time Comercial' } });
  const timeTI = await prisma.team.create({ data: { nome: 'Engenharia de Dados (TI)' } });
  const timeRH = await prisma.team.create({ data: { nome: 'Time RH' } });

  console.log('👥 Criando usuários de exemplo...');
  const pwd = await bcrypt.hash('123456', 10);

  // ADMIN GLOBAL (Sem time atrelado = Global)
  const admin = await prisma.user.create({
    data: {
      name: 'Diretor (Global)',
      email: 'admin@base.com',
      password: pwd,
      role: 'ADMIN',
      teamId: null
    }
  });

  // ANALISTAS (Por Time)
  const analistaComercial = await prisma.user.create({
    data: {
      name: 'Analista Comercial',
      email: 'analista@comercial.com',
      password: pwd,
      role: 'NIVEL2',
      teamId: timeComercial.id
    }
  });

  const analistaTI = await prisma.user.create({
    data: {
      name: 'Engenheiro de Dados',
      email: 'dados@ti.com',
      password: pwd,
      role: 'NIVEL2',
      teamId: timeTI.id
    }
  });

  // N1 (Por Time)
  const n1Comercial = await prisma.user.create({
    data: {
      name: 'Atendente N1 Comercial',
      email: 'n1@comercial.com',
      password: pwd,
      role: 'NIVEL1',
      teamId: timeComercial.id
    }
  });

  console.log('🏷️ Criando categorias de teste...');
  const catVendas = await prisma.categoria.create({ data: { nome: 'Vendas' } });
  const catSistemas = await prisma.categoria.create({ data: { nome: 'Monitoramento de Sistemas' } });

  console.log('📜 Criando alguns Scripts iniciais...');
  // Script Global (Feito pelo Admin)
  await prisma.script.create({
    data: {
      titulo: 'Clientes bloqueados (Geral)',
      descricao: 'Visualiza todos os clientes do Brasil com restrição',
      codigoSql: 'SELECT * FROM clientes WHERE bloqueado = 1;',
      visibility: 'GLOBAL',
      autorId: admin.id,
      categoriaId: catVendas.id
    }
  });

  // Script Time Comercial (Feito pelo Analista do Time)
  await prisma.script.create({
    data: {
      titulo: 'Meta de vendas do mês',
      descricao: 'Calcula batimento da meta para os vendedores internos',
      codigoSql: 'SELECT vendedor_id, SUM(valor) FROM vendas WHERE date_trunc(\'month\', date) = current_month GROUP BY vendedor_id;',
      visibility: 'TIME',
      teamId: timeComercial.id,
      autorId: analistaComercial.id,
      categoriaId: catVendas.id
    }
  });

  // Script Time TI (Invisível para Comercial)
  await prisma.script.create({
    data: {
      titulo: 'Servidores indisponíveis',
      descricao: 'Verifica saúde da AWS.',
      codigoSql: 'SELECT ip FROM logs WHERE status != 200;',
      visibility: 'TIME',
      teamId: timeTI.id,
      autorId: analistaTI.id,
      categoriaId: catSistemas.id
    }
  });

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
