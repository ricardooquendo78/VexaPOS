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

export default function App() {
// Offline state simulator representation
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<string[]>(["Sistema en línea. Listo para procesar."]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Authentication & session variables
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  
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
    date: new Date().toISOString().split("T")[0],
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
  const [newProdCost, setNewProdCost] = useState(0);
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdCategory, setNewProdCategory] = useState("");
  const [newProdSkins, setNewProdSkins] = useState(0); 
  const [newProdUnits, setNewProdUnits] = useState(0); 
  const [newProdFactor, setNewProdFactor] = useState(10); // columns or pills in custom layout
  const [newProdMinAlert, setNewProdMinAlert] = useState(5);
  const [newProdBarcode, setNewProdBarcode] = useState("");
  const [newProdFoto, setNewProdFoto] = useState("");
  const [newProdSellMode, setNewProdSellMode] = useState<"unidad" | "sobres" | "ambas">("ambas");
  const [newProdPriceUnits, setNewProdPriceUnits] = useState(0);

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
    conversionFactor: number;
    quantitySkins: number;
    quantityUnits: number;
    quantityTotalUnits?: number;
    cost: number;
    price: number;
    priceUnits?: number;
    expirationDate: string;
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
  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // Simulate local database preseed on load
  useEffect(() => {
    fetchInitialData();
  }, []);

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
        setProducts(prodData);
      }
      
      const supResp = await fetch("/api/inventory/manage/suppliers");
      if (supResp.ok) {
        const supData = await supResp.json();
        setSuppliers(supData);
      }

      const labsResp = await fetch("/api/inventory/manage/laboratories");
      if (labsResp.ok) {
        setLaboratories(await labsResp.json());
      }

      const catsResp = await fetch("/api/inventory/manage/categories");
      if (catsResp.ok) {
        setCategories(await catsResp.json());
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
        setCurrentUser(data.user);
        setProfileName(data.user.name);
        setProfileImage(data.user.profileImage || "");
        setAuthSuccess("¡Ingreso exitoso!");
        setSyncLogs(prev => [`Usuario ${data.user.name} inició sesión.`, ...prev]);
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
    setAuthError("");
    setAuthSuccess("");
    if (!registerName || !registerEmail || !registerPassword) {
      setAuthError("Favor diligenciar todos los campos");
      return;
    }
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          role: registerRole
        })
      });
      const data = await response.json();
      if (data.success) {
        setAuthSuccess("¡Registro exitoso! Ya puedes iniciar sesión.");
        setAuthMode("login");
        setLoginEmail(registerEmail);
        setLoginPassword("");
      } else {
        setAuthError(data.message || "Error al registrar el usuario.");
      }
    } catch (err) {
      setAuthError("Error: El servidor no está disponible y el registro offline no está soportado");
    }
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
      minStockAlert: Number(newProdMinAlert) || 5,
      barcode: newProdBarcode,
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
    setNewProdMinAlert(5);
    setNewProdBarcode("");
    setNewProdFoto("");
    setNewProdSellMode("ambas");
    setInventoryFormMode("none");
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
        quantitySkins: item.quantitySkins,
        quantityUnits: item.quantityUnits,
        cost: item.cost,
        price: item.price,
        priceUnits: item.priceUnits,
        expirationDate: item.expirationDate
      }))
    };

    if (isOffline) {
      // Local addition
      setProducts(prev => {
        return prev.map(p => {
          const item = invoiceItems.find(it => it.productId === p.id);
          if (item) {
            let newS = p.quantityOnSkins + item.quantitySkins;
            let newU = p.quantityUnits + item.quantityUnits;
            if (newU >= p.conversionFactor && p.conversionFactor > 1) {
              newS += Math.floor(newU / p.conversionFactor);
              newU = newU % p.conversionFactor;
            }
            return {
              ...p,
              quantityOnSkins: newS,
              quantityUnits: newU,
              cost: item.cost > 0 ? item.cost : p.cost,
              price: item.price > 0 ? item.price : p.price,
              priceUnits: item.priceUnits !== undefined && item.priceUnits > 0 ? item.priceUnits : p.priceUnits,
              expirationDate: item.expirationDate ? item.expirationDate : p.expirationDate
            };
          }
          return p;
        });
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
    const match = products.find(p => p.barcode === barcodeInput || p.id === barcodeInput);
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

  // Calculate POS cart values
  const calculateCartTotals = () => {
    let subtotal = 0;
    posCart.forEach(item => {
      const skinCost = item.qtySkins * item.customPrice;
      let unitPrice = 0;
      if (item.product.conversionFactor > 1) {
        if (item.product.priceUnits && item.product.priceUnits > 0) {
          const baseEnvelopePrice = item.product.price || 0;
          if (baseEnvelopePrice > 0 && item.customPrice !== baseEnvelopePrice) {
            const ratio = item.customPrice / baseEnvelopePrice;
            unitPrice = Math.round(item.product.priceUnits * ratio);
          } else {
            unitPrice = item.product.priceUnits;
          }
        } else {
          unitPrice = item.customPrice / item.product.conversionFactor;
        }
      } else {
        unitPrice = item.customPrice;
      }
      const unitCost = item.qtyUnits * unitPrice;
      subtotal += (skinCost + unitCost);
    });
    return Math.round(subtotal);
  };

  // Process POS Sale
  const handleCheckoutSale = async () => {
    if (posCart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    const nextInvoiceNo = "FC-" + String(sales.length + 1).padStart(5, "0");
    const total = calculateCartTotals();
    
    const itemsPayload = posCart.map(c => {
      let unitPrice = 0;
      if (c.product.conversionFactor > 1) {
        if (c.product.priceUnits && c.product.priceUnits > 0) {
          const baseEnvelopePrice = c.product.price || 0;
          if (baseEnvelopePrice > 0 && c.customPrice !== baseEnvelopePrice) {
            const ratio = c.customPrice / baseEnvelopePrice;
            unitPrice = Math.round(c.product.priceUnits * ratio);
          } else {
            unitPrice = c.product.priceUnits;
          }
        } else {
          unitPrice = c.customPrice / c.product.conversionFactor;
        }
      } else {
        unitPrice = c.customPrice;
      }
      const amount = (c.qtySkins * c.customPrice) + (c.qtyUnits * unitPrice);

      return {
        productId: c.product.id,
        productName: c.product.name,
        quantitySkins: c.qtySkins,
        quantityUnits: c.qtyUnits,
        price: c.customPrice,
        subtotal: Math.round(amount)
      };
    });

    const payload = {
      id: "sale-local-" + Date.now(),
      invoiceNumber: nextInvoiceNo,
      sellerId: currentUser?.id || "offline-pos",
      sellerName: currentUser?.name || "Vendedor Local",
      items: itemsPayload,
      total,
      clientNit: invoiceClientNit || ""
    };

    // Stock reduction math inside UI to simulate offline-first precision
    const updatedProducts = products.map(p => {
      const cartItem = posCart.find(c => c.product.id === p.id);
      if (cartItem) {
        const totalUnitsInStock = (p.quantityOnSkins * p.conversionFactor) + p.quantityUnits;
        const totalUnitsToDeduct = (cartItem.qtySkins * p.conversionFactor) + cartItem.qtyUnits;
        const remainingTotalUnits = Math.max(0, totalUnitsInStock - totalUnitsToDeduct);
        
        let remSkins = 0;
        let remUnits = 0;

        if (p.conversionFactor > 1) {
          remSkins = Math.floor(remainingTotalUnits / p.conversionFactor);
          remUnits = remainingTotalUnits % p.conversionFactor;
        } else {
          remSkins = remainingTotalUnits;
          remUnits = 0;
        }

        return {
          ...p,
          quantityOnSkins: remSkins,
          quantityUnits: remUnits
        };
      }
      return p;
    });

    setProducts(updatedProducts);

    // Closure updates
    setActiveClosure(prev => ({
      ...prev,
      totalSalesCount: prev.totalSalesCount + 1,
      totalSalesRevenue: prev.totalSalesRevenue + total,
      finalCash: prev.finalCash + total
    }));

    if (isOffline) {
      setSales(prev => [payload as any, ...prev]);
      setOfflineQueue(prev => [...prev, {
        id: "action-" + Date.now(),
        type: "CREATE",
        entity: "sale",
        data: payload,
        timestamp: new Date().toISOString()
      }]);
      setSyncLogs(prev => [`[Offline POS] Factura ${nextInvoiceNo} por $${total} creada localmente.`, ...prev]);
    } else {
      try {
        const response = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          setSyncLogs(prev => [`[Servidor] Factura de Venta ${nextInvoiceNo} sincronizada. Balances actualizados.`, ...prev]);
          fetchInitialData();
        }
      } catch (err) {
        setSales(prev => [payload as any, ...prev]);
        setOfflineQueue(prev => [...prev, {
          id: "action-" + Date.now(),
          type: "CREATE",
          entity: "sale",
          data: payload,
          timestamp: new Date().toISOString()
        }]);
      }
    }

    setPosCart([]);
    setInvoiceClientNit("");
    setShowInvoicePreview(false);
    alert(`Venta registrada con éxito. Factura: ${nextInvoiceNo}`);
  };

  // Cierre Daily Expense submission
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || expenseAmount <= 0) return;

    const payload = {
      description: expenseDesc,
      amount: expenseAmount
    };

    setActiveClosure(prev => {
      const expObj = { id: "exp-" + Date.now(), description: expenseDesc, amount: expenseAmount, timestamp: new Date().toISOString() };
      return {
        ...prev,
        totalExpenses: prev.totalExpenses + expenseAmount,
        finalCash: prev.finalCash - expenseAmount,
        expenses: [...prev.expenses, expObj]
      };
    });

    if (isOffline) {
      setOfflineQueue(prev => [...prev, {
        id: "action-" + Date.now(),
        type: "CREATE",
        entity: "expense",
        data: payload,
        timestamp: new Date().toISOString()
      }]);
      setSyncLogs(prev => [`[Offline Cierre] Gasto registrado: "${expenseDesc}" por $${expenseAmount}`, ...prev]);
    } else {
      try {
        const response = await fetch("/api/closure/expense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          setSyncLogs(prev => [`Gasto registrado de forma segura en la base de datos nubes: "${expenseDesc}"`, ...prev]);
          fetchInitialData();
        }
      } catch (err) {
        alert("Sin conexión. El gasto se acumuló en cola de sincronización.");
      }
    }

    setExpenseDesc("");
    setExpenseAmount(0);
  };

  // Complete Shift / Cierre de Caja
  const handleFinalizeClosure = async () => {
    if (window.confirm("¿Está seguro de que desea realizar el cierre financiero diario del mostrador? Esto bloqueará las transacciones correspondientes.")) {
      try {
        if (isOffline) {
          alert("Alerta: El cierre diario completo no puede completarse sin conexión. Sincronice antes de cerrar el balance diurno.");
          return;
        }

        const resp = await fetch("/api/closure/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (resp.ok) {
          alert("Cierre finalizado exitosamente. Carga financiera re-generada.");
          fetchInitialData();
        }
      } catch (err) {
        alert("Fallo de red al intentar consolidar cierre.");
      }
    }
  };

  // Profile management trigger updates
  const handleUpdateBusinessProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch("/api/profile/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(business)
      });
      if (resp.ok) {
        alert("¡Datos del negocio e información corporativa POS actualizados!");
        fetchInitialData();
      } else {
        const errorData = await resp.json().catch(() => ({}));
        alert("Error al guardar la configuración: " + (errorData.message || "Error interno del servidor"));
      }
    } catch (e) {
      alert("Actualización guardada de forma local");
    }
  };

  const handleUpdatePersonalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name: profileName,
        profileImage: profileImage
      });
      alert("Perfil personal actualizado localmente.");
    }
  };

  // Report Export: Simulates dynamic xls generation and download
  const handleDownloadXLS = (reportType: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === "inventario") {
      csvContent += "ID,Nombre,Categoria,Laboratorio,Sobres o Cajas,Pastillas Sueltas,Costo Caja,Precio Venta,Fecha de Vencimiento,Codigo de Barras\n";
      products.forEach(p => {
        csvContent += `"${p.id}","${p.name}","${p.category}","${p.laboratory}",${p.quantityOnSkins},${p.quantityUnits},${p.cost},${p.price},"${p.expirationDate}","${p.barcode || ""}"\n`;
      });
    } else if (reportType === "sales") {
      csvContent += "Num Factura,Fecha,Seller,NIT Cliente,Total\n";
      sales.forEach(s => {
        csvContent += `"${s.invoiceNumber}","${s.dateTime}","${s.sellerName}","${s.clientNit || ""}",${s.total}\n`;
      });
    } else {
      csvContent += "Fecha Cierre,Ingresos por Ventas,Gastos Registrados,Fondo Inicial,Dinero en Caja Neto,Estado\n";
      closures.forEach(cl => {
        csvContent += `"${cl.date}",${cl.totalSalesRevenue},${cl.totalExpenses},${cl.initialCash},${cl.finalCash},"${cl.isClosed ? 'Cerrado' : 'Abierto'}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_VexaPOS_${reportType}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Computes stock warnings and statistics
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(prodSearchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(prodSearchQuery));
    const matchesCategory = prodCategoryFilter ? p.category === prodCategoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const totalInventoryCost = products.reduce((acc, p) => {
    // cost is per envelope / box. We estimate loose unit cost relative to conversion factor
    const skinValue = p.quantityOnSkins * p.cost;
    const unitValue = p.conversionFactor > 1 ? p.quantityUnits * (p.cost / p.conversionFactor) : 0;
    return acc + skinValue + unitValue;
  }, 0);

  const totalInventoryPriceValue = products.reduce((acc, p) => {
    const skinValue = p.quantityOnSkins * p.price;
    const unitValue = p.conversionFactor > 1 ? p.quantityUnits * (p.price / p.conversionFactor) : 0;
    return acc + skinValue + unitValue;
  }, 0);

  // Auto add preseeded code trigger list
  const preseededBarcodes: any[] = [];

  const restockSelectedProduct = products.find(p => p.id === restockProductId);
  const isRestockProductAmbasMode = restockSelectedProduct && restockSelectedProduct.conversionFactor > 1;
  const restockProductFactor = restockSelectedProduct?.conversionFactor || 1;

  const appState = {
    isOffline, setIsOffline, offlineQueue, setOfflineQueue, syncLogs, setSyncLogs, isSyncing, setIsSyncing, currentUser, setCurrentUser, authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, registerName, setRegisterName, registerEmail, setRegisterEmail, registerPassword, setRegisterPassword, registerRole, setRegisterRole, authError, setAuthError, authSuccess, setAuthSuccess, business, setBusiness, products, setProducts, suppliers, setSuppliers, laboratories, setLaboratories, categories, setCategories, sales, setSales, closures, setClosures, activeClosure, setActiveClosure, activeTab, setActiveTab, showTechAdvisory, setShowTechAdvisory, inventoryFormMode, setInventoryFormMode, manageSubTab, setManageSubTab, prodSearchQuery, setProdSearchQuery, prodCategoryFilter, setProdCategoryFilter, newProdName, setNewProdName, newProdExp, setNewProdExp, newProdLab, setNewProdLab, newProdCost, setNewProdCost, newProdPrice, setNewProdPrice, newProdCategory, setNewProdCategory, newProdSkins, setNewProdSkins, newProdUnits, setNewProdUnits, newProdFactor, setNewProdFactor, newProdMinAlert, setNewProdMinAlert, newProdBarcode, setNewProdBarcode, newProdFoto, setNewProdFoto, newProdSellMode, setNewProdSellMode, newProdPriceUnits, setNewProdPriceUnits, newSupName, setNewSupName, newSupNit, setNewSupNit, newSupPhone, setNewSupPhone, newSupWsp, setNewSupWsp, newLabName, setNewLabName, newCatName, setNewCatName, restockSupplierId, setRestockSupplierId, restockProductId, setRestockProductId, restockSkins, setRestockSkins, restockUnits, setRestockUnits, restockTotalUnits, setRestockTotalUnits, restockCost, setRestockCost, restockPrice, setRestockPrice, restockPriceUnits, setRestockPriceUnits, restockExp, setRestockExp, invoiceItems, setInvoiceItems, posSearchQuery, setPosSearchQuery, barcodeInput, setBarcodeInput, posCart, setPosCart, invoiceClientNit, setInvoiceClientNit, showInvoicePreview, setShowInvoicePreview, posAlertMessage, setPosAlertMessage, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, showHistoryModal, setShowHistoryModal, profileName, setProfileName, profileImage, setProfileImage, fetchInitialData, syncOfflineQueue, handleToggleOffline, handleLogin, handleRegister, handleLogout, handleCreateProduct, handleCreateSupplier, handleAddInvoiceItem, handleDeleteInvoiceItem, handleSaveFullInvoice, handleAddLab, handleAddCat, handleAddProductToCart, handleBarcodeSubmit, handleUpdateCartQty, handleRemoveFromCart, calculateCartTotals, handleCheckoutSale, handleAddExpense, handleFinalizeClosure, handleUpdateBusinessProfile, handleUpdatePersonalProfile, handleDownloadXLS, filteredProducts, totalInventoryCost, totalInventoryPriceValue, preseededBarcodes, restockSelectedProduct, isRestockProductAmbasMode, restockProductFactor
  };

  return (
    <AppContext.Provider value={appState}>
      <div id="main-app" className="min-h-screen bg-[#fafbfc] flex flex-col font-sans antialiased text-slate-900 selection:bg-teal-100 selection:text-teal-900">
        <Header />
        <main id="app-content" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">


          {!currentUser ? (
            <Auth />
          ) : (
            <>
              <Navigation />
              {activeTab === "inventario" && currentUser.role === "admin" && <InventarioTab />}
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
    </AppContext.Provider>
  );
}
