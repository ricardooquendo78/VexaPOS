import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { MongoClient, Db } from "mongodb";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Could not set custom DNS servers, using system default:", e);
}

dotenv.config();

const DB_FILE = path.join(process.cwd(), "db-store.json");

// Password hashing & verification utilities using Node crypto (scrypt)
export function hashPassword(password: string): string {
  if (!password) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `s2:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  // Legacy plain-text password compatibility
  if (!storedHash.startsWith("s2:")) {
    return password === storedHash;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const [, salt, originalHash] = parts;
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
  } catch (err) {
    return false;
  }
}

// Helper interfaces
interface AppState {
  users: any[];
  config: {
    business: {
      name: string;
      nit: string;
      foundationYear: string;
      phone: string;
      address: string;
      city: string;
      logoUrl?: string;
    };
  };
  products: any[];
  suppliers: any[];
  laboratories: string[];
  categories: string[];
  sales: any[];
  closures: any[];
  syncStatus: string;
  supplierInvoices?: any[];
}

// Semilla del primer administrador. Solo se usa cuando no existe ninguna base
// de datos previa; nunca sobreescribe usuarios ya creados en Atlas.
function buildSeedUsers() {
  const seedEmail = process.env.SEED_ADMIN_EMAIL;
  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedEmail || !seedPassword) return [];
  return [
    {
      id: "1",
      name: "Administrador Vexa POS",
      email: seedEmail.trim().toLowerCase(),
      password: hashPassword(seedPassword),
      role: "admin",
      profileImage: "",
      createdAt: new Date().toISOString()
    }
  ];
}

const DEFAULT_STATE: AppState = {
  users: buildSeedUsers(),
  config: {
    business: {
      name: "Vexa POS",
      nit: "",
      foundationYear: "",
      phone: "",
      address: "",
      city: ""
    }
  },
  products: [],
  suppliers: [],
  laboratories: ["Genfar", "MK", "Tecnoquímicas", "GSK", "Bayer", "Abbott", "Sanofi", "Roche"],
  categories: ["Analgésicos", "Antibióticos", "Antihistamínicos", "Vitaminas y Multivitamínicos", "Inyectables", "Cuidado Bebé", "Higiene y Salud Orgánica"],
  sales: [],
  closures: [],
  syncStatus: "synchronized"
};

// Write local store to disk
function saveDb(state: AppState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

// Read local store from disk
function loadDb(): AppState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(data);
      let modified = false;
      if (parsed.users && Array.isArray(parsed.users)) {
        for (const u of parsed.users) {
          if (u.password && !u.password.startsWith("s2:")) {
            u.password = hashPassword(u.password);
            modified = true;
          }
        }
      }
      if (modified) {
        saveDb(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error("Error reading database file, using fallback state:", err);
  }
  saveDb(DEFAULT_STATE);
  return DEFAULT_STATE;
}

function getBogotaDateStr(dateInput = new Date()) {
  try {
    if (!dateInput || isNaN(dateInput.getTime())) {
      dateInput = new Date();
    }
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(dateInput);
    const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${partMap.year}-${partMap.month}-${partMap.day}`;
  } catch (e) {
    try {
      // Fallback manual adjustment for UTC-5 (Colombia time)
      const offsetMs = -5 * 60 * 60 * 1000;
      const bogotaTime = new Date(dateInput.getTime() + offsetMs);
      return bogotaTime.toISOString().split("T")[0];
    } catch (err) {
      return "2026-07-14";
    }
  }
}

// MongoDB Connections state
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let connectionPromise: Promise<Db | null> | null = null;

const MONGODB_URI = process.env.MONGODB_URI;

async function seedMongoDatabase() {
  if (!mongoDb) return;

  try {
    const usersCount = await mongoDb.collection("users").countDocuments();
    if (usersCount > 0) {
      console.log("[Droguería Backend] MongoDB Atlas already has data. Migration skipped.");
      return;
    }

    console.log("[Droguería Backend] MongoDB Atlas is empty. Migrating local JSON store...");
    const localDb = loadDb();

    if (localDb.users && localDb.users.length > 0) {
      const usersToInsert = localDb.users.map(u => ({
        ...u,
        password: u.password.startsWith("s2:") ? u.password : hashPassword(u.password)
      }));
      await mongoDb.collection("users").insertMany(usersToInsert);
    }

    if (localDb.config && localDb.config.business) {
      await mongoDb.collection("config").updateOne(
        { _id: "business_config" as any },
        { $set: localDb.config.business },
        { upsert: true }
      );
    }

    if (localDb.products && localDb.products.length > 0) {
      await mongoDb.collection("products").insertMany(localDb.products);
    }

    if (localDb.suppliers && localDb.suppliers.length > 0) {
      await mongoDb.collection("suppliers").insertMany(localDb.suppliers);
    }

    await mongoDb.collection("metadata").updateOne(
      { _id: "lists" as any },
      {
        $set: {
          laboratories: localDb.laboratories || DEFAULT_STATE.laboratories,
          categories: localDb.categories || DEFAULT_STATE.categories
        }
      },
      { upsert: true }
    );

    if (localDb.sales && localDb.sales.length > 0) {
      await mongoDb.collection("sales").insertMany(localDb.sales);
    }

    if (localDb.closures && localDb.closures.length > 0) {
      await mongoDb.collection("closures").insertMany(localDb.closures);
    }

    console.log("[Droguería Backend] Local data successfully migrated to MongoDB Atlas!");
  } catch (err) {
    console.error("[Droguería Backend] Failed to seed MongoDB database:", err);
  }
}

async function connectToMongo(): Promise<Db | null> {
  if (!MONGODB_URI) {
    console.log("[Droguería Backend] MONGODB_URI not found in environment. Using local db-store.json");
    return null;
  }

  if (mongoDb) {
    return mongoDb;
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      try {
        console.log("[Droguería Backend] Connecting to MongoDB Atlas...");
        const client = new MongoClient(MONGODB_URI, {
          maxPoolSize: 5,
          minPoolSize: 1,
          maxIdleTimeMS: 30000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 30000,
        });
        await client.connect();
        console.log("[Droguería Backend] Connected successfully to MongoDB Atlas.");
        mongoClient = client;
        mongoDb = client.db();
        
        // Seed DB
        await seedMongoDatabase();

        // Auto-migrate legacy plain text passwords in Atlas to secure hash format
        try {
          const unhashedUsers = await mongoDb.collection("users").find({
            password: { $not: /^s2:/ }
          }).toArray();
          for (const u of unhashedUsers) {
            if (u.password && !u.password.startsWith("s2:")) {
              await mongoDb.collection("users").updateOne(
                { _id: u._id },
                { $set: { password: hashPassword(u.password) } }
              );
              console.log(`[Droguería Backend] Migrated and hashed password for user: ${u.email}`);
            }
          }
        } catch (e) {
          console.warn("[Droguería Backend] Password auto-migration notice:", e);
        }

        return mongoDb;
      } catch (err) {
        console.error("[Droguería Backend] MongoDB connection failed. Falling back to local JSON store.", err);
        connectionPromise = null; // Reset promise to allow retrying on next request
        return null;
      }
    })();
  }

  return connectionPromise;
}

// Database Abstraction Helpers
async function getUsers() {
  if (mongoDb) {
    return await mongoDb.collection("users").find({}).toArray();
  }
  return loadDb().users;
}

async function addUser(user: any) {
  if (mongoDb) {
    await mongoDb.collection("users").insertOne(user);
    return;
  }
  const db = loadDb();
  db.users.push(user);
  saveDb(db);
}

async function updateUserPassword(userId: string, newPasswordHash: string) {
  if (mongoDb) {
    await mongoDb.collection("users").updateOne(
      { id: userId },
      { $set: { password: newPasswordHash } }
    );
    return;
  }
  const db = loadDb();
  const userIdx = db.users.findIndex((u: any) => u.id === userId);
  if (userIdx !== -1) {
    db.users[userIdx].password = newPasswordHash;
    saveDb(db);
  }
}

async function updatePersonalProfile(userId: string, name: string, profileImage: string) {
  if (mongoDb) {
    await mongoDb.collection("users").updateOne(
      { id: userId },
      { $set: { name, profileImage } }
    );
    return;
  }
  const db = loadDb();
  const userIdx = db.users.findIndex((u: any) => u.id === userId);
  if (userIdx !== -1) {
    db.users[userIdx].name = name;
    db.users[userIdx].profileImage = profileImage;
    saveDb(db);
  }
}

async function deleteUser(userId: string) {
  if (mongoDb) {
    await mongoDb.collection("users").deleteOne({ id: userId });
    return;
  }
  const db = loadDb();
  db.users = db.users.filter((u: any) => u.id !== userId);
  saveDb(db);
}

async function updateUser(userId: string, updateData: any) {
  if (mongoDb) {
    const { _id, ...rest } = updateData;
    await mongoDb.collection("users").updateOne(
      { id: userId },
      { $set: rest }
    );
    return;
  }
  const db = loadDb();
  const userIdx = db.users.findIndex((u: any) => u.id === userId);
  if (userIdx !== -1) {
    db.users[userIdx] = { ...db.users[userIdx], ...updateData };
    saveDb(db);
  }
}

async function getBusinessConfig() {
  if (mongoDb) {
    const doc = await mongoDb.collection("config").findOne({ _id: "business_config" as any });
    if (doc) {
      const { _id, ...business } = doc;
      return business;
    }
    return DEFAULT_STATE.config.business;
  }
  return loadDb().config.business;
}

async function updateBusinessConfig(business: any) {
  if (mongoDb) {
    await mongoDb.collection("config").updateOne(
      { _id: "business_config" as any },
      { $set: business },
      { upsert: true }
    );
    return;
  }
  const db = loadDb();
  db.config.business = business;
  saveDb(db);
}

async function getProducts() {
  if (mongoDb) {
    return await mongoDb.collection("products").find({}).toArray();
  }
  return loadDb().products;
}

async function addProduct(product: any) {
  if (mongoDb) {
    await mongoDb.collection("products").insertOne(product);
    return;
  }
  const db = loadDb();
  db.products.push(product);
  saveDb(db);
}

async function updateProduct(productId: string, updateData: any) {
  if (mongoDb) {
    const { _id, ...dataWithoutMongoId } = updateData;
    await mongoDb.collection("products").updateOne({ id: productId }, { $set: dataWithoutMongoId });
    return;
  }
  const db = loadDb();
  const idx = db.products.findIndex(p => p.id === productId);
  if (idx !== -1) {
    db.products[idx] = { ...db.products[idx], ...updateData };
    saveDb(db);
  }
}

async function deleteProduct(productId: string) {
  if (mongoDb) {
    await mongoDb.collection("products").deleteOne({ id: productId });
    return;
  }
  const db = loadDb();
  db.products = db.products.filter(p => p.id !== productId);
  saveDb(db);
}

async function getSuppliers() {
  if (mongoDb) {
    return await mongoDb.collection("suppliers").find({}).toArray();
  }
  return loadDb().suppliers;
}

async function addSupplier(supplier: any) {
  if (mongoDb) {
    await mongoDb.collection("suppliers").insertOne(supplier);
    return;
  }
  const db = loadDb();
  db.suppliers.push(supplier);
  saveDb(db);
}

async function getSupplierInvoices() {
  if (mongoDb) {
    return await mongoDb.collection("supplier_invoices").find({}).toArray();
  }
  const db = loadDb();
  return db.supplierInvoices || [];
}

async function addSupplierInvoice(invoice: any) {
  if (mongoDb) {
    await mongoDb.collection("supplier_invoices").insertOne(invoice);
    return;
  }
  const db = loadDb();
  if (!db.supplierInvoices) {
    db.supplierInvoices = [];
  }
  db.supplierInvoices.push(invoice);
  saveDb(db);
}

async function getLaboratories() {
  if (mongoDb) {
    const doc = await mongoDb.collection("metadata").findOne({ _id: "lists" as any });
    return doc?.laboratories || DEFAULT_STATE.laboratories;
  }
  return loadDb().laboratories;
}

async function addLaboratory(labName: string) {
  if (mongoDb) {
    await mongoDb.collection("metadata").updateOne(
      { _id: "lists" as any },
      { $addToSet: { laboratories: labName } as any },
      { upsert: true }
    );
    return;
  }
  const db = loadDb();
  if (!db.laboratories.includes(labName)) {
    db.laboratories.push(labName);
    saveDb(db);
  }
}

async function getCategories() {
  if (mongoDb) {
    const doc = await mongoDb.collection("metadata").findOne({ _id: "lists" as any });
    return doc?.categories || DEFAULT_STATE.categories;
  }
  return loadDb().categories;
}

async function addCategory(categoryName: string) {
  if (mongoDb) {
    await mongoDb.collection("metadata").updateOne(
      { _id: "lists" as any },
      { $addToSet: { categories: categoryName } as any },
      { upsert: true }
    );
    return;
  }
  const db = loadDb();
  if (!db.categories.includes(categoryName)) {
    db.categories.push(categoryName);
    saveDb(db);
  }
}

async function deleteSupplier(supplierId: string) {
  if (mongoDb) {
    await mongoDb.collection("suppliers").deleteOne({ id: supplierId });
    return;
  }
  const db = loadDb();
  db.suppliers = db.suppliers.filter((s: any) => s.id !== supplierId);
  saveDb(db);
}

async function deleteLaboratory(labName: string) {
  if (mongoDb) {
    await mongoDb.collection("metadata").updateOne(
      { _id: "lists" as any },
      { $pull: { laboratories: labName } as any }
    );
    return;
  }
  const db = loadDb();
  db.laboratories = db.laboratories.filter((l: string) => l !== labName);
  saveDb(db);
}

async function deleteCategory(categoryName: string) {
  if (mongoDb) {
    await mongoDb.collection("metadata").updateOne(
      { _id: "lists" as any },
      { $pull: { categories: categoryName } as any }
    );
    return;
  }
  const db = loadDb();
  db.categories = db.categories.filter((c: string) => c !== categoryName);
  saveDb(db);
}

async function getSales() {
  if (mongoDb) {
    return await mongoDb.collection("sales").find({}).toArray();
  }
  return loadDb().sales;
}

async function addSale(sale: any) {
  if (mongoDb) {
    await mongoDb.collection("sales").insertOne(sale);
    return;
  }
  const db = loadDb();
  db.sales.push(sale);
  saveDb(db);
}

function computeFinalCash(closure: any) {
  if (!closure) return closure;
  closure.initialCash = 0;
  const totalSalesRevenue = closure.totalSalesRevenue || 0;
  const totalExpenses = closure.totalExpenses || 0;
  closure.finalCash = totalSalesRevenue - totalExpenses;
  return closure;
}

async function getClosures() {
  if (mongoDb) {
    const docs = await mongoDb.collection("closures").find({}).toArray();
    return docs.map(computeFinalCash);
  }
  return loadDb().closures.map(computeFinalCash);
}

async function getClosure(date: string) {
  if (mongoDb) {
    let active: any = await mongoDb.collection("closures").findOne({ isClosed: false });
    
    if (active && active.date < date) {
      // Cierre automático: el día cambió hacia adelante, cerramos el activo antiguo
      active.isClosed = true;
      active.closedAt = new Date().toISOString();
      const { _id, ...rest } = active;
      await mongoDb.collection("closures").updateOne({ id: active.id }, { $set: rest });
      active = null;
    }
    
    if (active && active.date === date) {
      return computeFinalCash(active);
    }
    
    const existing = await mongoDb.collection("closures").findOne({ date });
    if (existing) {
      return computeFinalCash(existing);
    }
    
    const todayStr = getBogotaDateStr();
    const shouldBeClosed = date < todayStr;
    
    const newClosure = {
      id: "close-" + date,
      date,
      totalSalesCount: 0,
      totalSalesRevenue: 0,
      totalExpenses: 0,
      initialCash: 0,
      finalCash: 0,
      expenses: [],
      isClosed: shouldBeClosed,
      ...(shouldBeClosed ? { closedAt: new Date().toISOString() } : {})
    };
    await mongoDb.collection("closures").insertOne({ ...newClosure } as any);
    return computeFinalCash(newClosure);
  }
  
  const db = loadDb();
  let active = db.closures.find(c => !c.isClosed);
  if (active && active.date < date) {
    active.isClosed = true;
    active.closedAt = new Date().toISOString();
    active = null;
    saveDb(db);
  }
  
  if (active && active.date === date) {
    return computeFinalCash(active);
  }
  
  const existing = db.closures.find(c => c.date === date);
  if (existing) {
    return computeFinalCash(existing);
  }
  
  const todayStr = getBogotaDateStr();
  const shouldBeClosed = date < todayStr;
  
  const newClosure = {
    id: "close-" + date,
    date,
    totalSalesCount: 0,
    totalSalesRevenue: 0,
    totalExpenses: 0,
    initialCash: 0,
    finalCash: 0,
    expenses: [],
    isClosed: shouldBeClosed,
    ...(shouldBeClosed ? { closedAt: new Date().toISOString() } : {})
  };
  db.closures.push(newClosure);
  saveDb(db);
  return computeFinalCash(newClosure);
}

async function getClosedToday(date: string) {
  if (mongoDb) {
    const doc = await mongoDb.collection("closures").findOne({ date, isClosed: true });
    return computeFinalCash(doc);
  }
  return computeFinalCash(loadDb().closures.find(c => c.date === date && c.isClosed));
}

async function saveClosure(closure: any) {
  if (mongoDb) {
    const { _id, ...rest } = closure;
    await mongoDb.collection("closures").updateOne(
      { id: closure.id },
      { $set: rest },
      { upsert: true }
    );
    return;
  }
  const db = loadDb();
  const idx = db.closures.findIndex(c => c.id === closure.id);
  if (idx === -1) {
    db.closures.push(closure);
  } else {
    db.closures[idx] = closure;
  }
  saveDb(db);
}

async function getNextInvoiceNumber(): Promise<string> {
  if (mongoDb) {
    const res = await mongoDb.collection("counters").findOneAndUpdate(
      { _id: "invoiceNumber" as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
    const seq = res && typeof res.seq === "number" ? res.seq : 1;
    return "FC-" + String(seq).padStart(5, "0");
  }
  // Contador persistido: usar db.sales.length repetía números de factura en
  // cuanto se eliminaba una venta.
  const db = loadDb() as any;
  const nextSeq = (Number(db.invoiceCounter) || db.sales.length) + 1;
  db.invoiceCounter = nextSeq;
  saveDb(db);
  return "FC-" + String(nextSeq).padStart(5, "0");
}

interface StockAdjustResult {
  ok: boolean;
  reason?: "not_found" | "insufficient" | "conflict";
  availableUnits?: number;
  requestedUnits?: number;
}

interface StockAdjustOptions {
  // Permite que el resultado quede en cero en vez de rechazar la operación.
  // Se usa al sincronizar ventas offline: esa venta ya ocurrió en el mostrador
  // y no se puede rechazar, solo registrar el faltante.
  allowNegative?: boolean;
}

// Ajusta el stock de un producto. En MongoDB usa compare-and-swap: la
// escritura solo se aplica si las cantidades siguen siendo las que se leyeron,
// de modo que dos ventas simultáneas del mismo producto no se pisen entre sí.
async function adjustProductStock(
  productId: string,
  skinChange: number,
  unitChange: number,
  overrideFields?: { cost?: number, price?: number, priceUnits?: number, expirationDate?: string },
  options: StockAdjustOptions = {}
): Promise<StockAdjustResult> {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let currentSkins = 0;
    let currentUnits = 0;
    let conversionFactor = 1;

    if (mongoDb) {
      const prod = await mongoDb.collection("products").findOne({ id: productId });
      if (!prod) return { ok: false, reason: "not_found" };
      currentSkins = prod.quantityOnSkins || 0;
      currentUnits = prod.quantityUnits || 0;
      conversionFactor = prod.conversionFactor || 1;
    } else {
      const db = loadDb();
      const prod = db.products.find(p => p.id === productId);
      if (!prod) return { ok: false, reason: "not_found" };
      currentSkins = prod.quantityOnSkins || 0;
      currentUnits = prod.quantityUnits || 0;
      conversionFactor = prod.conversionFactor || 1;
    }

    const totalUnitsInStock = (currentSkins * conversionFactor) + currentUnits;
    const totalUnitsChange = (skinChange * conversionFactor) + unitChange;
    const resultingTotalUnits = totalUnitsInStock + totalUnitsChange;

    if (resultingTotalUnits < 0 && !options.allowNegative) {
      return {
        ok: false,
        reason: "insufficient",
        availableUnits: totalUnitsInStock,
        requestedUnits: Math.abs(totalUnitsChange)
      };
    }

    const remainingTotalUnits = Math.max(0, resultingTotalUnits);
    const normalized = normalizeQuantities(0, remainingTotalUnits, conversionFactor);

    const updatedFields: any = {
      quantityOnSkins: normalized.quantityOnSkins,
      quantityUnits: normalized.quantityUnits
    };

    if (overrideFields) {
      if (overrideFields.cost !== undefined) updatedFields.cost = overrideFields.cost;
      if (overrideFields.price !== undefined) updatedFields.price = overrideFields.price;
      if (overrideFields.priceUnits !== undefined) updatedFields.priceUnits = overrideFields.priceUnits;
      if (overrideFields.expirationDate !== undefined) updatedFields.expirationDate = overrideFields.expirationDate;
    }

    if (mongoDb) {
      // La condición incluye las cantidades leídas: si otra venta las cambió
      // entre la lectura y la escritura, no coincide y se reintenta.
      const res = await mongoDb.collection("products").updateOne(
        { id: productId, quantityOnSkins: currentSkins, quantityUnits: currentUnits },
        { $set: updatedFields }
      );
      if (res.matchedCount > 0) return { ok: true };
      continue; // otro proceso ganó la carrera: releer y recalcular
    }

    const db = loadDb();
    const idx = db.products.findIndex(p => p.id === productId);
    if (idx === -1) return { ok: false, reason: "not_found" };
    db.products[idx] = { ...db.products[idx], ...updatedFields };
    saveDb(db);
    return { ok: true };
  }

  console.error(`[Droguería Backend] No se pudo ajustar el stock de ${productId} tras varios reintentos.`);
  return { ok: false, reason: "conflict" };
}

async function deductProductStock(
  productId: string,
  deductSkins: number,
  deductUnits: number,
  options: StockAdjustOptions = {}
): Promise<StockAdjustResult> {
  return adjustProductStock(productId, -deductSkins, -deductUnits, undefined, options);
}

// Unidades disponibles de un producto, expresadas en la unidad mínima.
function totalUnitsOf(product: any): number {
  const factor = Number(product.conversionFactor) || 1;
  return (Number(product.quantityOnSkins) || 0) * factor + (Number(product.quantityUnits) || 0);
}

// Deja las cantidades en la forma canónica del inventario: las unidades
// sueltas nunca pueden llegar o superar un sobre completo. Protege el dato
// aunque el cliente envíe un total donde correspondía el sobrante.
function normalizeQuantities(skins: any, units: any, factor: any) {
  const conversionFactor = Math.max(1, Number(factor) || 1);
  const totalUnits = Math.max(0, (Number(skins) || 0) * conversionFactor + (Number(units) || 0));
  if (conversionFactor > 1) {
    return {
      quantityOnSkins: Math.floor(totalUnits / conversionFactor),
      quantityUnits: totalUnits % conversionFactor,
      conversionFactor
    };
  }
  return { quantityOnSkins: totalUnits, quantityUnits: 0, conversionFactor };
}

async function incrementClosureTotals(date: string, totalRevenue: number, salesCountIncrement = 1) {
  const closure = await getClosure(date);
  if (mongoDb) {
    await mongoDb.collection("closures").updateOne(
      { id: closure.id },
      {
        $inc: {
          totalSalesCount: salesCountIncrement,
          totalSalesRevenue: totalRevenue
        }
      }
    );
    return;
  }
  const db = loadDb();
  const idx = db.closures.findIndex(c => c.id === closure.id);
  if (idx !== -1) {
    db.closures[idx].totalSalesCount += salesCountIncrement;
    db.closures[idx].totalSalesRevenue += totalRevenue;
    db.closures[idx].finalCash += totalRevenue;
    saveDb(db);
  }
}

async function addExpenseToClosure(date: string, expense: any) {
  const closure = await getClosure(date);
  if (mongoDb) {
    await mongoDb.collection("closures").updateOne(
      { id: closure.id },
      {
        $push: { expenses: expense } as any,
        $inc: {
          totalExpenses: expense.amount
        }
      }
    );
    return;
  }
  const db = loadDb();
  const idx = db.closures.findIndex(c => c.id === closure.id);
  if (idx !== -1) {
    db.closures[idx].expenses.push(expense);
    db.closures[idx].totalExpenses += expense.amount;
    db.closures[idx].finalCash -= expense.amount;
    saveDb(db);
  }
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use("/documents", express.static(path.join(process.cwd(), "public", "documents")));

// Connect to MongoDB Atlas (starts connecting in the background)
connectToMongo();

// Middleware to guarantee MongoDB connection is ready before processing API requests
app.use("/api", async (req, res, next) => {
  if (MONGODB_URI && !mongoDb) {
    console.log(`[Droguería Backend] API request ${req.method} ${req.path} waiting for MongoDB connection...`);
    try {
      await connectToMongo();
    } catch (err) {
      console.error("[Droguería Backend] Failed to connect to MongoDB in middleware:", err);
    }
  }
  next();
});


// ---------------------------------------------------------------------------
// Sesiones: tokens firmados (HMAC-SHA256)
// ---------------------------------------------------------------------------
// Formato: base64url(payload).firmaHex  — sin estado en servidor, para que
// funcione igual en Vercel (varias instancias) que en el servidor local.
// La llave sale de SESSION_SECRET; si no está definida se genera una y se
// persiste en la base de datos para que todas las instancias firmen igual.

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
let sessionSecretCache: string | null = null;

async function getSessionSecret(): Promise<string> {
  if (sessionSecretCache) return sessionSecretCache;

  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    sessionSecretCache = fromEnv;
    return sessionSecretCache;
  }

  const generated = crypto.randomBytes(48).toString("hex");

  if (mongoDb) {
    // $setOnInsert + relectura: si dos instancias arrancan a la vez, ambas
    // terminan usando la misma llave (la primera que quedó escrita).
    await mongoDb.collection("config").updateOne(
      { _id: "session_secret" as any },
      { $setOnInsert: { secret: generated } },
      { upsert: true }
    );
    const doc = await mongoDb.collection("config").findOne({ _id: "session_secret" as any });
    sessionSecretCache = (doc && doc.secret) || generated;
    console.warn("[Droguería Backend] SESSION_SECRET no está definida; usando la llave persistida en la base de datos.");
    return sessionSecretCache;
  }

  const db = loadDb() as any;
  if (!db.sessionSecret) {
    db.sessionSecret = generated;
    saveDb(db);
  }
  sessionSecretCache = db.sessionSecret;
  return sessionSecretCache;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

async function createSessionToken(user: any): Promise<string> {
  const secret = await getSessionSecret();
  const payload = toBase64Url(JSON.stringify({
    uid: user.id,
    email: user.email,
    role: user.role || "worker",
    exp: Date.now() + TOKEN_TTL_MS
  }));
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

async function verifySessionToken(token: string): Promise<any | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  try {
    const secret = await getSessionSecret();
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const signatureBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (signatureBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return null;

    const data = JSON.parse(fromBase64Url(payload));
    if (!data || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data;
  } catch (err) {
    return null;
  }
}

// Rutas que se pueden llamar sin sesión iniciada.
const PUBLIC_API_ROUTES = new Set(["/health", "/auth/login", "/auth/register"]);

// Puerta de entrada: toda ruta /api exige un token válido salvo las públicas.
app.use("/api", async (req, res, next) => {
  const route = req.path.replace(/\/+$/, "") || "/";
  if (PUBLIC_API_ROUTES.has(route)) return next();

  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const session = await verifySessionToken(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHENTICATED",
      message: "Sesión no válida o expirada. Vuelva a iniciar sesión."
    });
  }

  (req as any).session = session;
  next();
});

// Restringe una ruta a administradores.
function requireAdmin(req: any, res: any, next: any) {
  const session = req.session;
  if (!session || session.role !== "admin") {
    return res.status(403).json({
      success: false,
      code: "FORBIDDEN",
      message: "Esta acción requiere permisos de administrador."
    });
  }
  next();
}

// Root health check
app.get("/api/health", (req, res) => {
  res.json({ status: "alive", timestamp: new Date().toISOString() });
});

// Freno simple a los intentos de adivinar contraseñas. Cuenta solo intentos
// fallidos y se reinicia con cada ingreso exitoso, para no estorbarle a quien
// simplemente se equivocó al escribir.
const LOGIN_MAX_ATTEMPTS = 15;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function loginAttemptKey(req: any, email: string): string {
  const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() || req.ip || "unknown";
  return `${ip}|${email}`;
}

function isLoginBlocked(key: string): boolean {
  const record = loginAttempts.get(key);
  if (!record) return false;
  if (Date.now() - record.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return record.count >= LOGIN_MAX_ATTEMPTS;
}

function registerFailedLogin(key: string) {
  const record = loginAttempts.get(key);
  if (!record || Date.now() - record.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: Date.now() });
    return;
  }
  record.count++;
}

// Authentication endpoints
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Correo y contraseña requeridos." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const attemptKey = loginAttemptKey(req, cleanEmail);

    if (isLoginBlocked(attemptKey)) {
      return res.status(429).json({
        success: false,
        message: "Demasiados intentos fallidos. Espere unos minutos e intente de nuevo."
      });
    }

    const users = await getUsers();
    const user = users.find(u => (u.email || "").trim().toLowerCase() === cleanEmail);

    if (!user || !user.password || !verifyPassword(password, user.password)) {
      registerFailedLogin(attemptKey);
      return res.status(401).json({ success: false, message: "Correo o contraseña incorrectos." });
    }

    loginAttempts.delete(attemptKey);

    // Auto-migrate legacy plain text passwords in database to secure hash format
    if (!user.password.startsWith("s2:")) {
      const newHashed = hashPassword(password);
      await updateUserPassword(user.id, newHashed);
    }

    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.role = user.role || "worker";
    const token = await createSessionToken(userWithoutPassword);
    res.json({ success: true, user: userWithoutPassword, token });
  } catch (err) {
    console.error("Login processing error:", err);
    res.status(500).json({ success: false, message: "Error interno al procesar el inicio de sesión." });
  }
});

// Reconfirmación de contraseña del usuario en sesión (acciones sensibles)
app.post("/api/auth/verify", async (req, res) => {
  try {
    const { password } = req.body;
    const session = (req as any).session;
    if (!password || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Contraseña requerida." });
    }

    const users = await getUsers();
    const user = users.find((u: any) => u.id === session.uid);
    if (!user || !user.password || !verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Password verification error:", err);
    res.status(500).json({ success: false, message: "Error al verificar la contraseña." });
  }
});

// Registration endpoint disabled for security
app.post("/api/auth/register", async (req, res) => {
  return res.status(403).json({
    success: false,
    message: "El registro de nuevos usuarios está deshabilitado por motivos de seguridad. Acceso restringido a cuentas autorizadas existentes."
  });
});

// Profile configuration config
app.get("/api/profile", async (req, res) => {
  const business = await getBusinessConfig();
  res.json({ business });
});

app.post("/api/profile/business", requireAdmin, async (req, res) => {
  const { name, nit, foundationYear, phone, address, city, logoUrl } = req.body;
  const business = { name, nit, foundationYear, phone, address, city, logoUrl };
  await updateBusinessConfig(business);
  res.json({ success: true, business });
});

app.post("/api/profile/personal", async (req, res) => {
  try {
    const { userId, name, profileImage } = req.body;
    const session = (req as any).session;
    console.log("[Droguería Backend] POST /api/profile/personal request received:", { userId, name, profileImageLength: profileImage ? profileImage.length : 0 });
    if (userId && session && userId !== session.uid && session.role !== "admin") {
      return res.status(403).json({ success: false, message: "Solo puede modificar su propio perfil." });
    }
    if (!userId || !name) {
      console.warn("[Droguería Backend] Missing fields:", { userId, name });
      return res.status(400).json({ success: false, message: "Faltan campos obligatorios." });
    }
    await updatePersonalProfile(userId, name, profileImage || "");
    console.log("[Droguería Backend] Personal profile updated successfully for:", userId);
    res.json({ success: true, name, profileImage });
  } catch (err: any) {
    console.error("[Droguería Backend] Error updating personal profile:", err);
    res.status(500).json({ success: false, message: err.message || "Error interno del servidor." });
  }
});

// Users Management API (Admin only)
app.get("/api/users", requireAdmin, async (req, res) => {
  try {
    const users = await getUsers();
    const safeUsers = users.map((u: any) => {
      const { password, ...safe } = u;
      return {
        ...safe,
        role: safe.role || "worker",
        createdAt: safe.createdAt || "2026-01-01T00:00:00.000Z"
      };
    });
    res.json({ success: true, users: safeUsers });
  } catch (err: any) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Error al obtener usuarios." });
  }
});

app.post("/api/users", requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Nombre, correo y contraseña son obligatorios." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await getUsers();
    const existing = users.find((u: any) => (u.email || "").trim().toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: "Ya existe un usuario con este correo electrónico." });
    }

    const newUser = {
      id: "usr-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      email: cleanEmail,
      password: hashPassword(password),
      role: (role === "admin") ? "admin" : "worker",
      profileImage: "",
      createdAt: new Date().toISOString()
    };

    await addUser(newUser);
    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error("Error creating user:", err);
    res.status(500).json({ success: false, message: "Error al crear el usuario." });
  }
});

app.post("/api/users/update", requireAdmin, async (req, res) => {
  try {
    const { userId, name, role, password } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ success: false, message: "ID de usuario y nombre son obligatorios." });
    }

    const updateFields: any = {
      name: name.trim(),
      role: (role === "admin") ? "admin" : "worker"
    };

    if (password && typeof password === "string" && password.trim().length > 0) {
      updateFields.password = hashPassword(password.trim());
    }

    await updateUser(userId, updateFields);
    res.json({ success: true, message: "Usuario actualizado correctamente." });
  } catch (err: any) {
    console.error("Error updating user:", err);
    res.status(500).json({ success: false, message: "Error al actualizar el usuario." });
  }
});

app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const users = await getUsers();
    const userToDelete = users.find((u: any) => u.id === userId);

    if (!userToDelete) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado." });
    }

    // Check if deleting the last admin
    if (userToDelete.role === "admin") {
      const admins = users.filter((u: any) => u.role === "admin");
      if (admins.length <= 1) {
        return res.status(400).json({ success: false, message: "No se puede eliminar al único administrador del sistema." });
      }
    }

    await deleteUser(userId);
    res.json({ success: true, message: "Usuario eliminado exitosamente." });
  } catch (err: any) {
    console.error("Error deleting user:", err);
    res.status(500).json({ success: false, message: "Error al eliminar usuario." });
  }
});

// Inventory endpoint: List all products
app.get("/api/inventory", async (req, res) => {
  const productsList = await getProducts();
  const sorted = [...productsList].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
  );
  res.json(sorted);
});

// Create initial product
app.post("/api/inventory/initial", async (req, res) => {
  try {
    const { name, expirationDate, laboratory, cost, price, priceUnits, category, quantityOnSkins, quantityUnits, conversionFactor, minStockAlert, barcode, barcodes, fotoUrl } = req.body;

    if (!name || !laboratory || !category) {
      return res.status(400).json({ success: false, message: "Nombre, laboratorio y categoría son obligatorios." });
    }

    const barcodeList = Array.isArray(barcodes)
      ? barcodes.filter(b => typeof b === "string" && b.trim()).slice(0, 3)
      : (barcode ? [barcode] : []);

    const newProduct = {
      id: "prod-" + Date.now(),
      name,
      expirationDate: expirationDate || "2027-12-31",
      laboratory,
      cost: Number(cost) || 0,
      price: Number(price) || 0,
      priceUnits: priceUnits ? Number(priceUnits) : undefined,
      category,
      ...normalizeQuantities(quantityOnSkins, quantityUnits, conversionFactor),
      minStockAlert: (minStockAlert !== undefined && minStockAlert !== null && minStockAlert !== "" && !isNaN(Number(minStockAlert))) ? Math.max(0, Number(minStockAlert)) : 0,
      barcode: barcodeList[0] || barcode || "",
      barcodes: barcodeList,
      fotoUrl: fotoUrl || "",
      isActive: true
    };

    await addProduct(newProduct);
    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error("Error creating initial product:", err);
    res.status(500).json({ success: false, message: "Error al guardar el producto." });
  }
});

// Update existing product
app.post("/api/inventory/update", async (req, res) => {
  const { id, name, expirationDate, laboratory, cost, price, priceUnits, category, quantityOnSkins, quantityUnits, conversionFactor, minStockAlert, barcode, barcodes, fotoUrl } = req.body;

  if (!id || !name || !laboratory || !category) {
    return res.status(400).json({ success: false, message: "Faltan campos obligatorios." });
  }

  const productsList = await getProducts();
  const p = productsList.find(prod => prod.id === id);
  if (!p) {
    return res.status(404).json({ success: false, message: "Producto no encontrado." });
  }

  const barcodeList = Array.isArray(barcodes)
    ? barcodes.filter(b => typeof b === "string" && b.trim()).slice(0, 3)
    : (barcode ? [barcode] : (p.barcodes || (p.barcode ? [p.barcode] : [])));

  const updatedProduct = {
    ...p,
    name,
    expirationDate: expirationDate || "2027-12-31",
    laboratory,
    cost: Number(cost) || 0,
    price: Number(price) || 0,
    priceUnits: priceUnits !== undefined ? Number(priceUnits) : undefined,
    category,
    ...normalizeQuantities(quantityOnSkins, quantityUnits, conversionFactor),
    minStockAlert: (minStockAlert !== undefined && minStockAlert !== null && minStockAlert !== "" && !isNaN(Number(minStockAlert))) ? Math.max(0, Number(minStockAlert)) : 0,
    barcode: barcodeList[0] || barcode || "",
    barcodes: barcodeList,
    fotoUrl: fotoUrl || p.fotoUrl || "",
    isActive: true
  };

  await updateProduct(id, updatedProduct);
  res.json({ success: true, product: updatedProduct });
});

// Delete existing product
app.post("/api/inventory/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID de producto requerido." });
    }

    const productsList = await getProducts();
    const p = productsList.find(prod => prod.id === id);
    if (!p) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }

    await deleteProduct(id);
    res.json({ success: true, message: `Producto "${p.name}" eliminado correctamente.` });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ success: false, message: "Error al eliminar producto." });
  }
});

// Inbound supplier invoice (load items)
app.post("/api/inventory/invoice", async (req, res) => {
  const { supplierId, productId, quantitySkins, quantityUnits, cost, price, expirationDate } = req.body;

  try {
    const overrideFields: any = {};
    if (cost !== undefined && cost !== null && cost > 0) overrideFields.cost = Number(cost);
    if (price !== undefined && price !== null && price > 0) overrideFields.price = Number(price);
    if (expirationDate) overrideFields.expirationDate = expirationDate;

    const success = await adjustProductStock(
      productId,
      Number(quantitySkins) || 0,
      Number(quantityUnits) || 0,
      overrideFields
    );
    
    if (success.ok) {
      const productsList = await getProducts();
      const updated = productsList.find(prod => prod.id === productId);
      return res.json({ success: true, product: updated });
    } else {
      return res.status(404).json({ success: false, message: "Producto no encontrado o no se pudo actualizar." });
    }
  } catch (err) {
    console.error(`Error al cargar inventario para el producto ${productId}:`, err);
    return res.status(500).json({ success: false, message: "Error interno al procesar factura." });
  }
});

// Bulk inbound supplier invoice loading (multi-item)
app.post("/api/inventory/invoice/bulk", async (req, res) => {
  const { supplierId, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "No se proporcionaron productos para cargar." });
  }

  let updatedCount = 0;
  let totalInvoiceCost = 0;
  const productsList = await getProducts();

  for (const item of items) {
    const { productId, isNewProduct, name, laboratory, category, conversionFactor, quantitySkins, quantityUnits, cost, price, priceUnits, expirationDate, minStockAlert, barcode, barcodes, fotoUrl } = item;
    try {
      const existingProduct = productsList.find(prod => prod.id === productId);

      if (isNewProduct || !existingProduct) {
        // It's a new product created staged inside this invoice
        const finalId = (productId && !productId.startsWith("new-prod-"))
          ? productId
          : "prod-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);

        const barcodeList = Array.isArray(barcodes)
          ? barcodes.filter((b: any) => typeof b === "string" && b.trim()).slice(0, 3)
          : (barcode ? [barcode] : []);

        const newProductObj = {
          id: finalId,
          name: name || item.productName || "Producto",
          expirationDate: expirationDate || "2027-12-31",
          laboratory: laboratory || "General",
          cost: Number(cost) || 0,
          price: Number(price) || 0,
          priceUnits: priceUnits !== undefined && priceUnits !== null ? Number(priceUnits) : undefined,
          category: category || "General",
          ...normalizeQuantities(quantitySkins, quantityUnits, conversionFactor),
          minStockAlert: (minStockAlert !== undefined && minStockAlert !== null && minStockAlert !== "" && !isNaN(Number(minStockAlert))) ? Math.max(0, Number(minStockAlert)) : 0,
          barcode: barcodeList[0] || barcode || "",
          barcodes: barcodeList,
          fotoUrl: fotoUrl || "",
          isActive: true
        };

        await addProduct(newProductObj);
        updatedCount++;

        const factor = newProductObj.conversionFactor || 1;
        const itemSkins = Number(quantitySkins) || 0;
        const itemUnits = Number(quantityUnits) || 0;
        const itemCost = Number(cost) || 0;
        totalInvoiceCost += itemCost * (itemSkins + (factor > 1 ? (itemUnits / factor) : 0));
      } else {
        // Existing product: adjust stock & override price/cost/expiration if provided
        const overrideFields: any = {};
        if (cost !== undefined && cost !== null && cost > 0) overrideFields.cost = Number(cost);
        if (price !== undefined && price !== null && price > 0) overrideFields.price = Number(price);
        if (priceUnits !== undefined && priceUnits !== null && priceUnits > 0) overrideFields.priceUnits = Number(priceUnits);
        if (expirationDate) overrideFields.expirationDate = expirationDate;

        const success = await adjustProductStock(
          productId,
          Number(quantitySkins) || 0,
          Number(quantityUnits) || 0,
          overrideFields
        );

        if (success.ok) {
          updatedCount++;
          const factor = existingProduct.conversionFactor || 1;
          const itemSkins = Number(quantitySkins) || 0;
          const itemUnits = Number(quantityUnits) || 0;
          const itemCost = Number(cost) || existingProduct.cost || 0;
          totalInvoiceCost += itemCost * (itemSkins + (factor > 1 ? (itemUnits / factor) : 0));
        }
      }
    } catch (err) {
      console.error(`Error al cargar inventario para el producto ${productId}:`, err);
    }
  }

  if (updatedCount > 0 && totalInvoiceCost > 0) {
    try {
      const suppliersList = await getSuppliers();
      const supplier = suppliersList.find(s => s.id === supplierId);
      const supplierName = supplier ? supplier.companyName : "Proveedor";
      const todayStr = getBogotaDateStr();

      const supplierInvoiceObj = {
        id: "sup-inv-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        supplierId: supplierId || "unknown",
        supplierName,
        date: todayStr,
        totalCost: Math.round(totalInvoiceCost),
        timestamp: new Date().toISOString()
      };
      await addSupplierInvoice(supplierInvoiceObj);
    } catch (err) {
      console.error("Error saving supplier invoice record:", err);
    }
  }

  res.json({ success: true, count: updatedCount });
});

app.get("/api/inventory/invoices/history", async (req, res) => {
  const invoicesList = await getSupplierInvoices();
  res.json(invoicesList);
});

// Manage suppliers, labs, categories
app.get("/api/inventory/manage/suppliers", async (req, res) => {
  const suppliersList = await getSuppliers();
  res.json(suppliersList);
});

app.post("/api/inventory/manage/suppliers", async (req, res) => {
  const { companyName, nit, phone, whatsapp } = req.body;
  if (!companyName) {
    return res.status(400).json({ success: false, message: "Nombre de la empresa es obligatorio." });
  }
  const newSupplier = {
    id: "sup-" + Date.now(),
    companyName,
    nit: nit || "",
    phone: phone || "",
    whatsapp: whatsapp || ""
  };
  await addSupplier(newSupplier);
  res.status(201).json({ success: true, supplier: newSupplier });
});

app.get("/api/inventory/manage/laboratories", async (req, res) => {
  const laboratoriesList = await getLaboratories();
  res.json(laboratoriesList);
});

app.post("/api/inventory/manage/laboratories", async (req, res) => {
  const { name } = req.body;
  const laboratoriesList = await getLaboratories();
  if (!name || laboratoriesList.includes(name)) {
    return res.status(400).json({ success: false, message: "Laboratorio inválido o duplicado." });
  }
  await addLaboratory(name);
  const updated = await getLaboratories();
  res.status(201).json({ success: true, laboratories: updated });
});

app.get("/api/inventory/manage/categories", async (req, res) => {
  const categoriesList = await getCategories();
  res.json(categoriesList);
});

app.post("/api/inventory/manage/categories", async (req, res) => {
  const { name } = req.body;
  const categoriesList = await getCategories();
  if (!name || categoriesList.includes(name)) {
    return res.status(400).json({ success: false, message: "Categoría inválida o duplicada." });
  }
  await addCategory(name);
  const updated = await getCategories();
  res.status(201).json({ success: true, categories: updated });
});

app.delete("/api/inventory/manage/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  await deleteSupplier(id);
  res.json({ success: true });
});

app.delete("/api/inventory/manage/laboratories", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "Nombre de laboratorio requerido." });
  }
  await deleteLaboratory(name);
  res.json({ success: true });
});

app.delete("/api/inventory/manage/categories", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: "Nombre de categoría requerido." });
  }
  await deleteCategory(name);
  res.json({ success: true });
});

// Toma el precio enviado por el mostrador (permite descuentos puntuales) y
// cae al precio del catálogo cuando no viene o no es un número válido.
function resolveLinePrice(sent: any, catalogPrice: any): number {
  const sentValue = Number(sent);
  if (Number.isFinite(sentValue) && sentValue >= 0) return sentValue;
  return Number(catalogPrice) || 0;
}

// Register POS Sales (facturación)
app.post("/api/sales", async (req, res) => {
  const { sellerId, sellerName, items, clientNit, dateTime, timestamp } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "No hay productos en la factura." });
  }

  const productsList = await getProducts();

  // 1) Validar todo contra el catálogo ANTES de tocar el inventario: el total
  //    se recalcula aquí y no se acepta el que envía el cliente.
  const normalizedItems: any[] = [];
  const outOfStock: string[] = [];

  for (const item of items) {
    const product = productsList.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: `El producto "${item.productName || item.productId}" ya no existe en el inventario.`
      });
    }

    const skins = Math.max(0, Number(item.quantitySkins ?? item.qtySkins) || 0);
    const units = Math.max(0, Number(item.quantityUnits ?? item.qtyUnits) || 0);
    const factor = Number(product.conversionFactor) || 1;
    const requestedUnits = (skins * factor) + units;

    if (requestedUnits <= 0) {
      return res.status(400).json({
        success: false,
        message: `La cantidad de "${product.name}" debe ser mayor a cero.`
      });
    }

    const availableUnits = totalUnitsOf(product);
    if (requestedUnits > availableUnits) {
      outOfStock.push(`${product.name} (disponibles: ${availableUnits}, solicitadas: ${requestedUnits})`);
      continue;
    }

    const priceSkins = resolveLinePrice(item.priceSkins ?? item.price, product.price);
    const priceUnits = resolveLinePrice(
      item.priceUnits,
      factor > 1 ? (product.priceUnits || (Number(product.price) || 0) / factor) : product.price
    );
    const subtotal = Math.round((skins * priceSkins) + (units * priceUnits));

    normalizedItems.push({
      productId: product.id,
      productName: product.name,
      quantitySkins: skins,
      quantityUnits: units,
      qtySkins: skins,
      qtyUnits: units,
      priceSkins,
      priceUnits,
      price: priceSkins,
      subtotal
    });
  }

  if (outOfStock.length > 0) {
    return res.status(409).json({
      success: false,
      code: "INSUFFICIENT_STOCK",
      message: `No hay existencias suficientes para: ${outOfStock.join("; ")}.`
    });
  }

  // 2) Descontar el inventario. Si una línea falla, se devuelve lo ya
  //    descontado: nunca queda una venta a medias.
  const applied: any[] = [];
  for (const line of normalizedItems) {
    let result: StockAdjustResult;
    try {
      result = await deductProductStock(line.productId, line.quantitySkins, line.quantityUnits);
    } catch (err) {
      console.error(`Error al deducir inventario para el producto ${line.productId}:`, err);
      result = { ok: false, reason: "conflict" };
    }

    if (!result.ok) {
      for (const done of applied) {
        try {
          await adjustProductStock(done.productId, done.quantitySkins, done.quantityUnits);
        } catch (err) {
          console.error(`Error al revertir el inventario de ${done.productId}:`, err);
        }
      }
      const message = result.reason === "insufficient"
        ? `Las existencias de "${line.productName}" cambiaron mientras se procesaba la venta. Verifique e intente de nuevo.`
        : `No se pudo actualizar el inventario de "${line.productName}". La venta no fue registrada.`;
      return res.status(409).json({ success: false, code: "STOCK_UPDATE_FAILED", message });
    }
    applied.push(line);
  }

  const finalTotal = normalizedItems.reduce((sum, line) => sum + line.subtotal, 0);

  const nextInvoiceNo = await getNextInvoiceNumber();
  const newInvoice = {
    id: req.body.id || ("sale-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6)),
    invoiceNumber: req.body.invoiceNumber || nextInvoiceNo,
    dateTime: dateTime || timestamp || new Date().toISOString(),
    timestamp: timestamp || dateTime || new Date().toISOString(),
    sellerId: sellerId || "anonymous",
    sellerName: sellerName || "Vendedor",
    items: normalizedItems,
    total: finalTotal,
    totalAmount: finalTotal,
    clientNit: clientNit || "",
    paymentMethod: req.body.paymentMethod || "Efectivo"
  };

  await addSale(newInvoice);

  // Daily cash balance increment
  const todayStr = getBogotaDateStr();
  await incrementClosureTotals(todayStr, finalTotal, 1);

  res.status(201).json({ success: true, invoice: newInvoice });
});

app.get("/api/sales", async (req, res) => {
  const salesList = await getSales();
  res.json(salesList);
});

// Daily cash closure management
app.get("/api/closure", async (req, res) => {
  const todayStr = getBogotaDateStr();
  let active = await getClosure(todayStr);
  if (!active) {
    const closedToday = await getClosedToday(todayStr);
    if (closedToday) {
      return res.json(closedToday);
    }
    active = {
      id: "close-" + todayStr,
      date: todayStr,
      totalSalesCount: 0,
      totalSalesRevenue: 0,
      totalExpenses: 0,
      initialCash: 0,
      finalCash: 0,
      expenses: [],
      isClosed: false
    };
  }
  res.json(active);
});

app.post(["/api/closure/expense", "/api/closures/expense"], async (req, res) => {
  const todayStr = getBogotaDateStr();
  const { description, amount } = req.body;

  if (!description || !amount) {
    return res.status(400).json({ success: false, message: "Descripción y valor obligatorios." });
  }

  const expObj = { id: req.body.id || ("exp-" + Date.now()), description, amount: Number(amount), timestamp: req.body.timestamp || req.body.date || new Date().toISOString() };
  await addExpenseToClosure(todayStr, expObj);

  const updatedClosure = await getClosure(todayStr);
  res.json({ success: true, closure: updatedClosure });
});

app.post(["/api/closure/close", "/api/closures/finalize", "/api/closure/finalize"], async (req, res) => {
  const todayStr = getBogotaDateStr();
  const closure = req.body?.closureId
    ? ((await getClosures()).find((c: any) => c.id === req.body.closureId) || await getClosure(todayStr))
    : await getClosure(todayStr);

  if (!closure) {
    return res.status(404).json({ success: false, message: "No hay cierre activo para procesar." });
  }

  closure.isClosed = true;
  closure.closedAt = new Date().toISOString();
  await saveClosure(closure);

  res.json({ success: true, closure });
});

app.get("/api/closure/history", async (req, res) => {
  const historyList = await getClosures();
  res.json(historyList);
});

// Client Offline Synchronization API
app.post("/api/sync", async (req, res) => {
  const { clientActions } = req.body;
  const logs: any[] = [];
  
  if (!clientActions || clientActions.length === 0) {
    return res.json({ success: true, syncedCount: 0, logs: ["Sin cambios offline."] });
  }

  const productsList = await getProducts();

  for (const action of clientActions) {
    const { type, entity, data, timestamp } = action;
    
    if (entity === "expense") {
      const todayStr = getBogotaDateStr(new Date(timestamp));
      const expObj = { id: data.id || "exp-" + Date.now(), description: data.description, amount: Number(data.amount), timestamp };
      await addExpenseToClosure(todayStr, expObj);
      logs.push(`Gasto sincronizado exitosamente: "${data.description}" por $${data.amount}`);
    }
    else if (entity === "sale") {
      const finalTotal = Number(data.total !== undefined ? data.total : data.totalAmount) || 0;
      for (const item of (data.items || [])) {
        try {
          const skins = Number(item.quantitySkins ?? item.qtySkins) || 0;
          const units = Number(item.quantityUnits ?? item.qtyUnits) || 0;
          // La venta ya ocurrió físicamente en el mostrador: no se puede
          // rechazar. Si el inventario no alcanza, queda en cero y se avisa.
          const result = await deductProductStock(item.productId, skins, units, { allowNegative: true });
          if (!result.ok) {
            logs.push(`Aviso: no se pudo descontar "${item.productName || item.productId}" del inventario; revise sus existencias.`);
          }
        } catch (err) {
          console.error(`Error al deducir inventario offline para el producto ${item.productId}:`, err);
          logs.push(`Aviso: error descontando "${item.productName || item.productId}" del inventario.`);
        }
      }

      const invoiceNo = data.invoiceNumber || (await getNextInvoiceNumber());
      const newSale = {
        id: data.id || ("sale-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6)),
        invoiceNumber: invoiceNo,
        dateTime: data.dateTime || data.timestamp || timestamp || new Date().toISOString(),
        timestamp: data.timestamp || data.dateTime || timestamp || new Date().toISOString(),
        sellerId: data.sellerId || "anonymous",
        sellerName: data.sellerName || "Vendedor",
        items: (data.items || []).map((it: any) => ({
          ...it,
          quantitySkins: Number(it.quantitySkins ?? it.qtySkins) || 0,
          quantityUnits: Number(it.quantityUnits ?? it.qtyUnits) || 0,
          qtySkins: Number(it.qtySkins ?? it.quantitySkins) || 0,
          qtyUnits: Number(it.qtyUnits ?? it.quantityUnits) || 0,
          subtotal: Number(it.subtotal ?? it.total) || 0
        })),
        total: finalTotal,
        totalAmount: finalTotal,
        clientNit: data.clientNit || "",
        paymentMethod: data.paymentMethod || "Efectivo"
      };
      await addSale(newSale);

      const todayStr = getBogotaDateStr(new Date(timestamp));
      await incrementClosureTotals(todayStr, finalTotal, 1);
      logs.push(`Factura ${invoiceNo} por $${finalTotal.toLocaleString("es-CO")} sincronizada correctamente.`);
    }
    else if (entity === "product") {
      const prodExists = productsList.some(p => p.id === data.id || p.name.toLowerCase() === data.name.toLowerCase());
      if (!prodExists) {
        const barcodeList = Array.isArray(data.barcodes)
          ? data.barcodes.filter((b: any) => typeof b === "string" && b.trim()).slice(0, 3)
          : (data.barcode ? [data.barcode] : []);

        const newP = {
          id: data.id || "prod-" + Date.now(),
          name: data.name,
          expirationDate: data.expirationDate,
          laboratory: data.laboratory,
          cost: Number(data.cost) || 0,
          price: Number(data.price) || 0,
          priceUnits: data.priceUnits !== undefined ? Number(data.priceUnits) : undefined,
          category: data.category,
          quantityOnSkins: Number(data.quantityOnSkins) || 0,
          quantityUnits: Number(data.quantityUnits) || 0,
          conversionFactor: Number(data.conversionFactor) || 1,
          minStockAlert: (data.minStockAlert !== undefined && data.minStockAlert !== null && data.minStockAlert !== "" && !isNaN(Number(data.minStockAlert))) ? Math.max(0, Number(data.minStockAlert)) : 0,
          barcode: barcodeList[0] || data.barcode || "",
          barcodes: barcodeList,
          fotoUrl: data.fotoUrl || "",
          isActive: true
        };
        await addProduct(newP);
        logs.push(`Nuevo producto offline registrado: "${data.name}"`);
      } else {
        logs.push(`Reconciliación: Producto "${data.name}" ya existía en la nube, se consolida stock.`);
      }
    }
    else if (entity === "product_edit") {
      const p = productsList.find(prod => prod.id === data.id);
      if (p) {
        const barcodeList = Array.isArray(data.barcodes)
          ? data.barcodes.filter((b: any) => typeof b === "string" && b.trim()).slice(0, 3)
          : (data.barcode ? [data.barcode] : (p.barcodes || (p.barcode ? [p.barcode] : [])));

        const updated = {
          ...p,
          name: data.name,
          expirationDate: data.expirationDate || p.expirationDate,
          laboratory: data.laboratory,
          cost: Number(data.cost) || 0,
          price: Number(data.price) || 0,
          priceUnits: data.priceUnits !== undefined ? Number(data.priceUnits) : p.priceUnits,
          category: data.category,
          quantityOnSkins: Number(data.quantityOnSkins) || 0,
          quantityUnits: Number(data.quantityUnits) || 0,
          conversionFactor: Number(data.conversionFactor) || 1,
          minStockAlert: (data.minStockAlert !== undefined && data.minStockAlert !== null && data.minStockAlert !== "" && !isNaN(Number(data.minStockAlert))) ? Math.max(0, Number(data.minStockAlert)) : 0,
          barcode: barcodeList[0] || data.barcode || "",
          barcodes: barcodeList,
          fotoUrl: data.fotoUrl || p.fotoUrl || ""
        };
        await updateProduct(data.id, updated);
        logs.push(`Edición de producto offline registrada: "${data.name}"`);
      }
    }
    else if (entity === "product_delete" || (type === "DELETE" && entity === "product")) {
      await deleteProduct(data.id);
      logs.push(`Eliminación de producto offline registrada: ID "${data.id}"`);
    }
    else if (entity === "restock" || entity === "invoice_bulk") {
      const itemsToProcess = Array.isArray(data.items) ? data.items : [data];
      let restockedCount = 0;
      let totalInvoiceCost = 0;
      
      for (const item of itemsToProcess) {
        try {
          const { productId, isNewProduct, name, laboratory, category, conversionFactor, quantitySkins, quantityUnits, cost, price, priceUnits, expirationDate, minStockAlert, barcode, barcodes, fotoUrl } = item;
          const existingProduct = productsList.find(prod => prod.id === productId);

          if (isNewProduct || !existingProduct) {
            const finalId = (productId && !productId.startsWith("new-prod-"))
              ? productId
              : "prod-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);

            const barcodeList = Array.isArray(barcodes)
              ? barcodes.filter((b: any) => typeof b === "string" && b.trim()).slice(0, 3)
              : (barcode ? [barcode] : []);

            const newProductObj = {
              id: finalId,
              name: name || item.productName || "Producto",
              expirationDate: expirationDate || "2027-12-31",
              laboratory: laboratory || "General",
              cost: Number(cost) || 0,
              price: Number(price) || 0,
              priceUnits: priceUnits !== undefined && priceUnits !== null ? Number(priceUnits) : undefined,
              category: category || "General",
              ...normalizeQuantities(quantitySkins, quantityUnits, conversionFactor),
              minStockAlert: (minStockAlert !== undefined && minStockAlert !== null && minStockAlert !== "" && !isNaN(Number(minStockAlert))) ? Math.max(0, Number(minStockAlert)) : 0,
              barcode: barcodeList[0] || barcode || "",
              barcodes: barcodeList,
              fotoUrl: fotoUrl || "",
              isActive: true
            };

            await addProduct(newProductObj);
            restockedCount++;

            const factor = newProductObj.conversionFactor || 1;
            const itemSkins = Number(quantitySkins) || 0;
            const itemUnits = Number(quantityUnits) || 0;
            const itemCost = Number(cost) || 0;
            totalInvoiceCost += itemCost * (itemSkins + (factor > 1 ? (itemUnits / factor) : 0));
          } else {
            const overrideFields: any = {};
            if (cost !== undefined && cost !== null && cost > 0) overrideFields.cost = Number(cost);
            if (price !== undefined && price !== null && price > 0) overrideFields.price = Number(price);
            if (priceUnits !== undefined && priceUnits !== null && priceUnits > 0) overrideFields.priceUnits = Number(priceUnits);
            if (expirationDate) overrideFields.expirationDate = expirationDate;

            const success = await adjustProductStock(
              productId,
              Number(quantitySkins) || 0,
              Number(quantityUnits) || 0,
              overrideFields
            );
            if (success.ok) {
              restockedCount++;
              const factor = existingProduct.conversionFactor || 1;
              const itemSkins = Number(quantitySkins) || 0;
              const itemUnits = Number(quantityUnits) || 0;
              const itemCost = Number(cost) || existingProduct.cost || 0;
              totalInvoiceCost += itemCost * (itemSkins + (factor > 1 ? (itemUnits / factor) : 0));
            }
          }
        } catch (err) {
          console.error(`Error deconcurrente al cargar inventario offline para el producto ${item.productId}:`, err);
        }
      }
      
      if (restockedCount > 0 && totalInvoiceCost > 0) {
        try {
          const suppliersList = await getSuppliers();
          const supplier = suppliersList.find(s => s.id === data.supplierId);
          const supplierName = supplier ? supplier.companyName : "Proveedor";
          const invoiceDate = getBogotaDateStr(new Date(timestamp));
          
          const supplierInvoiceObj = {
            id: "sup-inv-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
            supplierId: data.supplierId || "unknown",
            supplierName,
            date: invoiceDate,
            totalCost: Math.round(totalInvoiceCost),
            timestamp: timestamp
          };
          await addSupplierInvoice(supplierInvoiceObj);
        } catch (err) {
          console.error("Error saving synced supplier invoice record:", err);
        }
      }
      
      logs.push(`Servidor: Se sincronizó cargue de inventario offline (${restockedCount} productos procesados con costo total $${Math.round(totalInvoiceCost)}).`);
    }
  }

  res.json({ success: true, syncedCount: clientActions.length, logs });
});

// Serve frontend static assets locally (Vercel routes them natively using rewrites)
if (!process.env.VERCEL) {
  const initLocalFrontend = async () => {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  };
  initLocalFrontend();
}

export default app;
