import express from "express";
import path from "path";
import fs from "fs";
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
}

const DEFAULT_STATE: AppState = {
  users: [
    { id: "1", name: "Administrador Vexa POS", email: "drogueriagratamira@gmail.com", password: "43518612", role: "admin", profileImage: "" }
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
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database file, using fallback state:", err);
  }
  saveDb(DEFAULT_STATE);
  return DEFAULT_STATE;
}

// MongoDB Connections state
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

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
      await mongoDb.collection("users").insertMany(localDb.users);
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

async function connectToMongo() {
  if (!MONGODB_URI) {
    console.log("[Droguería Backend] MONGODB_URI not found in environment. Using local db-store.json");
    return null;
  }
  try {
    console.log("[Droguería Backend] Connecting to MongoDB Atlas...");
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("[Droguería Backend] Connected successfully to MongoDB Atlas.");
    mongoClient = client;
    mongoDb = client.db();
    
    // Seed DB
    await seedMongoDatabase();
    return mongoDb;
  } catch (err) {
    console.error("[Droguería Backend] MongoDB connection failed. Falling back to local JSON store.", err);
    return null;
  }
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

async function getClosures() {
  if (mongoDb) {
    return await mongoDb.collection("closures").find({}).toArray();
  }
  return loadDb().closures;
}

async function getClosure(date: string) {
  if (mongoDb) {
    return await mongoDb.collection("closures").findOne({ date, isClosed: false });
  }
  return loadDb().closures.find(c => c.date === date && !c.isClosed);
}

async function getClosedToday(date: string) {
  if (mongoDb) {
    return await mongoDb.collection("closures").findOne({ date, isClosed: true });
  }
  return loadDb().closures.find(c => c.date === date && c.isClosed);
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

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB Atlas
connectToMongo();

// Root health check
app.get("/api/health", (req, res) => {
  res.json({ status: "alive", timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const users = await getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } else {
    res.status(401).json({ success: false, message: "Correo o contraseña incorrectos." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const users = await getUsers();
  const exists = users.some(u => u.email === email);
  if (exists) {
    return res.status(400).json({ success: false, message: "El correo ya está registrado." });
  }

  const newUser = {
    id: "u-" + Date.now(),
    name,
    email,
    password,
    role: role || "worker",
    profileImage: ""
  };
  await addUser(newUser);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ success: true, user: userWithoutPassword });
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

// Inventory endpoint: List all products
app.get("/api/inventory", async (req, res) => {
  const productsList = await getProducts();
  res.json(productsList);
});

// Create initial product
app.post("/api/inventory/initial", async (req, res) => {
  const { name, expirationDate, laboratory, cost, price, priceUnits, category, quantityOnSkins, quantityUnits, conversionFactor, minStockAlert, barcode, fotoUrl } = req.body;

  if (!name || !laboratory || !category) {
    return res.status(400).json({ success: false, message: "Faltan campos obligatorios." });
  }

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
    minStockAlert: Number(minStockAlert) || 5,
    barcode: barcode || "",
    fotoUrl: fotoUrl || "",
    isActive: true
  };

  await addProduct(newProduct);
  res.status(201).json({ success: true, product: newProduct });
});

// Inbound supplier invoice (load items)
app.post("/api/inventory/invoice", async (req, res) => {
  const { supplierId, productId, quantitySkins, quantityUnits, cost, price, expirationDate } = req.body;

  const productsList = await getProducts();
  const p = productsList.find(prod => prod.id === productId);
  if (!p) {
    return res.status(404).json({ success: false, message: "Producto no encontrado." });
  }

  p.quantityOnSkins += Number(quantitySkins) || 0;
  p.quantityUnits += Number(quantityUnits) || 0;
  if (cost) p.cost = Number(cost);
  if (price) p.price = Number(price);
  if (expirationDate) p.expirationDate = expirationDate;

  if (p.quantityUnits >= p.conversionFactor && p.conversionFactor > 1) {
    const additionalSkins = Math.floor(p.quantityUnits / p.conversionFactor);
    p.quantityOnSkins += additionalSkins;
    p.quantityUnits = p.quantityUnits % p.conversionFactor;
  }

  await updateProduct(productId, p);
  res.json({ success: true, product: p });
});

// Bulk inbound supplier invoice loading (multi-item)
app.post("/api/inventory/invoice/bulk", async (req, res) => {
  const { supplierId, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "No se proporcionaron productos para cargar." });
  }

  const productsList = await getProducts();
  let updatedCount = 0;

  for (const item of items) {
    const { productId, quantitySkins, quantityUnits, cost, price, priceUnits, expirationDate } = item;
    const p = productsList.find(prod => prod.id === productId);
    if (p) {
      p.quantityOnSkins += Number(quantitySkins) || 0;
      p.quantityUnits += Number(quantityUnits) || 0;
      if (cost !== undefined && cost !== null && cost > 0) p.cost = Number(cost);
      if (price !== undefined && price !== null && price > 0) p.price = Number(price);
      if (priceUnits !== undefined && priceUnits !== null && priceUnits > 0) p.priceUnits = Number(priceUnits);
      if (expirationDate) p.expirationDate = expirationDate;

      if (p.quantityUnits >= p.conversionFactor && p.conversionFactor > 1) {
        const additionalSkins = Math.floor(p.quantityUnits / p.conversionFactor);
        p.quantityOnSkins += additionalSkins;
        p.quantityUnits = p.quantityUnits % p.conversionFactor;
      }

      await updateProduct(productId, p);
      updatedCount++;
    }
  }

  res.json({ success: true, count: updatedCount });
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

// Register POS Sales (facturación)
app.post("/api/sales", async (req, res) => {
  const { sellerId, sellerName, items, total, clientNit } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "No hay productos en la factura." });
  }

  const productsList = await getProducts();

  // Process product stock reduction
  for (const item of items) {
    const prod = productsList.find(p => p.id === item.productId);
    if (prod) {
      let deductSkins = item.quantitySkins || 0;
      let deductUnits = item.quantityUnits || 0;

      const totalUnitsInStock = (prod.quantityOnSkins * prod.conversionFactor) + prod.quantityUnits;
      const totalUnitsToDeduct = (deductSkins * prod.conversionFactor) + deductUnits;

      if (totalUnitsInStock < totalUnitsToDeduct) {
        console.warn(`Inventario negativo detectado para ${prod.name}`);
      }

      const remainingTotalUnits = Math.max(0, totalUnitsInStock - totalUnitsToDeduct);
      
      if (prod.conversionFactor > 1) {
        prod.quantityOnSkins = Math.floor(remainingTotalUnits / prod.conversionFactor);
        prod.quantityUnits = remainingTotalUnits % prod.conversionFactor;
      } else {
        prod.quantityOnSkins = remainingTotalUnits;
        prod.quantityUnits = 0;
      }
      
      await updateProduct(prod.id, prod);
    }
  }

  const salesList = await getSales();
  const nextInvoiceNo = "FC-" + String(salesList.length + 1).padStart(5, "0");
  const newInvoice = {
    id: "sale-" + Date.now(),
    invoiceNumber: nextInvoiceNo,
    dateTime: new Date().toISOString(),
    sellerId: sellerId || "anonymous",
    sellerName: sellerName || "Vendedor",
    items,
    total,
    clientNit: clientNit || ""
  };

  await addSale(newInvoice);

  // Daily cash balance increment
  const todayStr = new Date().toISOString().split("T")[0];
  let closure = await getClosure(todayStr);
  if (!closure) {
    closure = {
      id: "close-" + todayStr,
      date: todayStr,
      totalSalesCount: 1,
      totalSalesRevenue: total,
      totalExpenses: 0,
      initialCash: 100000,
      finalCash: 100000 + total,
      expenses: [],
      isClosed: false
    };
  } else {
    closure.totalSalesCount += 1;
    closure.totalSalesRevenue += total;
    closure.finalCash += total;
  }

  await saveClosure(closure);
  res.status(201).json({ success: true, invoice: newInvoice });
});

app.get("/api/sales", async (req, res) => {
  const salesList = await getSales();
  res.json(salesList);
});

// Daily cash closure management
app.get("/api/closure", async (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];
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
      initialCash: 100000,
      finalCash: 100000,
      expenses: [],
      isClosed: false
    };
  }
  res.json(active);
});

app.post("/api/closure/expense", async (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const { description, amount } = req.body;

  if (!description || !amount) {
    return res.status(400).json({ success: false, message: "Descripción y valor obligatorios." });
  }

  let closure = await getClosure(todayStr);
  const expObj = { id: "exp-" + Date.now(), description, amount: Number(amount), timestamp: new Date().toISOString() };
  if (!closure) {
    closure = {
      id: "close-" + todayStr,
      date: todayStr,
      totalSalesCount: 0,
      totalSalesRevenue: 0,
      totalExpenses: Number(amount),
      initialCash: 100000,
      finalCash: 100000 - Number(amount),
      expenses: [expObj],
      isClosed: false
    };
  } else {
    closure.expenses.push(expObj);
    closure.totalExpenses += Number(amount);
    closure.finalCash -= Number(amount);
  }

  await saveClosure(closure);
  res.json({ success: true, closure });
});

app.post("/api/closure/close", async (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];
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
  const salesList = await getSales();

  for (const action of clientActions) {
    const { type, entity, data, timestamp } = action;
    
    if (entity === "expense") {
      const todayStr = new Date(timestamp).toISOString().split("T")[0];
      let closure = await getClosure(todayStr);
      const expObj = { id: data.id || "exp-" + Date.now(), description: data.description, amount: Number(data.amount), timestamp };
      
      if (!closure) {
        closure = {
          id: "close-" + todayStr,
          date: todayStr,
          totalSalesCount: 0,
          totalSalesRevenue: 0,
          totalExpenses: Number(data.amount),
          initialCash: 100000,
          finalCash: 100000 - Number(data.amount),
          expenses: [expObj],
          isClosed: false
        };
      } else {
        closure.expenses.push(expObj);
        closure.totalExpenses += Number(data.amount);
        closure.finalCash -= Number(data.amount);
      }
      await saveClosure(closure);
      logs.push(`Gasto sincronizado exitosamente: "${data.description}" por $${data.amount}`);
    }
    else if (entity === "sale") {
      for (const item of data.items) {
        const prod = productsList.find(p => p.id === item.productId);
        if (prod) {
          const totalUnitsInStock = (prod.quantityOnSkins * prod.conversionFactor) + prod.quantityUnits;
          const totalUnitsToDeduct = ((item.quantitySkins || 0) * prod.conversionFactor) + (item.quantityUnits || 0);
          const remainingTotalUnits = Math.max(0, totalUnitsInStock - totalUnitsToDeduct);
          
          if (prod.conversionFactor > 1) {
            prod.quantityOnSkins = Math.floor(remainingTotalUnits / prod.conversionFactor);
            prod.quantityUnits = remainingTotalUnits % prod.conversionFactor;
          } else {
            prod.quantityOnSkins = remainingTotalUnits;
            prod.quantityUnits = 0;
          }
          await updateProduct(prod.id, prod);
        }
      }

      const invoiceNo = data.invoiceNumber || ("FC-" + String(salesList.length + 1).padStart(5, "0"));
      const newSale = {
        id: data.id || "sale-" + Date.now(),
        invoiceNumber: invoiceNo,
        dateTime: timestamp,
        sellerId: data.sellerId,
        sellerName: data.sellerName,
        items: data.items,
        total: data.total,
        clientNit: data.clientNit || ""
      };
      await addSale(newSale);

      const todayStr = new Date(timestamp).toISOString().split("T")[0];
      let closure = await getClosure(todayStr);
      if (!closure) {
        closure = {
          id: "close-" + todayStr,
          date: todayStr,
          totalSalesCount: 1,
          totalSalesRevenue: data.total,
          totalExpenses: 0,
          initialCash: 100000,
          finalCash: 100000 + data.total,
          expenses: [],
          isClosed: false
        };
      } else {
        closure.totalSalesCount += 1;
        closure.totalSalesRevenue += data.total;
        closure.finalCash += data.total;
      }
      await saveClosure(closure);
      logs.push(`Factura ${invoiceNo} por $${data.total} sincronizada correctamente.`);
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
          minStockAlert: Number(data.minStockAlert) || 5,
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
    else if (entity === "restock" || entity === "invoice_bulk") {
      const itemsToProcess = Array.isArray(data.items) ? data.items : [data];
      let restockedCount = 0;
      for (const item of itemsToProcess) {
        const p = productsList.find(prod => prod.id === item.productId);
        if (p) {
          p.quantityOnSkins += Number(item.quantitySkins) || 0;
          p.quantityUnits += Number(item.quantityUnits) || 0;
          if (item.cost) p.cost = Number(item.cost);
          if (item.price) p.price = Number(item.price);
          if (item.priceUnits) p.priceUnits = Number(item.priceUnits);
          if (item.expirationDate) p.expirationDate = item.expirationDate;

          if (p.quantityUnits >= p.conversionFactor && p.conversionFactor > 1) {
            const additionalSkins = Math.floor(p.quantityUnits / p.conversionFactor);
            p.quantityOnSkins += additionalSkins;
            p.quantityUnits = p.quantityUnits % p.conversionFactor;
          }
          await updateProduct(p.id, p);
          restockedCount++;
        }
      }
      logs.push(`Servidor: Se sincronizó cargue de inventario offline (${restockedCount} productos procesados).`);
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
