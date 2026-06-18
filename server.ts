import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
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

// Default initial database content
const DEFAULT_STATE: AppState = {
  users: [
    { id: "1", name: "Administrador Vexa POS", email: "admin@vexapos.com", password: "123", role: "admin", profileImage: "" },
    { id: "2", name: "Laura Valentina", email: "laura@vexapos.com", password: "123", role: "worker", profileImage: "" }
  ],
  config: {
    business: {
      name: "Vexa POS",
      nit: "901.405.321-4",
      foundationYear: "2018",
      phone: "+57 (311) 456-7890",
      address: "Calle 134 # 58-20, Suba",
      city: "Bogotá, Colombia"
    }
  },
  products: [
    {
      id: "prod-1",
      name: "Dolex Forte Tabletas 500mg",
      expirationDate: "2028-09-12",
      laboratory: "GSK",
      cost: 15000, // cost of box (12 sobres)
      price: 24000, // retail price per box
      priceUnits: 2500,
      category: "Analgésicos",
      quantityOnSkins: 15,
      quantityUnits: 4,
      conversionFactor: 12, // 12 sobres per box, or 12 units per envelope
      minStockAlert: 10,
      barcode: "7702008123456",
      fotoUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
      isActive: true
    },
    {
      id: "prod-2",
      name: "Acetaminofén Genfar 500mg",
      expirationDate: "2027-11-20",
      laboratory: "Genfar",
      cost: 4000, // cost per box (20 sobres)
      price: 8000,
      priceUnits: 500,
      category: "Analgésicos",
      quantityOnSkins: 40,
      quantityUnits: 0,
      conversionFactor: 20,
      minStockAlert: 15,
      barcode: "7702008777777",
      fotoUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
      isActive: true
    },
    {
      id: "prod-3",
      name: "Amoxicilina 500mg MK",
      expirationDate: "2027-05-15",
      laboratory: "MK",
      cost: 12000, // cost of 30 tablets
      price: 18000,
      priceUnits: 800,
      category: "Antibióticos",
      quantityOnSkins: 8,
      quantityUnits: 15,
      conversionFactor: 30, // 30 units per box
      minStockAlert: 5,
      barcode: "7702008654321",
      fotoUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300",
      isActive: true
    },
    {
      id: "prod-4",
      name: "Emulsión de Scott Naranja",
      expirationDate: "2028-01-10",
      laboratory: "GSK",
      cost: 21000,
      price: 29500,
      category: "Vitaminas y Multivitamínicos",
      quantityOnSkins: 25, // For liquid it's individual units
      quantityUnits: 0,
      conversionFactor: 1, // Only sold by whole bottle (1 envelope/box equals 1 bottle)
      minStockAlert: 8,
      barcode: "7702008999888",
      fotoUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300",
      isActive: true
    },
    {
      id: "prod-5",
      name: "Loratadina 10mg Tecnoquímicas",
      expirationDate: "2027-04-18",
      laboratory: "Tecnoquímicas",
      cost: 3500,
      price: 7000,
      priceUnits: 900,
      category: "Antihistamínicos",
      quantityOnSkins: 50,
      quantityUnits: 6,
      conversionFactor: 10,
      minStockAlert: 12,
      barcode: "7702008222111",
      fotoUrl: "",
      isActive: true
    }
  ],
  suppliers: [
    { id: "sup-1", companyName: "Coaspharma S.A.S", nit: "800.231.543-9", phone: "601-5432100", whatsapp: "+573155555555" },
    { id: "sup-2", companyName: "Droguerías Aliadas de Colombia", nit: "900.112.441-2", phone: "601-9876543", whatsapp: "+573212222222" },
    { id: "sup-3", companyName: "Distribuidora Nacional de Fármacos", nit: "890.301.218-0", phone: "602-3334455", whatsapp: "+573204445555" }
  ],
  laboratories: ["Genfar", "MK", "Tecnoquímicas", "GSK", "Bayer", "Abbott", "Sanofi", "Roche"],
  categories: ["Analgésicos", "Antibióticos", "Antihistamínicos", "Vitaminas y Multivitamínicos", "Inyectables", "Cuidado Bebé", "Higiene y Salud Orgánica"],
  sales: [
    {
      id: "sale-1",
      invoiceNumber: "FC-00001",
      dateTime: "2026-06-16T14:35:00-05:00",
      sellerId: "2",
      sellerName: "Laura Valentina",
      items: [
        { productId: "prod-1", productName: "Dolex Forte Tabletas 500mg", quantitySkins: 1, quantityUnits: 0, price: 24000, subtotal: 24000 },
        { productId: "prod-5", productName: "Loratadina 10mg Tecnoquímicas", quantitySkins: 0, quantityUnits: 2, price: 700, subtotal: 1400 } // Loratadina unit price is 7000 / 10 = 700
      ],
      total: 25400,
      clientNit: "123456789"
    },
    {
      id: "sale-2",
      invoiceNumber: "FC-00002",
      dateTime: "2026-06-17T09:20:00-05:00",
      sellerId: "1",
      sellerName: "Administrador Vexa POS",
      items: [
        { productId: "prod-3", productName: "Amoxicilina 500mg MK", quantitySkins: 0, quantityUnits: 10, price: 600, subtotal: 6000 } // unit price 18000 / 30 = 600
      ],
      total: 6000
    }
  ],
  closures: [
    {
      id: "close-2026-06-16",
      date: "2026-06-16",
      totalSalesCount: 1,
      totalSalesRevenue: 25400,
      totalExpenses: 5000,
      initialCash: 100000,
      finalCash: 120400,
      expenses: [
        { id: "exp-1", description: "Bolsas plásticas y empaques", amount: 5000, timestamp: "2026-06-16T16:00:00-05:00" }
      ],
      isClosed: true,
      closedAt: "2026-06-16T21:00:00-05:00"
    }
  ],
  syncStatus: "synchronized"
};

// Write store to disk
function saveDb(state: AppState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

// Read store from disk
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Initialize DB
  let db = loadDb();

  // Root health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "alive", timestamp: new Date().toISOString() });
  });

  // Authentication endpoints
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    db = loadDb();
    const user = db.users.find(u => u.email === email && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(401).json({ success: false, message: "Correo o contraseña incorrectos." });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role } = req.body;
    db = loadDb();
    const exists = db.users.some(u => u.email === email);
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
    db.users.push(newUser);
    saveDb(db);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ success: true, user: userWithoutPassword });
  });

  // Profile configuration config
  app.get("/api/profile", (req, res) => {
    db = loadDb();
    res.json({ business: db.config.business });
  });

  app.post("/api/profile/business", (req, res) => {
    db = loadDb();
    const { name, nit, foundationYear, phone, address, city, logoUrl } = req.body;
    db.config.business = { name, nit, foundationYear, phone, address, city, logoUrl };
    saveDb(db);
    res.json({ success: true, business: db.config.business });
  });

  // Inventory endpoint: List all products
  app.get("/api/inventory", (req, res) => {
    db = loadDb();
    res.json(db.products);
  });

  // Create initial product
  app.post("/api/inventory/initial", (req, res) => {
    db = loadDb();
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

    db.products.push(newProduct);
    saveDb(db);
    res.status(201).json({ success: true, product: newProduct });
  });

  // Inbound supplier invoice (load items)
  app.post("/api/inventory/invoice", (req, res) => {
    db = loadDb();
    const { supplierId, productId, quantitySkins, quantityUnits, cost, price, expirationDate } = req.body;

    const prodIdx = db.products.findIndex(p => p.id === productId);
    if (prodIdx === -1) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }

    // Add stock
    const p = db.products[prodIdx];
    p.quantityOnSkins += Number(quantitySkins) || 0;
    p.quantityUnits += Number(quantityUnits) || 0;
    if (cost) p.cost = Number(cost);
    if (price) p.price = Number(price);
    if (expirationDate) p.expirationDate = expirationDate;

    // Handle normalization of units based on conversion factor
    if (p.quantityUnits >= p.conversionFactor && p.conversionFactor > 1) {
      const additionalSkins = Math.floor(p.quantityUnits / p.conversionFactor);
      p.quantityOnSkins += additionalSkins;
      p.quantityUnits = p.quantityUnits % p.conversionFactor;
    }

    db.products[prodIdx] = p;
    saveDb(db);

    res.json({ success: true, product: p });
  });

  // Bulk inbound supplier invoice loading (multi-item)
  app.post("/api/inventory/invoice/bulk", (req, res) => {
    db = loadDb();
    const { supplierId, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No se proporcionaron productos para cargar." });
    }

    const updatedProducts = [];

    for (const item of items) {
      const { productId, quantitySkins, quantityUnits, cost, price, priceUnits, expirationDate } = item;
      const prodIdx = db.products.findIndex(p => p.id === productId);
      if (prodIdx !== -1) {
        const p = db.products[prodIdx];
        p.quantityOnSkins += Number(quantitySkins) || 0;
        p.quantityUnits += Number(quantityUnits) || 0;
        if (cost !== undefined && cost !== null && cost > 0) p.cost = Number(cost);
        if (price !== undefined && price !== null && price > 0) p.price = Number(price);
        if (priceUnits !== undefined && priceUnits !== null && priceUnits > 0) p.priceUnits = Number(priceUnits);
        if (expirationDate) p.expirationDate = expirationDate;

        // Handle normalization of units based on conversion factor
        if (p.quantityUnits >= p.conversionFactor && p.conversionFactor > 1) {
          const additionalSkins = Math.floor(p.quantityUnits / p.conversionFactor);
          p.quantityOnSkins += additionalSkins;
          p.quantityUnits = p.quantityUnits % p.conversionFactor;
        }

        db.products[prodIdx] = p;
        updatedProducts.push(p);
      }
    }

    saveDb(db);
    res.json({ success: true, count: updatedProducts.length });
  });

  // Manage suppliers, labs, categories
  app.get("/api/inventory/manage/suppliers", (req, res) => {
    db = loadDb();
    res.json(db.suppliers);
  });

  app.post("/api/inventory/manage/suppliers", (req, res) => {
    db = loadDb();
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
    db.suppliers.push(newSupplier);
    saveDb(db);
    res.status(201).json({ success: true, supplier: newSupplier });
  });

  app.get("/api/inventory/manage/laboratories", (req, res) => {
    db = loadDb();
    res.json(db.laboratories);
  });

  app.post("/api/inventory/manage/laboratories", (req, res) => {
    db = loadDb();
    const { name } = req.body;
    if (!name || db.laboratories.includes(name)) {
      return res.status(400).json({ success: false, message: "Laboratorio inválido o duplicado." });
    }
    db.laboratories.push(name);
    saveDb(db);
    res.status(201).json({ success: true, laboratories: db.laboratories });
  });

  app.get("/api/inventory/manage/categories", (req, res) => {
    db = loadDb();
    res.json(db.categories);
  });

  app.post("/api/inventory/manage/categories", (req, res) => {
    db = loadDb();
    const { name } = req.body;
    if (!name || db.categories.includes(name)) {
      return res.status(400).json({ success: false, message: "Categoría inválida o duplicada." });
    }
    db.categories.push(name);
    saveDb(db);
    res.status(201).json({ success: true, categories: db.categories });
  });

  // Register POS Sales (facturación)
  app.post("/api/sales", (req, res) => {
    db = loadDb();
    const { sellerId, sellerName, items, total, clientNit } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No hay productos en la factura." });
    }

    // Process product stock reduction
    for (const item of items) {
      const prodIdx = db.products.findIndex(p => p.id === item.productId);
      if (prodIdx !== -1) {
        const prod = db.products[prodIdx];
        
        // Deduct quantities
        let deductSkins = item.quantitySkins || 0;
        let deductUnits = item.quantityUnits || 0;

        // Convert deduct quantites to total units
        const totalUnitsInStock = (prod.quantityOnSkins * prod.conversionFactor) + prod.quantityUnits;
        const totalUnitsToDeduct = (deductSkins * prod.conversionFactor) + deductUnits;

        if (totalUnitsInStock < totalUnitsToDeduct) {
          // Allow sale but emit warning/cap stock at zero in offline sync environments
          console.warn(`Inventario negativo detectado para ${prod.name}`);
        }

        const remainingTotalUnits = Math.max(0, totalUnitsInStock - totalUnitsToDeduct);
        
        // Normalize back to skins and units
        if (prod.conversionFactor > 1) {
          prod.quantityOnSkins = Math.floor(remainingTotalUnits / prod.conversionFactor);
          prod.quantityUnits = remainingTotalUnits % prod.conversionFactor;
        } else {
          prod.quantityOnSkins = remainingTotalUnits;
          prod.quantityUnits = 0;
        }
        
        db.products[prodIdx] = prod;
      }
    }

    const nextInvoiceNo = "FC-" + String(db.sales.length + 1).padStart(5, "0");
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

    db.sales.push(newInvoice);

    // Dynamic Daily cash balance increment
    const todayStr = new Date().toISOString().split("T")[0];
    let closureIdx = db.closures.findIndex(c => c.date === todayStr && !c.isClosed);
    if (closureIdx === -1) {
      // Create new open closure
      const newClosure = {
        id: "close-" + todayStr,
        date: todayStr,
        totalSalesCount: 1,
        totalSalesRevenue: total,
        totalExpenses: 0,
        initialCash: 100000, // standard base box
        finalCash: 100000 + total,
        expenses: [],
        isClosed: false
      };
      db.closures.push(newClosure);
    } else {
      db.closures[closureIdx].totalSalesCount += 1;
      db.closures[closureIdx].totalSalesRevenue += total;
      db.closures[closureIdx].finalCash += total;
    }

    saveDb(db);
    res.status(201).json({ success: true, invoice: newInvoice });
  });

  app.get("/api/sales", (req, res) => {
    db = loadDb();
    res.json(db.sales);
  });

  // Daily cash closure management
  app.get("/api/closure", (req, res) => {
    db = loadDb();
    const todayStr = new Date().toISOString().split("T")[0];
    let active = db.closures.find(c => c.date === todayStr && !c.isClosed);
    if (!active) {
      // Find today's closed one, or default creating an empty representation
      const closedToday = db.closures.find(c => c.date === todayStr && c.isClosed);
      if (closedToday) {
        return res.json(closedToday);
      }
      // Create lazy structure
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

  app.post("/api/closure/expense", (req, res) => {
    db = loadDb();
    const todayStr = new Date().toISOString().split("T")[0];
    const { description, amount } = req.body;

    if (!description || !amount) {
      return res.status(400).json({ success: false, message: "Descripción y valor obligatorios." });
    }

    let closureIdx = db.closures.findIndex(c => c.date === todayStr && !c.isClosed);
    if (closureIdx === -1) {
      const newClosure = {
        id: "close-" + todayStr,
        date: todayStr,
        totalSalesCount: 0,
        totalSalesRevenue: 0,
        totalExpenses: Number(amount),
        initialCash: 100000,
        finalCash: 100000 - Number(amount),
        expenses: [{ id: "exp-" + Date.now(), description, amount: Number(amount), timestamp: new Date().toISOString() }],
        isClosed: false
      };
      db.closures.push(newClosure);
    } else {
      const exp = { id: "exp-" + Date.now(), description, amount: Number(amount), timestamp: new Date().toISOString() };
      db.closures[closureIdx].expenses.push(exp);
      db.closures[closureIdx].totalExpenses += Number(amount);
      db.closures[closureIdx].finalCash -= Number(amount);
    }

    saveDb(db);
    res.json({ success: true, closure: db.closures.find(c => c.date === todayStr && !c.isClosed) });
  });

  app.post("/api/closure/close", (req, res) => {
    db = loadDb();
    const todayStr = new Date().toISOString().split("T")[0];
    let closureIdx = db.closures.findIndex(c => c.date === todayStr && !c.isClosed);

    if (closureIdx === -1) {
      return res.status(404).json({ success: false, message: "No hay cierre activo para procesar." });
    }

    db.closures[closureIdx].isClosed = true;
    db.closures[closureIdx].closedAt = new Date().toISOString();
    saveDb(db);

    res.json({ success: true, closure: db.closures[closureIdx] });
  });

  app.get("/api/closure/history", (req, res) => {
    db = loadDb();
    res.json(db.closures);
  });

  // Client Offline Sychronization Simulation API
  app.post("/api/sync", (req, res) => {
    db = loadDb();
    const { clientActions } = req.body; // array of operations performed while offline
    const logs: any[] = [];
    
    if (!clientActions || clientActions.length === 0) {
      return res.json({ success: true, syncedCount: 0, logs: ["Sin cambios offline."] });
    }

    // Process each queue element. In real system, does CRDT/Watermark reconciliation
    for (const action of clientActions) {
      const { type, entity, data, timestamp } = action;
      
      if (entity === "expense") {
        const todayStr = new Date(timestamp).toISOString().split("T")[0];
        let closureIdx = db.closures.findIndex(c => c.date === todayStr && !c.isClosed);
        const expObj = { id: data.id || "exp-" + Date.now(), description: data.description, amount: Number(data.amount), timestamp };
        
        if (closureIdx === -1) {
          db.closures.push({
            id: "close-" + todayStr,
            date: todayStr,
            totalSalesCount: 0,
            totalSalesRevenue: 0,
            totalExpenses: Number(data.amount),
            initialCash: 100000,
            finalCash: 100000 - Number(data.amount),
            expenses: [expObj],
            isClosed: false
          });
        } else {
          db.closures[closureIdx].expenses.push(expObj);
          db.closures[closureIdx].totalExpenses += Number(data.amount);
          db.closures[closureIdx].finalCash -= Number(data.amount);
        }
        logs.push(`Gasto sincronizado exitosamente: "${data.description}" por $${data.amount}`);
      }
      else if (entity === "sale") {
        // Decrement product quantities
        for (const item of data.items) {
          const prodIdx = db.products.findIndex(p => p.id === item.productId);
          if (prodIdx !== -1) {
            const prod = db.products[prodIdx];
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
          }
        }

        db.sales.push({
          id: data.id || "sale-" + Date.now(),
          invoiceNumber: data.invoiceNumber || ("FC-" + String(db.sales.length + 1).padStart(5, "0")),
          dateTime: timestamp,
          sellerId: data.sellerId,
          sellerName: data.sellerName,
          items: data.items,
          total: data.total,
          clientNit: data.clientNit || ""
        });

        // Add to cash register closure
        const todayStr = new Date(timestamp).toISOString().split("T")[0];
        let closureIdx = db.closures.findIndex(c => c.date === todayStr && !c.isClosed);
        if (closureIdx === -1) {
          db.closures.push({
            id: "close-" + todayStr,
            date: todayStr,
            totalSalesCount: 1,
            totalSalesRevenue: data.total,
            totalExpenses: 0,
            initialCash: 100000,
            finalCash: 100000 + data.total,
            expenses: [],
            isClosed: false
          });
        } else {
          db.closures[closureIdx].totalSalesCount += 1;
          db.closures[closureIdx].totalSalesRevenue += data.total;
          db.closures[closureIdx].finalCash += data.total;
        }
        logs.push(`Factura ${data.invoiceNumber || "FC-Offline"} por $${data.total} sincronizada correctamente.`);
      }
      else if (entity === "product") {
        // Handle new product registered offline
        const exists = db.products.some(p => p.id === data.id || p.name.toLowerCase() === data.name.toLowerCase());
        if (!exists) {
          db.products.push({
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
          });
          logs.push(`Nuevo producto offline registrado: "${data.name}"`);
        } else {
          logs.push(`Reconciliación: Producto "${data.name}" ya existía en la nube, se consolida stock.`);
        }
      }
      else if (entity === "restock" || entity === "invoice_bulk") {
        const itemsToProcess = Array.isArray(data.items) ? data.items : [data];
        let restockedCount = 0;
        for (const item of itemsToProcess) {
          const prodIdx = db.products.findIndex(p => p.id === item.productId);
          if (prodIdx !== -1) {
            const p = db.products[prodIdx];
            p.quantityOnSkins += Number(item.quantitySkins) || 0;
            p.quantityUnits += Number(item.quantityUnits) || 0;
            if (item.cost) p.cost = Number(item.cost);
            if (item.price) p.price = Number(item.price);
            if (item.priceUnits) p.priceUnits = Number(item.priceUnits);
            if (item.expirationDate) p.expirationDate = item.expirationDate;

            // Normalize units
            if (p.quantityUnits >= p.conversionFactor && p.conversionFactor > 1) {
              const additionalSkins = Math.floor(p.quantityUnits / p.conversionFactor);
              p.quantityOnSkins += additionalSkins;
              p.quantityUnits = p.quantityUnits % p.conversionFactor;
            }
            db.products[prodIdx] = p;
            restockedCount++;
          }
        }
        logs.push(`Servidor: Se sincronizó cargue de inventario offline (${restockedCount} productos procesados).`);
      }
    }

    saveDb(db);
    res.json({ success: true, syncedCount: clientActions.length, logs });
  });

  // Setup Vite Dev Server / Static Hosting Config
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Droguería Backend] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
