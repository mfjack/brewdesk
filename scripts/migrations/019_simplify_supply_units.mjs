import { Client } from "pg";

const WEIGHT_TO_GRAMS = { kg: 1000, g: 1 };
const VOLUME_TO_ML = { L: 1000, ml: 1 };

function multiplierFor(unit) {
  if (unit in WEIGHT_TO_GRAMS) return WEIGHT_TO_GRAMS[unit];
  if (unit in VOLUME_TO_ML) return VOLUME_TO_ML[unit];
  return 1;
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows: items } = await client.query(
  "select id, unit, quantity, initial_quantity, min_quantity, min_quantity_unit from supply_items",
);

const quantityMultiplierBySupplyItemId = new Map();

for (const item of items) {
  if (item.unit === "unidade") {
    continue;
  }

  const quantityMultiplier = multiplierFor(item.unit);
  const minMultiplier = multiplierFor(item.min_quantity_unit);

  const newQuantity = Number(item.quantity) * quantityMultiplier;
  const newInitialQuantity = Number(item.initial_quantity) * quantityMultiplier;
  const newMinQuantity = Number(item.min_quantity) * minMultiplier;

  await client.query("update supply_items set unit = 'g', quantity = $1, initial_quantity = $2, min_quantity = $3 where id = $4", [
    newQuantity,
    newInitialQuantity,
    newMinQuantity,
    item.id,
  ]);

  quantityMultiplierBySupplyItemId.set(item.id, quantityMultiplier);

  console.log(`supply_items #${item.id}: ${item.unit} -> g (x${quantityMultiplier})`);
}

const { rows: products } = await client.query("select id, recipe from products where recipe != '[]'::jsonb");

for (const product of products) {
  let changed = false;

  const newRecipe = product.recipe.map((entry) => {
    const multiplier = quantityMultiplierBySupplyItemId.get(entry.supplyItemId);

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

await client.query("alter table supply_items drop column if exists min_quantity_unit");

console.log("Migração concluída.");

await client.end();
