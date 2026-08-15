import React, { useState, useEffect, useRef } from "react";
import {
  Package,
  FileText,
  TrendingDown,
  LineChart,
  User,
  Settings,
  Plus,
  Search,
  AlertCircle,
  FileSpreadsheet,
  Building,
  CheckCircle,
  Trash2,
  Barcode,
  Printer,
  X,
  CreditCard,
  UserCheck,
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  PlusCircle,
  Info
} from "lucide-react";
import { Product, Supplier, SaleInvoice, RealExpense, DailyClosure, BusinessConfig } from "./types";
import TechAdvisory from "./components/TechAdvisory";
import faviconUrl from "./img/favicon.png";

import { AppContext } from './context/AppContext';
import Header from './components/Header';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import InventarioTab from './components/InventarioTab';
import FacturacionTab from './components/FacturacionTab';
import CierreTab from './components/CierreTab';
import ReportesTab from './components/ReportesTab';
import PerfilTab from './components/PerfilTab';
export function getBogotaDateStr(dateInput: Date = new Date()): string {
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
      return new Date().toISOString().split("T")[0];
    } catch (err) {
      return "2026-07-13";
    }
  }
}

export default function App() {
// Offline state simulator representation
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<string[]>(["Sistema en línea. Listo para procesar."]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    try {
      const savedUser = localStorage.getItem("vexapos_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<"admin" | "worker">("worker");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Business Profile Info
  const [business, setBusiness] = useState<BusinessConfig>({
    name: "Vexa POS",
    nit: "",
    foundationYear: "",
    phone: "",
    address: "",
    city: ""
  });

  // Master lists
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [laboratories, setLaboratories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sales, setSales] = useState<SaleInvoice[]>([]);
  const [closures, setClosures] = useState<DailyClosure[]>([]);
  const [activeClosure, setActiveClosure] = useState<DailyClosure>({
    id: "close-today",
    date: getBogotaDateStr(),
    totalSalesCount: 0,
    totalSalesRevenue: 0,
    totalExpenses: 0,
    initialCash: 100000,
    finalCash: 100000,
    expenses: [],
    isClosed: false
  });

  // UI Navigation
  const [activeTab, setActiveTab] = useState<"inventario" | "facturacion" | "cierre" | "reportes" | "perfil">("facturacion");
  
  // Modal controllers
  const [showTechAdvisory, setShowTechAdvisory] = useState(false);
  const [inventoryFormMode, setInventoryFormMode] = useState<"none" | "initial" | "manage" | "invoice">("none");
  const [manageSubTab, setManageSubTab] = useState<"suppliers" | "laboratories" | "categories">("suppliers");

  // Filter and Search conditions
  const [prodSearchQuery, setProdSearchQuery] = useState("");
  const [prodCategoryFilter, setProdCategoryFilter] = useState("");

  // Form states: Initial Product Form
  const [newProdName, setNewProdName] = useState("");
  const [newProdExp, setNewProdExp] = useState("");
  const [newProdLab, setNewProdLab] = useState("");
  const [newProdCost, setNewProdCost] = useState<number>(0);
  const [newProdPrice, setNewProdPrice] = useState<number>(0);
  const [newProdCategory, setNewProdCategory] = useState("");
  const [newProdSkins, setNewProdSkins] = useState<number>(0); 
  const [newProdUnits, setNewProdUnits] = useState<number>(0); 
  const [newProdFactor, setNewProdFactor] = useState<number>(10); // columns or pills in custom layout
  const [newProdMinAlert, setNewProdMinAlert] = useState<number>(0);
  const [newProdBarcode, setNewProdBarcode] = useState<string>('');
  const [newProdBarcode2, setNewProdBarcode2] = useState("");
  const [newProdBarcode3, setNewProdBarcode3] = useState("");
  const [newProdFoto, setNewProdFoto] = useState("");
  const [newProdSellMode, setNewProdSellMode] = useState<"unidad" | "sobres" | "ambas">("ambas");
  const [newProdPriceUnits, setNewProdPriceUnits] = useState<number>(0);

  // Printing state
  const [activePrintInvoice, setActivePrintInvoice] = useState<any>(null);

  // Form states: Supplier Form
  const [newSupName, setNewSupName] = useState("");
  const [newSupNit, setNewSupNit] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupWsp, setNewSupWsp] = useState("");

  // Form states: Manage lists
  const [newLabName, setNewLabName] = useState("");
  const [newCatName, setNewCatName] = useState("");

  // Form states: Restock Invoice Product Form
  const [restockSupplierId, setRestockSupplierId] = useState("");
  const [restockProductId, setRestockProductId] = useState("");
  const [restockSkins, setRestockSkins] = useState(0);
  const [restockUnits, setRestockUnits] = useState(0);
  const [restockTotalUnits, setRestockTotalUnits] = useState(0);
  const [restockCost, setRestockCost] = useState(0);
  const [restockPrice, setRestockPrice] = useState(0);
  const [restockPriceUnits, setRestockPriceUnits] = useState(0);
  const [restockExp, setRestockExp] = useState("");
  
  // Complete Invoice restock list
  const [invoiceItems, setInvoiceItems] = useState<{
    id: string;
    productId: string;
    productName: string;
    laboratory: string;
    category?: string;
    conversionFactor: number;
    quantitySkins: number;
    quantityUnits: number;
    quantityTotalUnits?: number;
    cost: number;
    price: number;
    priceUnits?: number;
    expirationDate: string;
    minStockAlert?: number;
    barcode?: string;
    barcodes?: string[];
    fotoUrl?: string;
    isNewProduct?: boolean;
  }[]>([]);

  // POS (Facturación) cart state
  const [posSearchQuery, setPosSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [posCart, setPosCart] = useState<{
    product: Product;
    qtySkins: number;
    qtyUnits: number;
    customPrice: number;
  }[]>([]);
  const [invoiceClientNit, setInvoiceClientNit] = useState("");
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [posAlertMessage, setPosAlertMessage] = useState("");

  // Cierre states
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Profile configuration states
  const [profileName, setProfileName] = useState(() => {
    try {
      const savedUser = localStorage.getItem("vexapos_user");
      if (savedUser) {
        return JSON.parse(savedUser).name || "";
      }
    } catch {}
    return "";
  });
  const [profileImage, setProfileImage] = useState(() => {
    try {
      const savedUser = localStorage.getItem("vexapos_user");
      if (savedUser) {
        return JSON.parse(savedUser).profileImage || "";
      }
    } catch {}
    return "";
  });

  // Sync user session to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("vexapos_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("vexapos_user");
    }
  }, [currentUser]);

  // Trigger print dialog when activePrintInvoice changes
  useEffect(() => {
    if (activePrintInvoice) {
      const timer = setTimeout(() => {
        window.print();
        setActivePrintInvoice(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activePrintInvoice]);

  // Simulate local database preseed on load and poll every 30 seconds
  useEffect(() => {
    fetchInitialData();

    const interval = setInterval(() => {
      if (!isOffline && document.visibilityState === "visible") {
        fetchInitialData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isOffline]);

  // Synchronize browser tab title and favicon with the business name & brand favicon
  useEffect(() => {
    if (business && business.name) {
      document.title = `${business.name} - VexaPOS`;
    } else {
      document.title = "VexaPOS - Control de Droguería";
    }

    // Dynamic favicon updates
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  }, [business]);

  const fetchInitialData = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (response.ok) {
        const prodData = await response.json();
        const sorted = (Array.isArray(prodData) ? prodData : []).sort((a: any, b: any) =>
          (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
        );
        setProducts(sorted);
      }
      
      const supResp = await fetch("/api/inventory/manage/suppliers");
      if (supResp.ok) {
        const supData = await supResp.json();
        const sortedSup = (Array.isArray(supData) ? supData : []).sort((a: any, b: any) =>
          (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
        );
        setSuppliers(sortedSup);
      }

      const labsResp = await fetch("/api/inventory/manage/laboratories");
      if (labsResp.ok) {
        const labsData = await labsResp.json();
        const sortedLabs = (Array.isArray(labsData) ? labsData : []).sort((a: string, b: string) =>
          (a || "").localeCompare(b || "", "es", { sensitivity: "base" })
        );
        setLaboratories(sortedLabs);
      }

      const catsResp = await fetch("/api/inventory/manage/categories");
      if (catsResp.ok) {
        const catsData = await catsResp.json();
        const sortedCats = (Array.isArray(catsData) ? catsData : []).sort((a: string, b: string) =>
          (a || "").localeCompare(b || "", "es", { sensitivity: "base" })
        );
        setCategories(sortedCats);
      }

      const salesResp = await fetch("/api/sales");
      if (salesResp.ok) {
        setSales(await salesResp.json());
      }

      const closuresResp = await fetch("/api/closure/history");
      if (closuresResp.ok) {
        setClosures(await closuresResp.json());
      }

      const closureActiveResp = await fetch("/api/closure");
      if (closureActiveResp.ok) {
        const activeC = await closureActiveResp.json();
        setActiveClosure(activeC);
      }

      const profileResp = await fetch("/api/profile");
      if (profileResp.ok) {
        const profileData = await profileResp.json();
        if (profileData.business) {
          setBusiness(profileData.business);
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote initial data, using local fallback seed mode.");
    }
  };

  const syncOfflineQueue = async (queueToSync = offlineQueue) => {
    if (queueToSync.length === 0) return;
    setIsSyncing(true);
    setSyncLogs(prev => [`Iniciando Sincronización de ${queueToSync.length} cambios pendientes...`, ...prev]);
    
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientActions: queueToSync })
      });

      if (response.ok) {
        const result = await response.json();
        setSyncLogs(prev => [
          `✔ Exitoso: Se sincronizaron $${queueToSync.length} logs en la nube.`,
          ...(result.logs || []),
          ...prev
        ]);
        setOfflineQueue([]);
        fetchInitialData(); // reload
      } else {
        setSyncLogs(prev => ["❌ Fallo en sincronización con servidor backend.", ...prev]);
      }
    } catch (err) {
      setSyncLogs(prev => ["❌ No se pudo establecer conexión con el backend.", ...prev]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleOffline = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    if (!nextState) {
      syncOfflineQueue();
    } else {
      setSyncLogs(prev => ["Modo Offline Activado. Las operaciones se guardarán localmente.", ...prev]);
    }
  };

  // Auth operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();
      if (data.success) {
        const userObj = { ...data.user, role: data.user.role || "admin" };
        setCurrentUser(userObj);
        setProfileName(userObj.name);
        setProfileImage(userObj.profileImage || "");
        setAuthSuccess("¡Ingreso exitoso!");
        setSyncLogs(prev => [`Usuario ${userObj.name} inició sesión.`, ...prev]);
      } else {
        setAuthError(data.message || "Credenciales incorrectas.");
      }
    } catch (err) {
      // Offline fallback
      if (loginEmail === "drogueriagratamira@gmail.com" && loginPassword === "43518612") {
        const fallbackAdmin = { id: "1", name: "Admin (Offline Fallback)", email: "drogueriagratamira@gmail.com", role: "admin" as const };
        setCurrentUser(fallbackAdmin);
        setProfileName(fallbackAdmin.name);
        setAuthSuccess("Ingreso offline exitoso.");
      } else {
        setAuthError("No se pudo conectar al servidor y las credenciales no coinciden.");
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("El registro público está deshabilitado. Ingrese con una cuenta existente.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthSuccess("");
    setAuthError("");
  };

  // Add product form
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdLab || !newProdCategory) {
      alert("Por favor rellene los campos obligatorios");
      return;
    }

    let savedSkins = 0;
    let savedUnits = 0;
    let savedFactor = 1;

    if (newProdSellMode === "unidad") {
      savedSkins = Number(newProdSkins) || 0;
      savedUnits = 0;
      savedFactor = 1;
    } else if (newProdSellMode === "sobres") {
      savedSkins = Number(newProdSkins) || 0;
      savedUnits = 0;
      savedFactor = 1;
    } else { // "ambas"
      savedSkins = Number(newProdSkins) || 0;
      savedFactor = Number(newProdFactor) || 1;
      savedUnits = (Number(newProdUnits) || 0) % savedFactor;
    }

    const barcodesList = [newProdBarcode, newProdBarcode2, newProdBarcode3]
      .map(b => (b || "").trim())
      .filter(Boolean)
      .slice(0, 3);

    const payload = {
      id: "prod-local-" + Date.now(),
      name: newProdName,
      expirationDate: newProdExp || "2027-12-31",
      laboratory: newProdLab,
      cost: Number(newProdCost) || 0,
      price: Number(newProdPrice) || 0,
      priceUnits: newProdSellMode === "ambas" ? (Number(newProdPriceUnits) || 0) : undefined,
      category: newProdCategory,
      quantityOnSkins: savedSkins,
      quantityUnits: savedUnits,
      conversionFactor: savedFactor,
      minStockAlert: (newProdMinAlert !== undefined && newProdMinAlert !== null && newProdMinAlert !== "" && !isNaN(Number(newProdMinAlert))) ? Math.max(0, Number(newProdMinAlert)) : 0,
      barcode: barcodesList[0] || "",
      barcodes: barcodesList,
      fotoUrl: newProdFoto || "",
      isActive: true
    };

    if (isOffline) {
      // Add to local state & offline dispatch queue
      setProducts(prev => [...prev, payload]);
      setOfflineQueue(prev => [...prev, {
        id: "action-" + Date.now(),
        type: "CREATE",
        entity: "product",
        data: payload,
        timestamp: new Date().toISOString()
      }]);
      setSyncLogs(prev => [`[Offline] Producto creado localmente: "${payload.name}"`, ...prev]);
    } else {
      try {
        const response = await fetch("/api/inventory/initial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
         });
        if (response.ok) {
          setSyncLogs(prev => [`[Servidor] Producto creado en la nube: "${payload.name}"`, ...prev]);
          fetchInitialData();
        }
      } catch (err) {
        alert("Error de conexión. Se guardó localmente en cola offline automáticamente.");
        setProducts(prev => [...prev, payload]);
        setOfflineQueue(prev => [...prev, {
          id: "action-" + Date.now(),
          type: "CREATE",
          entity: "product",
          data: payload,
          timestamp: new Date().toISOString()
        }]);
      }
    }

    // Reset fields
    setNewProdName("");
    setNewProdExp("");
    setNewProdLab("");
    setNewProdCost(0);
    setNewProdPrice(0);
    setNewProdPriceUnits(0);
    setNewProdCategory("");
    setNewProdSkins(0);
    setNewProdUnits(0);
    setNewProdFactor(10);
    setNewProdMinAlert(0);
    setNewProdBarcode("");
    setNewProdBarcode2("");
    setNewProdBarcode3("");
    setNewProdFoto("");
    setNewProdSellMode("ambas");
    // Scroll smoothly to top of the page to register another product immediately
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Add Supplier Form
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName) {
      alert("Nombre de empresa es obligatorio");
      return;
    }
    const payload = {
      companyName: newSupName,
      nit: newSupNit,
      phone: newSupPhone,
      whatsapp: newSupWsp
    };

    try {
      const response = await fetch("/api/inventory/manage/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        fetchInitialData();
        setNewSupName("");
        setNewSupNit("");
        setNewSupPhone("");
        setNewSupWsp("");
        setSyncLogs(prev => [`Proveedor registrado correctamente: ${payload.companyName}`, ...prev]);
      }
    } catch (e) {
      alert("Esta operación requiere conexión activa.");
    }
  };

  // Restock Inbound Invoice Form - Add product line to drafting table
  const handleAddInvoiceItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!restockProductId) {
      alert("Seleccione un producto para agregar a la factura.");
      return;
    }

    const selectedProduct = products.find(p => p.id === restockProductId);
    if (!selectedProduct) return;

    const factor = selectedProduct.conversionFactor || 1;
    let savedSkins = 0;
    let savedUnits = 0;

    if (factor > 1) {
      // In Ambas mode, the user enters Total Units sueltas.
      const totalUnitsInput = Number(restockTotalUnits) || 0;
      if (totalUnitsInput <= 0) {
        alert("La cantidad de unidades totales debe ser mayor a 0.");
        return;
      }
      savedSkins = Math.floor(totalUnitsInput / factor);
      savedUnits = totalUnitsInput % factor;
    } else {
      const qtyInput = Number(restockSkins) || 0;
      if (qtyInput <= 0) {
        alert("La cantidad debe ser mayor a 0.");
        return;
      }
      savedSkins = qtyInput;
      savedUnits = 0;
    }

    // Check if food / drug already exists in the list
    const existingIndex = invoiceItems.findIndex(item => item.productId === restockProductId);
    if (existingIndex > -1) {
      if (confirm(`El producto "${selectedProduct.name}" ya está en la factura. ¿Deseas reemplazar su cantidad, costo y precio por los nuevos valores?`)) {
        const updated = [...invoiceItems];
        updated[existingIndex] = {
          id: invoiceItems[existingIndex].id,
          productId: restockProductId,
          productName: selectedProduct.name,
          laboratory: selectedProduct.laboratory,
          conversionFactor: factor,
          quantitySkins: savedSkins,
          quantityUnits: savedUnits,
          quantityTotalUnits: factor > 1 ? Number(restockTotalUnits) : undefined,
          cost: Number(restockCost) || 0,
          price: Number(restockPrice) || 0,
          priceUnits: factor > 1 ? (Number(restockPriceUnits) || 0) : undefined,
          expirationDate: restockExp || selectedProduct.expirationDate || ""
        };
        setInvoiceItems(updated);
        setSyncLogs(prev => [`Actualizado en factura: ${selectedProduct.name}`, ...prev]);
      } else {
        return;
      }
    } else {
      const newItem = {
        id: "invoice-item-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        productId: restockProductId,
        productName: selectedProduct.name,
        laboratory: selectedProduct.laboratory,
        conversionFactor: factor,
        quantitySkins: savedSkins,
        quantityUnits: savedUnits,
        quantityTotalUnits: factor > 1 ? Number(restockTotalUnits) : undefined,
        cost: Number(restockCost) || 0,
        price: Number(restockPrice) || 0,
        priceUnits: factor > 1 ? (Number(restockPriceUnits) || 0) : undefined,
        expirationDate: restockExp || selectedProduct.expirationDate || ""
      };
      setInvoiceItems(prev => [...prev, newItem]);
      setSyncLogs(prev => [`Agregado a factura: ${selectedProduct.name}`, ...prev]);
    }

    // Clean single product entry state (keep supplier selected)
    setRestockProductId("");
    setRestockSkins(0);
    setRestockUnits(0);
    setRestockTotalUnits(0);
    setRestockCost(0);
    setRestockPrice(0);
    setRestockPriceUnits(0);
    setRestockExp("");
  };

  const handleDeleteInvoiceItem = (id: string) => {
    const itemToDelete = invoiceItems.find(it => it.id === id);
    setInvoiceItems(prev => prev.filter(it => it.id !== id));
    if (itemToDelete) {
      setSyncLogs(prev => [`Removido de la factura: ${itemToDelete.productName}`, ...prev]);
    }
  };

  const handleSaveFullInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceItems.length === 0) {
      alert("Por favor agregue al menos un producto con sus datos antes de procesar la factura completa.");
      return;
    }

    if (!restockSupplierId) {
      alert("Por favor seleccione el Proveedor de origen.");
      return;
    }

    const payload = {
      supplierId: restockSupplierId,
      items: invoiceItems.map(item => ({
        productId: item.productId,
        isNewProduct: !!item.isNewProduct,
        name: item.productName,
        laboratory: item.laboratory,
        category: item.category || "General",
        conversionFactor: item.conversionFactor || 1,
        quantitySkins: item.quantitySkins,
        quantityUnits: item.quantityUnits,
        cost: item.cost,
        price: item.price,
        priceUnits: item.priceUnits,
        expirationDate: item.expirationDate,
        minStockAlert: (item.minStockAlert !== undefined && item.minStockAlert !== null && item.minStockAlert !== "" && !isNaN(Number(item.minStockAlert))) ? Math.max(0, Number(item.minStockAlert)) : 0,
        barcode: item.barcode || (item.barcodes && item.barcodes[0]) || "",
        barcodes: item.barcodes || (item.barcode ? [item.barcode] : []),
        fotoUrl: item.fotoUrl || ""
      }))
    };

    if (isOffline) {
      // Local addition
      setProducts(prev => {
        const nextList = [...prev];
        for (const item of invoiceItems) {
          if (item.isNewProduct) {
            nextList.push({
              id: item.productId,
              name: item.productName,
              laboratory: item.laboratory,
              category: item.category || "General",
              conversionFactor: item.conversionFactor || 1,
              quantityOnSkins: item.quantitySkins,
              quantityUnits: item.quantityUnits,
              cost: item.cost,
              price: item.price,
              priceUnits: item.priceUnits,
              expirationDate: item.expirationDate,
              minStockAlert: (item.minStockAlert !== undefined && item.minStockAlert !== null && item.minStockAlert !== "" && !isNaN(Number(item.minStockAlert))) ? Math.max(0, Number(item.minStockAlert)) : 0,
              barcode: item.barcode || (item.barcodes && item.barcodes[0]) || "",
              barcodes: item.barcodes || (item.barcode ? [item.barcode] : []),
              fotoUrl: item.fotoUrl || "",
              isActive: true
            });
          } else {
            const idx = nextList.findIndex(p => p.id === item.productId);
            if (idx !== -1) {
              const p = nextList[idx];
              let newS = p.quantityOnSkins + item.quantitySkins;
              let newU = p.quantityUnits + item.quantityUnits;
              if (newU >= p.conversionFactor && p.conversionFactor > 1) {
                newS += Math.floor(newU / p.conversionFactor);
                newU = newU % p.conversionFactor;
              }
              nextList[idx] = {
                ...p,
                quantityOnSkins: newS,
                quantityUnits: newU,
                cost: item.cost > 0 ? item.cost : p.cost,
                price: item.price > 0 ? item.price : p.price,
                priceUnits: item.priceUnits !== undefined && item.priceUnits > 0 ? item.priceUnits : p.priceUnits,
                expirationDate: item.expirationDate ? item.expirationDate : p.expirationDate
              };
            }
          }
        }
        return nextList;
      });

      // Add bulk restock log to offline queue
      setOfflineQueue(prev => [...prev, {
        id: "action-bulk-" + Date.now(),
        type: "UPDATE",
        entity: "invoice_bulk",
        data: payload,
        timestamp: new Date().toISOString()
      }]);
      setSyncLogs(prev => [`Factura de proveedor (${invoiceItems.length} referencias) acumulada fuera de línea.`, ...prev]);
    } else {
      try {
        const response = await fetch("/api/inventory/invoice/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          setSyncLogs(prev => [`Factura procesada y cargada en nube (${invoiceItems.length} refs).`, ...prev]);
          fetchInitialData();
        } else {
          const errData = await response.json().catch(() => ({}));
          alert("Fallo procesando factura: " + (errData.message || "Error desconocido"));
          return;
        }
      } catch (err) {
        alert("Fallo de red. Cargue de factura en cola local offline.");
        return;
      }
    }

    // Reset list and state
    setInvoiceItems([]);
    setRestockSupplierId("");
    setRestockProductId("");
    setRestockSkins(0);
    setRestockUnits(0);
    setRestockTotalUnits(0);
    setRestockCost(0);
    setRestockPrice(0);
    setRestockPriceUnits(0);
    setRestockExp("");
    setInventoryFormMode("none");
  };

  // Add Lab & Category
  const handleAddLab = async () => {
    if (!newLabName) return;
    try {
      const resp = await fetch("/api/inventory/manage/laboratories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLabName })
      });
      if (resp.ok) {
        fetchInitialData();
        setNewLabName("");
      }
    } catch (e) {
      alert("Requiere conexión activa");
    }
  };

  const handleAddCat = async () => {
    if (!newCatName) return;
    try {
      const resp = await fetch("/api/inventory/manage/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName })
      });
      if (resp.ok) {
        fetchInitialData();
        setNewCatName("");
      }
    } catch (e) {
      alert("Requiere conexión activa");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este proveedor?")) return;
    try {
      const resp = await fetch(`/api/inventory/manage/suppliers/${id}`, {
        method: "DELETE"
      });
      if (resp.ok) {
        fetchInitialData();
      }
    } catch (e) {
      alert("Requiere conexión activa");
    }
  };

  const handleDeleteLab = async (name: string) => {
    if (!confirm(`¿Está seguro de eliminar el laboratorio ${name}?`)) return;
    try {
      const resp = await fetch("/api/inventory/manage/laboratories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (resp.ok) {
        fetchInitialData();
      }
    } catch (e) {
      alert("Requiere conexión activa");
    }
  };

  const handleDeleteCat = async (name: string) => {
    if (!confirm(`¿Está seguro de eliminar la categoría ${name}?`)) return;
    try {
      const resp = await fetch("/api/inventory/manage/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (resp.ok) {
        fetchInitialData();
      }
    } catch (e) {
      alert("Requiere conexión activa");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const p = products.find(prod => prod.id === id);
    const prodName = p ? p.name : "Producto";

    if (isOffline) {
      setProducts(prev => prev.filter(prod => prod.id !== id));
      setOfflineQueue(prev => [...prev, {
        id: "action-delete-" + Date.now(),
        type: "DELETE",
        entity: "product_delete",
        data: { id },
        timestamp: new Date().toISOString()
      }]);
      setSyncLogs(prev => [`[Offline] Producto eliminado localmente: "${prodName}"`, ...prev]);
    } else {
      try {
        const response = await fetch("/api/inventory/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        if (response.ok) {
          setSyncLogs(prev => [`[Servidor] Producto eliminado en la nube: "${prodName}"`, ...prev]);
          setProducts(prev => prev.filter(prod => prod.id !== id));
          fetchInitialData();
        } else {
          const errData = await response.json();
          alert(errData.message || "Error al eliminar producto.");
        }
      } catch (err) {
        alert("Error de conexión al eliminar. Se aplicó en cola local.");
        setProducts(prev => prev.filter(prod => prod.id !== id));
        setOfflineQueue(prev => [...prev, {
          id: "action-delete-" + Date.now(),
          type: "DELETE",
          entity: "product_delete",
          data: { id },
          timestamp: new Date().toISOString()
        }]);
      }
    }
  };

  // POS / Facturación Helpers
  const handleAddProductToCart = (p: Product) => {
    const existing = posCart.find(item => item.product.id === p.id);
    if (existing) {
      // check if exceeds conversion factor to normalize, else increment skins by default
      setPosCart(prev => prev.map(item => {
        if (item.product.id === p.id) {
          return { ...item, qtySkins: item.qtySkins + 1 };
        }
        return item;
      }));
    } else {
      setPosCart([...posCart, {
        product: p,
        qtySkins: 1,
        qtyUnits: 0,
        customPrice: p.price
      }]);
    }
    setPosSearchQuery("");
  };

  // Barcode simulation trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const clean = barcodeInput.trim().toLowerCase();
    const match = products.find(p =>
      p.id.toLowerCase() === clean ||
      (p.barcode && p.barcode.toLowerCase() === clean) ||
      (p.barcodes && Array.isArray(p.barcodes) && p.barcodes.some(b => b && b.toLowerCase() === clean))
    );
    if (match) {
      handleAddProductToCart(match);
      setBarcodeInput("");
      setPosAlertMessage(`Lector: "${match.name}" agregado.`);
      setTimeout(() => setPosAlertMessage(""), 3000);
    } else {
      setPosAlertMessage(`⚠ Código "${barcodeInput}" no encontrado.`);
      setTimeout(() => setPosAlertMessage(""), 4000);
    }
  };

  const handleUpdateCartQty = (prodId: string, skins: number, units: number) => {
    setPosCart(prev => prev.map(c => {
      if (c.product.id === prodId) {
        return {
          ...c,
          qtySkins: Math.max(0, skins),
          qtyUnits: Math.max(0, units)
        };
      }
      return c;
    }));
  };

  const handleRemoveFromCart = (prodId: string) => {
    setPosCart(prev => prev.filter(c => c.product.id !== prodId));
  };

  // Pricing calculations
  const calculateCartTotals = () => {
    let subtotal = 0;
    posCart.forEach(item => {
      const skins = item.qtySkins || 0;
      const units = item.qtyUnits || 0;
      const pricePerSkin = item.customPrice !== undefined ? item.customPrice : item.product.price;
      const factor = item.product.conversionFactor || 1;
      
      const pricePerUnit = item.product.priceUnits && item.product.priceUnits > 0 
        ? item.product.priceUnits 
        : (factor > 1 ? (pricePerSkin / factor) : pricePerSkin);

      subtotal += (skins * pricePerSkin) + (units * pricePerUnit);
    });
    return {
      subtotal: Math.round(subtotal),
      tax: 0,
      total: Math.round(subtotal)
    };
  };

  // POS Checkout (Create Sale)
  const handleCheckoutSale = async (paymentMethod: "Efectivo" | "Tarjeta" | "Transferencia", clientNit?: string) => {
    if (posCart.length === 0) {
      alert("El carrito de compras está vacío.");
      return;
    }

    const { total } = calculateCartTotals();
    const invoiceNum = "FAC-" + Date.now().toString().slice(-6);

    const salePayload = {
      id: "sale-" + Date.now(),
      invoiceNumber: invoiceNum,
      timestamp: new Date().toISOString(),
      items: posCart.map(c => {
        const factor = c.product.conversionFactor || 1;
        const pricePerSkin = c.customPrice !== undefined ? c.customPrice : c.product.price;
        const pricePerUnit = c.product.priceUnits && c.product.priceUnits > 0 
          ? c.product.priceUnits 
          : (factor > 1 ? (pricePerSkin / factor) : pricePerSkin);
        const itemSubtotal = (c.qtySkins * pricePerSkin) + (c.qtyUnits * pricePerUnit);

        return {
          productId: c.product.id,
          productName: c.product.name,
          qtySkins: c.qtySkins,
          qtyUnits: c.qtyUnits,
          priceSkins: pricePerSkin,
          priceUnits: pricePerUnit,
          subtotal: Math.round(itemSubtotal)
        };
      }),
      totalAmount: total,
      paymentMethod,
      clientNit: clientNit || undefined,
      sellerName: currentUser?.name || "Vendedor Gratamira"
    };

    if (isOffline) {
      // Local stock deduction
      setProducts(prev => prev.map(p => {
        const inCart = posCart.find(c => c.product.id === p.id);
        if (inCart) {
          const factor = p.conversionFactor || 1;
          const currentTotalUnits = (p.quantityOnSkins * factor) + p.quantityUnits;
          const soldUnits = (inCart.qtySkins * factor) + inCart.qtyUnits;
          const remainingUnits = Math.max(0, currentTotalUnits - soldUnits);
          
          return {
            ...p,
            quantityOnSkins: Math.floor(remainingUnits / factor),
            quantityUnits: remainingUnits % factor
          };
        }
        return p;
      }));

      setSales(prev => [salePayload, ...prev]);
      setOfflineQueue(prev => [...prev, {
        id: "action-sale-" + Date.now(),
        type: "CREATE",
        entity: "sale",
        data: salePayload,
        timestamp: new Date().toISOString()
      }]);
      setSyncLogs(prev => [`[Offline] Venta registrada ${invoiceNum} por $${total.toLocaleString("es-CO")}`, ...prev]);
    } else {
      try {
        const response = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(salePayload)
        });
        if (response.ok) {
          setSyncLogs(prev => [`[Servidor] Venta sincronizada exitosa ${invoiceNum}`, ...prev]);
          fetchInitialData();
        }
      } catch (err) {
        alert("Fallo de conexión. La venta se registrará de forma local.");
        setSales(prev => [salePayload, ...prev]);
        setOfflineQueue(prev => [...prev, {
          id: "action-sale-" + Date.now(),
          type: "CREATE",
          entity: "sale",
          data: salePayload,
          timestamp: new Date().toISOString()
        }]);
      }
    }

    setActivePrintInvoice(salePayload);
    setPosCart([]);
    setInvoiceClientNit("");
    setShowInvoicePreview(false);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || expenseAmount <= 0) {
      alert("Ingrese una descripción y un valor válido.");
      return;
    }

    const payload = {
      id: "exp-" + Date.now(),
      description: expenseDesc,
      amount: Number(expenseAmount),
      date: new Date().toISOString(),
      category: "Caja Menor"
    };

    if (isOffline) {
      if (activeClosure) {
        setActiveClosure({
          ...activeClosure,
          expenses: [...activeClosure.expenses, payload]
        });
      }
      setOfflineQueue(prev => [...prev, {
        id: "action-exp-" + Date.now(),
        type: "CREATE",
        entity: "expense",
        data: payload,
        timestamp: new Date().toISOString()
      }]);
      setSyncLogs(prev => [`[Offline] Gasto registrado: ${payload.description}`, ...prev]);
    } else {
      try {
        const response = await fetch("/api/closures/expense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          fetchInitialData();
          setSyncLogs(prev => [`[Servidor] Gasto registrado: ${payload.description}`, ...prev]);
        }
      } catch (err) {
        alert("Error de conexión al registrar gasto.");
      }
    }

    setExpenseDesc("");
    setExpenseAmount(0);
  };

  // Finalize Daily Closure
  const handleFinalizeClosure = async () => {
    if (!activeClosure) return;
    if (!confirm("¿Está seguro de realizar el cierre definitivo de caja del día?")) return;

    if (isOffline) {
      alert("El cierre formal requiere conexión al servidor principal.");
      return;
    }

    try {
      const response = await fetch("/api/closures/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closureId: activeClosure.id })
      });
      if (response.ok) {
        alert("Cierre de caja completado exitosamente.");
        fetchInitialData();
      }
    } catch (err) {
      alert("Error al finalizar el cierre.");
    }
  };

  // Profile updates
  const handleUpdateBusinessProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/profile/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(business)
      });
      if (response.ok) {
        alert("Datos del negocio actualizados correctamente.");
      }
    } catch (err) {
      alert("Error actualizando perfil del negocio.");
    }
  };

  const handleUpdatePersonalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const response = await fetch("/api/profile/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name: profileName,
          image: profileImage
        })
      });
      if (response.ok) {
        setCurrentUser({ ...currentUser, name: profileName, image: profileImage });
        alert("Perfil de usuario actualizado.");
      }
    } catch (err) {
      alert("Error actualizando perfil personal.");
    }
  };

  // Excel / CSV Export
  const handleDownloadXLS = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Nombre,Categoria,Laboratorio,Sobres/Cajas,Unidades Sueltas,Costo,Precio,Vencimiento,Codigo de Barras\n";
    products.forEach(p => {
      const bCodes = (p.barcodes && p.barcodes.length > 0) ? p.barcodes.join(" / ") : (p.barcode || "");
      csvContent += `"${p.id}","${p.name}","${p.category}","${p.laboratory}",${p.quantityOnSkins},${p.quantityUnits},${p.cost},${p.price},"${p.expirationDate}","${bCodes}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_vexapos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  // Computes stock warnings and statistics
  const filteredProducts = products
    .filter(p => {
      const q = prodSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.laboratory && p.laboratory.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.barcodes && Array.isArray(p.barcodes) && p.barcodes.some(b => b && b.toLowerCase().includes(q)));
      const matchesCategory = prodCategoryFilter ? p.category === prodCategoryFilter : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" }));

  const totalInventoryCost = products.reduce((acc, p) => {
    // cost is per envelope / box. We estimate loose unit cost relative to conversion factor
    const skinValue = p.quantityOnSkins * p.cost;
    const unitValue = p.conversionFactor > 1 ? p.quantityUnits * (p.cost / p.conversionFactor) : 0;
    return acc + skinValue + unitValue;
  }, 0);

  const totalInventoryPriceValue = products.reduce((acc, p) => {
    const skinValue = p.quantityOnSkins * p.price;
    const unitValue = p.conversionFactor > 1 
      ? p.quantityUnits * (p.priceUnits && p.priceUnits > 0 ? p.priceUnits : (p.price / p.conversionFactor)) 
      : 0;
    return acc + skinValue + unitValue;
  }, 0);

  // Auto add preseeded code trigger list
  const preseededBarcodes: any[] = [];

  const restockSelectedProduct = products.find(p => p.id === restockProductId);
  const isRestockProductAmbasMode = restockSelectedProduct && restockSelectedProduct.conversionFactor > 1;
  const restockProductFactor = restockSelectedProduct?.conversionFactor || 1;

  const appState = {
    isOffline, setIsOffline, offlineQueue, setOfflineQueue, syncLogs, setSyncLogs, isSyncing, setIsSyncing, currentUser, setCurrentUser, authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, registerName, setRegisterName, registerEmail, setRegisterEmail, registerPassword, setRegisterPassword, registerRole, setRegisterRole, authError, setAuthError, authSuccess, setAuthSuccess, business, setBusiness, products, setProducts, suppliers, setSuppliers, laboratories, setLaboratories, categories, setCategories, sales, setSales, closures, setClosures, activeClosure, setActiveClosure, activeTab, setActiveTab, showTechAdvisory, setShowTechAdvisory, inventoryFormMode, setInventoryFormMode, manageSubTab, setManageSubTab, prodSearchQuery, setProdSearchQuery, prodCategoryFilter, setProdCategoryFilter, newProdName, setNewProdName, newProdExp, setNewProdExp, newProdLab, setNewProdLab, newProdCost, setNewProdCost, newProdPrice, setNewProdPrice, newProdCategory, setNewProdCategory, newProdSkins, setNewProdSkins, newProdUnits, setNewProdUnits, newProdFactor, setNewProdFactor, newProdMinAlert, setNewProdMinAlert, newProdBarcode, setNewProdBarcode, newProdBarcode2, setNewProdBarcode2, newProdBarcode3, setNewProdBarcode3, newProdFoto, setNewProdFoto, newProdSellMode, setNewProdSellMode, newProdPriceUnits, setNewProdPriceUnits, newSupName, setNewSupName, newSupNit, setNewSupNit, newSupPhone, setNewSupPhone, newSupWsp, setNewSupWsp, newLabName, setNewLabName, newCatName, setNewCatName, restockSupplierId, setRestockSupplierId, restockProductId, setRestockProductId, restockSkins, setRestockSkins, restockUnits, setRestockUnits, restockTotalUnits, setRestockTotalUnits, restockCost, setRestockCost, restockPrice, setRestockPrice, restockPriceUnits, setRestockPriceUnits, restockExp, setRestockExp, invoiceItems, setInvoiceItems, posSearchQuery, setPosSearchQuery, barcodeInput, setBarcodeInput, posCart, setPosCart, invoiceClientNit, setInvoiceClientNit, showInvoicePreview, setShowInvoicePreview, posAlertMessage, setPosAlertMessage, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, showHistoryModal, setShowHistoryModal, profileName, setProfileName, profileImage, setProfileImage, fetchInitialData, syncOfflineQueue, handleToggleOffline, handleLogin, handleRegister, handleLogout, handleCreateProduct, handleCreateSupplier, handleAddInvoiceItem, handleDeleteInvoiceItem, handleSaveFullInvoice, handleAddLab, handleAddCat, handleAddProductToCart, handleBarcodeSubmit, handleUpdateCartQty, handleRemoveFromCart, calculateCartTotals, handleCheckoutSale, handleAddExpense, handleFinalizeClosure, handleUpdateBusinessProfile, handleUpdatePersonalProfile, handleDownloadXLS, filteredProducts, totalInventoryCost, totalInventoryPriceValue, preseededBarcodes, restockSelectedProduct, isRestockProductAmbasMode, restockProductFactor, handleDeleteSupplier, handleDeleteLab, handleDeleteCat, handleDeleteProduct,
    activePrintInvoice, setActivePrintInvoice
  };

  return (
    <AppContext.Provider value={appState}>
      <div id="main-app" className="min-h-screen bg-[#fafbfc] flex flex-col font-sans antialiased text-slate-900 selection:bg-teal-100 selection:text-teal-900">
        <Header />
        {currentUser && <Navigation />}
        <main id="app-content" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">


          {!currentUser ? (
            <Auth />
          ) : (
            <>
              {activeTab === "inventario" && <InventarioTab />}
              {activeTab === "facturacion" && <FacturacionTab />}
              {activeTab === "cierre" && <CierreTab />}
              {activeTab === "reportes" && <ReportesTab />}
              {activeTab === "perfil" && <PerfilTab />}
            </>
          )}
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-12">
          <p>© 2026 {business.name}. Todos los derechos reservados. Diseñado bajo principios de resiliencia Local-First.</p>
        </footer>

        {/* Floating Info Button */}
        <button
          onClick={() => setShowTechAdvisory(true)}
          className="fixed bottom-6 right-6 z-50 bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full shadow-lg transition-all"
          title="Ver Guía de Estrategia Arquitectónica"
        >
          <Info className="w-6 h-6" />
        </button>

        {/* Tech Advisory Modal */}
        {showTechAdvisory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative">
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setShowTechAdvisory(false)}
                  className="bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 transition-colors backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <TechAdvisory />
              </div>
            </div>
          </div>
        )}

      </div>

      {currentUser && activeTab === "inventario" && (
        <nav 
          className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-slate-200 py-2 px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] flex items-center justify-around md:hidden"
          style={{ 
            position: 'fixed', 
            bottom: '0px', 
            left: '0px', 
            right: '0px',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setInventoryFormMode("none");
              setProdSearchQuery("");
            }}
            className={`flex flex-col items-center gap-1 p-1.5 transition-all ${
              inventoryFormMode === "none" ? "text-teal-650 font-bold" : "text-slate-500"
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[9px]">Productos</span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryFormMode(inventoryFormMode === "initial" ? "none" : "initial")}
            className={`flex flex-col items-center gap-1 p-1.5 transition-all ${
              inventoryFormMode === "initial" ? "text-teal-650 font-bold" : "text-slate-500"
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[9px]">Inicial</span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryFormMode(inventoryFormMode === "invoice" ? "none" : "invoice")}
            className={`flex flex-col items-center gap-1 p-1.5 transition-all ${
              inventoryFormMode === "invoice" ? "text-teal-650 font-bold" : "text-slate-500"
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[9px]">Factura</span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryFormMode(inventoryFormMode === "manage" ? "none" : "manage")}
            className={`flex flex-col items-center gap-1 p-1.5 transition-all ${
              inventoryFormMode === "manage" ? "text-teal-650 font-bold" : "text-slate-500"
            }`}
          >
            <Building className="w-5 h-5" />
            <span className="text-[9px]">Listas</span>
          </button>
        </nav>
      )}
      {activePrintInvoice && (
        <div className="print-only ticket-container">
          <div className="ticket-header">
            <h2 className="ticket-title">{business.name}</h2>
            <p className="ticket-subtitle">NIT: {business.nit || '---'}</p>
            <p className="ticket-subtitle">{business.address || 'Droguería Local'}</p>
            <p className="ticket-subtitle">Tel: {business.phone || '---'}</p>
            <div className="ticket-divider" />
          </div>
          
          <div className="ticket-info">
            <p><strong>FACTURA:</strong> {activePrintInvoice.invoiceNumber}</p>
            <p><strong>FECHA:</strong> {new Date().toLocaleString('es-CO')}</p>
            <p><strong>VENDEDOR:</strong> {activePrintInvoice.sellerName}</p>
            {activePrintInvoice.clientNit && (
              <p><strong>CLIENTE NIT/CC:</strong> {activePrintInvoice.clientNit}</p>
            )}
            <div className="ticket-divider" />
          </div>

          <table className="ticket-table">
            <thead>
              <tr>
                <th className="text-left">Detalle</th>
                <th className="text-right">Cant.</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {activePrintInvoice.items.map((item: any, idx: number) => {
                const cantDesc = item.quantitySkins > 0 && item.quantityUnits > 0
                  ? `${item.quantitySkins}c + ${item.quantityUnits}u`
                  : item.quantitySkins > 0
                    ? `${item.quantitySkins}c`
                    : `${item.quantityUnits}u`;
                return (
                  <tr key={idx}>
                    <td>{item.productName}</td>
                    <td className="text-right">{cantDesc}</td>
                    <td className="text-right">${item.subtotal.toLocaleString('es-CO')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="ticket-divider" />
          
          <div className="ticket-totals">
            <div className="ticket-total-row">
              <span><strong>TOTAL:</strong></span>
              <span><strong>${activePrintInvoice.total.toLocaleString('es-CO')} COP</strong></span>
            </div>
          </div>
          
          <div className="ticket-footer">
            <div className="ticket-divider" />
            <p>¡Gracias por su compra!</p>
            <p>VexaPOS - Control Local-First</p>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}
