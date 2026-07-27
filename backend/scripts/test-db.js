require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryOnce(label, url) {
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    const result = await prisma.$queryRawUnsafe('SELECT 1 as ok');
    console.log(label, 'OK', result);
    return true;
  } catch (error) {
    console.error(label, 'FAIL', error.message.split('\n')[0]);
    return false;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function main() {
  const original = process.env.DATABASE_URL;
  const noPooler = original
    .replace('-pooler.', '.')
    .replace('&pgbouncer=true', '')
    .replace('?pgbouncer=true&', '?')
    .replace('?pgbouncer=true', '');

  for (let i = 1; i <= 4; i += 1) {
    console.log(`\n--- attempt ${i} ---`);
    const okPool = await tryOnce('pooler', original);
    if (okPool) return;
    await sleep(3000);
    const okDirect = await tryOnce('direct', noPooler);
    if (okDirect) {
      console.log('\nHINT: direct (non-pooler) URL works better for this project');
      return;
    }
    await sleep(5000);
  }
  process.exitCode = 1;
}

main();
