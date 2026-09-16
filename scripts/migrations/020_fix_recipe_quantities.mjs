import { Client } from "pg";

// supply_items were already converted to grams by 019_simplify_supply_units.mjs.
// That script failed to scale recipe quantities because supply_items.id is bigint
// (returned as a string by pg) while recipe entries store supplyItemId as a JSON
// number, so the Map lookup never matched. These are the only items whose native
// unit actually changed magnitude (kg/L -> g, x1000); ml items were already 1:1 with g.
const MULTIPLIER_BY_SUPPLY_ITEM_ID = {
  7: 1000,
  18: 1000,
  19: 1000,
  20: 1000,
};

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows: products } = await client.query("select id, recipe from products where recipe != '[]'::jsonb");

for (const product of products) {
  let changed = false;

  const newRecipe = product.recipe.map((entry) => {
    const multiplier = MULTIPLIER_BY_SUPPLY_ITEM_ID[entry.supplyItemId];

    if (!multiplier) {
      return entry;
    }

    changed = true;

    return { ...entry, unit: "g", quantity: entry.quantity * multiplier };
  });

  if (changed) {
    await client.query("update products set recipe = $1::jsonb where id = $2", [JSON.stringify(newRecipe), product.id]);
    console.log(`products #${product.id}: recipe atualizada`);
  }
}

console.log("Correção concluída.");

await client.end();
