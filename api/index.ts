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

const DEFAULT_STATE: AppState = {
  users: [
    { id: "1", name: "Administrador Vexa POS", email: "drogueriagratamira@gmail.com", password: hashPassword("43518612"), role: "admin", profileImage: "" }
  ],
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
  const db = loadDb();
  const nextSeq = db.sales.length + 1;
  return "FC-" + String(nextSeq).padStart(5, "0");
}

async function adjustProductStock(productId: string, skinChange: number, unitChange: number, overrideFields?: { cost?: number, price?: number, priceUnits?: number, expirationDate?: string }): Promise<boolean> {
  let currentSkins = 0;
  let currentUnits = 0;
  let conversionFactor = 1;

  if (mongoDb) {
    const prod = await mongoDb.collection("products").findOne({ id: productId });
    if (!prod) return false;
    currentSkins = prod.quantityOnSkins || 0;
    currentUnits = prod.quantityUnits || 0;
    conversionFactor = prod.conversionFactor || 1;
  } else {
    const db = loadDb();
    const prod = db.products.find(p => p.id === productId);
    if (!prod) return false;
    currentSkins = prod.quantityOnSkins || 0;
    currentUnits = prod.quantityUnits || 0;
    conversionFactor = prod.conversionFactor || 1;
  }

  const totalUnitsInStock = (currentSkins * conversionFactor) + currentUnits;
  const totalUnitsChange = (skinChange * conversionFactor) + unitChange;
  const remainingTotalUnits = Math.max(0, totalUnitsInStock + totalUnitsChange);

  let newSkins = 0;
  let newUnits = 0;
  if (conversionFactor > 1) {
    newSkins = Math.floor(remainingTotalUnits / conversionFactor);
    newUnits = remainingTotalUnits % conversionFactor;
  } else {
    newSkins = remainingTotalUnits;
    newUnits = 0;
  }

  const updatedFields: any = {
    quantityOnSkins: newSkins,
    quantityUnits: newUnits
  };

  if (overrideFields) {
    if (overrideFields.cost !== undefined) updatedFields.cost = overrideFields.cost;
    if (overrideFields.price !== undefined) updatedFields.price = overrideFields.price;
    if (overrideFields.priceUnits !== undefined) updatedFields.priceUnits = overrideFields.priceUnits;
    if (overrideFields.expirationDate !== undefined) updatedFields.expirationDate = overrideFields.expirationDate;
  }

  if (mongoDb) {
    const res = await mongoDb.collection("products").updateOne(
      { id: productId },
      { $set: updatedFields }
    );
    return res.matchedCount > 0;
  } else {
    const db = loadDb();
    const idx = db.products.findIndex(p => p.id === productId);
    if (idx !== -1) {
      db.products[idx] = { ...db.products[idx], ...updatedFields };
      saveDb(db);
    }
    return true;
  }
}

async function deductProductStock(productId: string, deductSkins: number, deductUnits: number): Promise<boolean> {
  return adjustProductStock(productId, -deductSkins, -deductUnits);
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

// Root health check
app.get("/api/health", (req, res) => {
  res.json({ status: "alive", timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Correo y contraseña requeridos." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await getUsers();
    const user = users.find(u => (u.email || "").trim().toLowerCase() === cleanEmail);

    if (!user || !user.password || !verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, message: "Correo o contraseña incorrectos." });
    }

    // Auto-migrate legacy plain text passwords in database to secure hash format
    if (!user.password.startsWith("s2:")) {
      const newHashed = hashPassword(password);
      await updateUserPassword(user.id, newHashed);
    }

    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.role = user.role || "admin";
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    console.error("Login processing error:", err);
    res.status(500).json({ success: false, message: "Error interno al procesar el inicio de sesión." });
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

app.post("/api/profile/business", async (req, res) => {
  const { name, nit, foundationYear, phone, address, city, logoUrl } = req.body;
  const business = { name, nit, foundationYear, phone, address, city, logoUrl };
  await updateBusinessConfig(business);
  res.json({ success: true, business });
});

app.post("/api/profile/personal", async (req, res) => {
  try {
    const { userId, name, profileImage } = req.body;
    console.log("[Droguería Backend] POST /api/profile/personal request received:", { userId, name, profileImageLength: profileImage ? profileImage.length : 0 });
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
      quantityOnSkins: Number(quantityOnSkins) || 0,
      quantityUnits: Number(quantityUnits) || 0,
      conversionFactor: Number(conversionFactor) || 1,
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
    quantityOnSkins: Number(quantityOnSkins) || 0,
    quantityUnits: Number(quantityUnits) || 0,
    conversionFactor: Number(conversionFactor) || 1,
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
    
    if (success) {
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
    const { productId, isNewProduct, name, laboratory, category, conversionFactor, quantitySkins, quantityUnits, cost, price, priceUnits, expirationDate, minStockAlert, barcode, fotoUrl } = item;
    try {
      const existingProduct = productsList.find(prod => prod.id === productId);

      if (isNewProduct || !existingProduct) {
        // It's a new product created staged inside this invoice
        const finalId = (productId && !productId.startsWith("new-prod-"))
          ? productId
          : "prod-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);

        const newProductObj = {
          id: finalId,
          name: name || item.productName || "Producto",
          expirationDate: expirationDate || "2027-12-31",
          laboratory: laboratory || "General",
          cost: Number(cost) || 0,
          price: Number(price) || 0,
          priceUnits: priceUnits !== undefined && priceUnits !== null ? Number(priceUnits) : undefined,
          category: category || "General",
          quantityOnSkins: Number(quantitySkins) || 0,
          quantityUnits: Number(quantityUnits) || 0,
          conversionFactor: Number(conversionFactor) || 1,
          minStockAlert: (minStockAlert !== undefined && minStockAlert !== null && minStockAlert !== "" && !isNaN(Number(minStockAlert))) ? Math.max(0, Number(minStockAlert)) : 0,
          barcode: barcode || "",
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

        if (success) {
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

// Register POS Sales (facturación)
app.post("/api/sales", async (req, res) => {
  const { sellerId, sellerName, items, total, totalAmount, clientNit, dateTime, timestamp } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "No hay productos en la factura." });
  }

  const finalTotal = Number(total !== undefined ? total : totalAmount) || 0;

  // Process product stock reduction
  for (const item of items) {
    try {
      const skins = Number(item.quantitySkins ?? item.qtySkins) || 0;
      const units = Number(item.quantityUnits ?? item.qtyUnits) || 0;
      await deductProductStock(item.productId, skins, units);
    } catch (err) {
      console.error(`Error deconcurrente al deducir inventario para el producto ${item.productId}:`, err);
    }
  }

  const nextInvoiceNo = await getNextInvoiceNumber();
  const newInvoice = {
    id: req.body.id || ("sale-" + Date.now()),
    invoiceNumber: req.body.invoiceNumber || nextInvoiceNo,
    dateTime: dateTime || timestamp || new Date().toISOString(),
    timestamp: timestamp || dateTime || new Date().toISOString(),
    sellerId: sellerId || "anonymous",
    sellerName: sellerName || "Vendedor",
    items: items.map((it: any) => ({
      ...it,
      quantitySkins: Number(it.quantitySkins ?? it.qtySkins) || 0,
      quantityUnits: Number(it.quantityUnits ?? it.qtyUnits) || 0,
      qtySkins: Number(it.qtySkins ?? it.quantitySkins) || 0,
      qtyUnits: Number(it.qtyUnits ?? it.quantityUnits) || 0,
      subtotal: Number(it.subtotal ?? it.total) || 0
    })),
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

app.post("/api/closure/expense", async (req, res) => {
  const todayStr = getBogotaDateStr();
  const { description, amount } = req.body;

  if (!description || !amount) {
    return res.status(400).json({ success: false, message: "Descripción y valor obligatorios." });
  }

  const expObj = { id: "exp-" + Date.now(), description, amount: Number(amount), timestamp: new Date().toISOString() };
  await addExpenseToClosure(todayStr, expObj);

  const updatedClosure = await getClosure(todayStr);
  res.json({ success: true, closure: updatedClosure });
});

app.post("/api/closure/close", async (req, res) => {
  const todayStr = getBogotaDateStr();
  const closure = await getClosure(todayStr);

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
          await deductProductStock(item.productId, skins, units);
        } catch (err) {
          console.error(`Error deconcurrente al deducir inventario offline para el producto ${item.productId}:`, err);
        }
      }

      const invoiceNo = data.invoiceNumber || (await getNextInvoiceNumber());
      const newSale = {
        id: data.id || "sale-" + Date.now(),
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
        const newP = {
          id: data.id || "prod-" + Date.now(),
          name: data.name,
          expirationDate: data.expirationDate,
          laboratory: data.laboratory,
          cost: Number(data.cost) || 0,
          price: Number(data.price) || 0,
          category: data.category,
          quantityOnSkins: Number(data.quantityOnSkins) || 0,
          quantityUnits: Number(data.quantityUnits) || 0,
          conversionFactor: Number(data.conversionFactor) || 1,
          minStockAlert: (data.minStockAlert !== undefined && data.minStockAlert !== null && data.minStockAlert !== "" && !isNaN(Number(data.minStockAlert))) ? Math.max(0, Number(data.minStockAlert)) : 0,
          barcode: data.barcode || "",
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
          barcode: data.barcode || "",
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
          const { productId, isNewProduct, name, laboratory, category, conversionFactor, quantitySkins, quantityUnits, cost, price, priceUnits, expirationDate, minStockAlert, barcode, fotoUrl } = item;
          const existingProduct = productsList.find(prod => prod.id === productId);

          if (isNewProduct || !existingProduct) {
            const finalId = (productId && !productId.startsWith("new-prod-"))
              ? productId
              : "prod-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);

            const newProductObj = {
              id: finalId,
              name: name || item.productName || "Producto",
              expirationDate: expirationDate || "2027-12-31",
              laboratory: laboratory || "General",
              cost: Number(cost) || 0,
              price: Number(price) || 0,
              priceUnits: priceUnits !== undefined && priceUnits !== null ? Number(priceUnits) : undefined,
              category: category || "General",
              quantityOnSkins: Number(quantitySkins) || 0,
              quantityUnits: Number(quantityUnits) || 0,
              conversionFactor: Number(conversionFactor) || 1,
              minStockAlert: (minStockAlert !== undefined && minStockAlert !== null && minStockAlert !== "" && !isNaN(Number(minStockAlert))) ? Math.max(0, Number(minStockAlert)) : 0,
              barcode: barcode || "",
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
            if (success) {
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
