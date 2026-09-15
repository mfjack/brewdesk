import { Client } from "pg";

const ownerEmail = process.argv[2];
const establishmentName = process.argv[3];

if (!ownerEmail || !establishmentName) {
  console.error("Uso: node scripts/seed-establishment.mjs <email-do-dono> <nome-do-estabelecimento>");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

try {
  const userResult = await client.query("select id from auth.users where email = $1", [ownerEmail]);

  if (userResult.rows.length === 0) {
    throw new Error(`Nenhum usuário encontrado com o e-mail ${ownerEmail}`);
  }

  const ownerUserId = userResult.rows[0].id;

  const establishmentResult = await client.query(
    "insert into establishments (name, owner_user_id) values ($1, $2) returning id",
    [establishmentName, ownerUserId],
  );

  const establishmentId = establishmentResult.rows[0].id;

  const tables = ["categories", "suppliers", "supply_items", "products", "operators", "orders", "settings"];

  for (const table of tables) {
    const result = await client.query(`update ${table} set establishment_id = $1 where establishment_id is null`, [establishmentId]);
    console.log(`${table}: ${result.rowCount} linha(s) atualizada(s)`);
  }

  console.log(`Estabelecimento criado: id=${establishmentId}, dono=${ownerEmail}`);
} finally {
  await client.end();
}
