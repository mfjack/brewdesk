import { Client } from "pg";

// Some supply items were saved with initial_quantity = 0 despite having real
// stock, which also zeroes their unit cost (costPrice / initialQuantity) in
// recipe calculations. Best available reference is the current quantity.
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  "update supply_items set initial_quantity = quantity where initial_quantity = 0 and quantity > 0 returning id, name, quantity",
);

for (const row of rows) {
  console.log(`supply_items #${row.id} ${row.name}: initial_quantity -> ${row.quantity}`);
}

console.log(`Correção concluída. ${rows.length} insumo(s) atualizado(s).`);

// Leite Integral (id 17): quantity is already in grams (15000), but
// initial_quantity was left at 15 from before the unit conversion, making its
// computed unit cost 1000x too high.
const { rows: leiteRows } = await client.query(
  "update supply_items set initial_quantity = quantity where id = 17 returning id, name, quantity",
);

for (const row of leiteRows) {
  console.log(`supply_items #${row.id} ${row.name}: initial_quantity -> ${row.quantity}`);
}

await client.end();
