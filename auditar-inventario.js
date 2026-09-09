/**
 * Auditoría y corrección de existencias infladas por el bug de facturas.
 *
 * CONTEXTO
 * Al crear un producto NUEVO desde la pantalla de facturas de compra en modo
 * "ambas", el formulario enviaba el TOTAL de unidades en el campo de unidades
 * sueltas, además de los sobres. El servidor lo guardaba tal cual, de modo que
 * el producto quedaba con casi el doble de existencias.
 *
 *   Ejemplo: 5 sobres de 10 unidades (50 reales)
 *   Guardado: quantityOnSkins = 5, quantityUnits = 50  ->  5*10 + 50 = 100 u
 *   Real:     50 unidades  ->  5 sobres + 0 sueltas
 *
 * FIRMA DEL DAÑO
 * El formulario mantenía sincronizados ambos campos, así que un registro
 * afectado cumple LAS DOS condiciones:
 *   1. quantityUnits >= conversionFactor   (ningún camino correcto lo produce)
 *   2. quantityOnSkins === floor(quantityUnits / conversionFactor)
 * De ahí se deduce el valor correcto: el total real es quantityUnits.
 *
 * Los registros que cumplen (1) pero no (2) NO se corrigen: se reportan para
 * revisión manual, porque su origen no es atribuible con certeza a este bug.
 *
 * LÍMITE IMPORTANTE
 * Si un producto afectado ya tuvo una venta o una recarga, el sistema reacomodó
 * las cantidades y la firma desapareció: el total sigue inflado pero el registro
 * parece sano. Esos casos NO son detectables desde los datos y solo se corrigen
 * con conteo físico.
 *
 * USO
 *   node auditar-inventario.js            -> solo reporta, no modifica nada
 *   node auditar-inventario.js --apply    -> corrige, tras respaldar
 *
 * Requiere MONGODB_URI en el entorno o en un archivo .env local.
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dns from "dns";
import fs from "fs";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("No se pudieron fijar los DNS, se usan los del sistema.");
}

dotenv.config();

const APPLY = process.argv.includes("--apply");
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("\nFalta MONGODB_URI. Defínala en el entorno o en un archivo .env:");
  console.error('  MONGODB_URI="mongodb+srv://..." node auditar-inventario.js\n');
  process.exit(1);
}

function formatCurrency(value) {
  return "$" + Math.round(Number(value) || 0).toLocaleString("es-CO");
}

function totalUnitsOf(product) {
  const factor = Number(product.conversionFactor) || 1;
  return (Number(product.quantityOnSkins) || 0) * factor + (Number(product.quantityUnits) || 0);
}

async function main() {
  console.log(`\n  Modo: ${APPLY ? "CORRECCIÓN (se escribirá en la base)" : "SOLO LECTURA (no se modifica nada)"}\n`);

  const client = new MongoClient(MONGODB_URI, { connectTimeoutMS: 15000 });
  await client.connect();
  const db = client.db();
  const products = await db.collection("products").find({}).toArray();

  console.log(`  Productos revisados: ${products.length}\n`);

  const corregibles = [];
  const dudosos = [];

  for (const product of products) {
    const factor = Number(product.conversionFactor) || 1;
    const skins = Number(product.quantityOnSkins) || 0;
    const units = Number(product.quantityUnits) || 0;

    if (factor <= 1 || units < factor) continue;

    const esperadoSkins = Math.floor(units / factor);
    const registro = {
      id: product.id,
      name: product.name,
      factor,
      skins,
      units,
      totalActual: skins * factor + units,
      totalReal: units,
      costo: Number(product.cost) || 0
    };

    if (skins === esperadoSkins) {
      registro.nuevoSkins = Math.floor(units / factor);
      registro.nuevoUnits = units % factor;
      corregibles.push(registro);
    } else {
      dudosos.push(registro);
    }
  }

  // ---------------------------------------------------------------- reporte
  if (corregibles.length === 0 && dudosos.length === 0) {
    console.log("  No se encontró ningún producto con la firma del bug.\n");
    await client.close();
    return;
  }

  if (corregibles.length > 0) {
    console.log("  " + "=".repeat(72));
    console.log(`  CORREGIBLES CON CERTEZA (${corregibles.length})`);
    console.log("  " + "=".repeat(72));
    let sobrantesTotal = 0;
    for (const r of corregibles) {
      const sobrante = r.totalActual - r.totalReal;
      sobrantesTotal += sobrante * (r.costo / r.factor);
      console.log(`\n  ${r.name}`);
      console.log(`    Registrado hoy : ${r.skins} sobres + ${r.units} sueltas = ${r.totalActual} unidades`);
      console.log(`    Debería ser    : ${r.nuevoSkins} sobres + ${r.nuevoUnits} sueltas = ${r.totalReal} unidades`);
      console.log(`    Diferencia     : ${sobrante} unidades de más`);
    }
    console.log(`\n  Costo del inventario inexistente: ${formatCurrency(sobrantesTotal)}\n`);
  }

  if (dudosos.length > 0) {
    console.log("  " + "=".repeat(72));
    console.log(`  REQUIEREN REVISIÓN MANUAL (${dudosos.length})`);
    console.log("  " + "=".repeat(72));
    console.log("  Tienen unidades sueltas de más, pero no coinciden con la firma");
    console.log("  del bug. El script NO los toca: verifíquelos con conteo físico.\n");
    for (const r of dudosos) {
      console.log(`  ${r.name}`);
      console.log(`    ${r.skins} sobres de ${r.factor} + ${r.units} sueltas = ${r.totalActual} unidades`);
    }
    console.log("");
  }

  // ---------------------------------------------------------------- escritura
  if (!APPLY) {
    console.log("  " + "-".repeat(72));
    console.log("  No se modificó nada. Para aplicar la corrección:");
    console.log("      node auditar-inventario.js --apply");
    console.log("  " + "-".repeat(72) + "\n");
    await client.close();
    return;
  }

  if (corregibles.length === 0) {
    console.log("  No hay nada que corregir automáticamente.\n");
    await client.close();
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = `respaldo-productos-${stamp}.json`;
  const afectados = products.filter(p => corregibles.some(c => c.id === p.id));
  fs.writeFileSync(backupFile, JSON.stringify(afectados, null, 2), "utf8");
  console.log(`  Respaldo de los ${afectados.length} productos afectados: ${backupFile}\n`);

  let corregidos = 0;
  for (const r of corregibles) {
    const res = await db.collection("products").updateOne(
      // Se exigen los valores actuales: si alguien vendió ese producto entre el
      // reporte y la escritura, no coincide y se omite en vez de pisar el dato.
      { id: r.id, quantityOnSkins: r.skins, quantityUnits: r.units },
      { $set: { quantityOnSkins: r.nuevoSkins, quantityUnits: r.nuevoUnits } }
    );
    if (res.modifiedCount > 0) {
      corregidos++;
      console.log(`  Corregido: ${r.name}  ->  ${r.nuevoSkins} sobres + ${r.nuevoUnits} sueltas`);
    } else {
      console.log(`  OMITIDO (cambió mientras se ejecutaba): ${r.name} — vuelva a correr el script`);
    }
  }

  console.log(`\n  Productos corregidos: ${corregidos} de ${corregibles.length}`);
  console.log(`  Para revertir, restaure las cantidades desde ${backupFile}\n`);

  await client.close();
}

main().catch(err => {
  console.error("\n  Error durante la auditoría:", err.message);
  process.exit(1);
});
