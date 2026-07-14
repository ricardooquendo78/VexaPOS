import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Camera, Package, FileText, TrendingDown, LineChart, User, Settings, Plus, Search, AlertCircle, FileSpreadsheet, Building, CheckCircle, Trash2, Barcode, Printer, X, CreditCard, UserCheck, LogOut, Wifi, WifiOff, RefreshCw, PlusCircle, Info } from 'lucide-react';
import TechAdvisory from './TechAdvisory';
import BarcodeScannerModal from './BarcodeScannerModal';

export default function InventarioTab() {
  const { isOffline, setIsOffline, offlineQueue, setOfflineQueue, syncLogs, setSyncLogs, isSyncing, setIsSyncing, currentUser, setCurrentUser, authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, registerName, setRegisterName, registerEmail, setRegisterEmail, registerPassword, setRegisterPassword, registerRole, setRegisterRole, authError, setAuthError, authSuccess, setAuthSuccess, business, setBusiness, products, setProducts, suppliers, setSuppliers, laboratories, setLaboratories, categories, setCategories, sales, setSales, closures, setClosures, activeClosure, setActiveClosure, activeTab, setActiveTab, showTechAdvisory, setShowTechAdvisory, inventoryFormMode, setInventoryFormMode, manageSubTab, setManageSubTab, prodSearchQuery, setProdSearchQuery, prodCategoryFilter, setProdCategoryFilter, newProdName, setNewProdName, newProdExp, setNewProdExp, newProdLab, setNewProdLab, newProdCost, setNewProdCost, newProdPrice, setNewProdPrice, newProdCategory, setNewProdCategory, newProdSkins, setNewProdSkins, newProdUnits, setNewProdUnits, newProdFactor, setNewProdFactor, newProdMinAlert, setNewProdMinAlert, newProdBarcode, setNewProdBarcode, newProdFoto, setNewProdFoto, newProdSellMode, setNewProdSellMode, newProdPriceUnits, setNewProdPriceUnits, newSupName, setNewSupName, newSupNit, setNewSupNit, newSupPhone, setNewSupPhone, newSupWsp, setNewSupWsp, newLabName, setNewLabName, newCatName, setNewCatName, restockSupplierId, setRestockSupplierId, restockProductId, setRestockProductId, restockSkins, setRestockSkins, restockUnits, setRestockUnits, restockTotalUnits, setRestockTotalUnits, restockCost, setRestockCost, restockPrice, setRestockPrice, restockPriceUnits, setRestockPriceUnits, restockExp, setRestockExp, invoiceItems, setInvoiceItems, posSearchQuery, setPosSearchQuery, barcodeInput, setBarcodeInput, posCart, setPosCart, invoiceClientNit, setInvoiceClientNit, showInvoicePreview, setShowInvoicePreview, posAlertMessage, setPosAlertMessage, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, showHistoryModal, setShowHistoryModal, profileName, setProfileName, profileImage, setProfileImage, fetchInitialData, syncOfflineQueue, handleToggleOffline, handleLogin, handleRegister, handleLogout, handleCreateProduct, handleCreateSupplier, handleAddInvoiceItem, handleDeleteInvoiceItem, handleSaveFullInvoice, handleAddLab, handleAddCat, handleAddProductToCart, handleBarcodeSubmit, handleUpdateCartQty, handleRemoveFromCart, calculateCartTotals, handleCheckoutSale, handleAddExpense, handleFinalizeClosure, handleUpdateBusinessProfile, handleUpdatePersonalProfile, handleDownloadXLS, filteredProducts, totalInventoryCost, totalInventoryPriceValue, preseededBarcodes, restockSelectedProduct, isRestockProductAmbasMode, restockProductFactor, handleDeleteSupplier, handleDeleteLab, handleDeleteCat } = useAppContext();

  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showBarcodeScannerForNewProduct, setShowBarcodeScannerForNewProduct] = React.useState(false);
  const [showBarcodeScannerForRestock, setShowBarcodeScannerForRestock] = React.useState(false);
  const [profitPercentage, setProfitPercentage] = React.useState<string>("");
  const [showNewSupplierModal, setShowNewSupplierModal] = React.useState(false);

  const onSubmitProductForm = async (e: React.FormEvent) => {
    if (!newProdName || !newProdLab || !newProdCategory) {
      await handleCreateProduct(e);
      return;
    }
    await handleCreateProduct(e);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 500);
  };

  const [editingProduct, setEditingProduct] = React.useState<any>(null);
  const [showPasswordPromptForProduct, setShowPasswordPromptForProduct] = React.useState<any>(null);
  const [enteredPassword, setEnteredPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = React.useState(false);

  // Edit product form states
  const [editName, setEditName] = React.useState("");
  const [editExp, setEditExp] = React.useState("");
  const [editLab, setEditLab] = React.useState("");
  const [editCost, setEditCost] = React.useState<number>(0);
  const [editPrice, setEditPrice] = React.useState<number>(0);
  const [editPriceUnits, setEditPriceUnits] = React.useState<number>(0);
  const [editCategory, setEditCategory] = React.useState("");
  const [editSkins, setEditSkins] = React.useState<number>(0);
  const [editUnits, setEditUnits] = React.useState<number>(0);
  const [editFactor, setEditFactor] = React.useState<number>(1);
  const [editMinAlert, setEditMinAlert] = React.useState<number>(5);
  const [editBarcode, setEditBarcode] = React.useState("");
  const [editFoto, setEditFoto] = React.useState("");
  const [editSellMode, setEditSellMode] = React.useState<"unidad" | "sobres" | "ambas">("ambas");
  const [editProfitPercentage, setEditProfitPercentage] = React.useState<string>("");

  const handleEditPercentageChange = (pctStr: string) => {
    setEditProfitPercentage(pctStr);
    const pct = parseFloat(pctStr);
    if (!isNaN(pct) && pct >= 0 && editPrice > 0) {
      const calculatedCost = editPrice / (1 + pct / 100);
      setEditCost(Math.round(calculatedCost));
    }
  };

  const handleEditPriceChange = (priceVal: number) => {
    setEditPrice(priceVal);
    const pct = parseFloat(editProfitPercentage);
    if (!isNaN(pct) && pct >= 0 && priceVal > 0) {
      const calculatedCost = priceVal / (1 + pct / 100);
      setEditCost(Math.round(calculatedCost));
    }
  };

  const handleEditCostChange = (costVal: number) => {
    setEditCost(costVal);
    setEditProfitPercentage("");
  };

  const handlePercentageChange = (pctStr: string) => {
    setProfitPercentage(pctStr);
    const pct = parseFloat(pctStr);
    if (!isNaN(pct) && pct >= 0 && newProdPrice > 0) {
      const calculatedCost = newProdPrice / (1 + pct / 100);
      setNewProdCost(Math.round(calculatedCost));
    }
  };

  const handlePriceChange = (priceVal: number) => {
    setNewProdPrice(priceVal);
    const pct = parseFloat(profitPercentage);
    if (!isNaN(pct) && pct >= 0 && priceVal > 0) {
      const calculatedCost = priceVal / (1 + pct / 100);
      setNewProdCost(Math.round(calculatedCost));
    }
  };

  const handleCostChange = (costVal: number) => {
    setNewProdCost(costVal);
    setProfitPercentage("");
  };

  const formatToMonth = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.length >= 7) {
      return dateStr.substring(0, 7);
    }
    return dateStr;
  };

  React.useEffect(() => {
    if (newProdName === "") {
      setProfitPercentage("");
    }
  }, [newProdName]);

  const handleVerifyPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setPasswordError("");
    setIsVerifyingPassword(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, password: enteredPassword })
      });
      const data = await response.json();
      if (data.success) {
        // Password verified! Open editing modal and copy values
        const p = showPasswordPromptForProduct;
        if (p) {
          setEditingProduct(p);
          setEditName(p.name);
          setEditExp(p.expirationDate || "");
          setEditLab(p.laboratory);
          setEditCost(p.cost);
          setEditPrice(p.price);
          setEditPriceUnits(p.priceUnits || 0);
          setEditCategory(p.category);
          setEditSkins(p.quantityOnSkins);
          setEditUnits(p.quantityUnits);
          setEditFactor(p.conversionFactor || 1);
          setEditMinAlert(p.minStockAlert || 5);
          setEditBarcode(p.barcode || "");
          setEditFoto(p.fotoUrl || "");
          setEditSellMode(p.conversionFactor > 1 ? "ambas" : (p.priceUnits ? "unidad" : "sobres"));
          setEditProfitPercentage("");
        }
        setShowPasswordPromptForProduct(null);
        setEnteredPassword("");
      } else {
        setPasswordError("Contraseña incorrecta. Inténtelo de nuevo.");
      }
    } catch (err) {
      setPasswordError("Error de conexión al verificar la contraseña.");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let savedSkins = 0;
    let savedUnits = 0;
    let savedFactor = 1;

    if (editSellMode === "unidad") {
      savedSkins = Number(editSkins) || 0;
      savedUnits = 0;
      savedFactor = 1;
    } else if (editSellMode === "sobres") {
      savedSkins = Number(editSkins) || 0;
      savedUnits = 0;
      savedFactor = 1;
    } else { // "ambas"
      savedSkins = Number(editSkins) || 0;
      savedFactor = Number(editFactor) || 1;
      savedUnits = (Number(editUnits) || 0) % savedFactor;
    }

    const payload = {
      id: editingProduct.id,
      name: editName,
      expirationDate: editExp || "2027-12-31",
      laboratory: editLab,
      cost: Number(editCost) || 0,
      price: Number(editPrice) || 0,
      priceUnits: editSellMode === "ambas" ? (Number(editPriceUnits) || 0) : undefined,
      category: editCategory,
      quantityOnSkins: savedSkins,
      quantityUnits: savedUnits,
      conversionFactor: savedFactor,
      minStockAlert: Number(editMinAlert) || 5,
      barcode: editBarcode,
      fotoUrl: editFoto || "",
    };

    if (isOffline) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p));
      setOfflineQueue(prev => [...prev, {
        id: "action-edit-" + Date.now(),
        type: "UPDATE",
        entity: "product_edit",
        data: payload,
        timestamp: new Date().toISOString()
      }]);
      setSyncLogs(prev => [`[Offline] Producto editado localmente: "${payload.name}"`, ...prev]);
      setEditingProduct(null);
    } else {
      try {
        const response = await fetch("/api/inventory/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          setSyncLogs(prev => [`[Servidor] Producto editado: "${payload.name}"`, ...prev]);
          setEditingProduct(null);
          fetchInitialData();
        } else {
          alert("Error al actualizar el producto en el servidor.");
        }
      } catch (err) {
        alert("Error de conexión. Se guardó localmente en la cola offline.");
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p));
        setOfflineQueue(prev => [...prev, {
          id: "action-edit-" + Date.now(),
          type: "UPDATE",
          entity: "product_edit",
          data: payload,
          timestamp: new Date().toISOString()
        }]);
      }
    }
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setEditFoto(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setNewProdFoto(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const [isCameraActive, setIsCameraActive] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setTimeout(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      alert("No se pudo acceder a la cámara. Asegúrese de otorgar permisos.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth, video.videoHeight) || 200;
      canvas.width = 200;
      canvas.height = 200;

      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 200, 200);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setNewProdFoto(dataUrl);
      }
      stopCamera();
    }
  };


  return (
    <>
      {/* TAB CONTENT: INVENTARIO */}
      {activeTab === "inventario" && currentUser.role === "admin" && (
              <div className="w-full">
                
                <aside className="fixed left-0 top-[180px] z-30 w-12 bg-white border border-l-0 border-slate-200 shadow-md rounded-r-xl py-3 hidden md:flex flex-col gap-2.5 items-center">
                  
                  {/* Botón: Lista de Productos */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        setInventoryFormMode("none");
                        setProdSearchQuery("");
                      }}
                      className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                        inventoryFormMode === "none"
                          ? "bg-slate-950 border-slate-950 text-white font-bold shadow-3xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Package className="w-4 h-4" />
                    </button>
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      Lista de Productos
                    </div>
                  </div>

                  {/* Botón: Inventario Inicial */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => setInventoryFormMode(inventoryFormMode === "initial" ? "none" : "initial")}
                      className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                        inventoryFormMode === "initial"
                          ? "bg-slate-950 border-slate-950 text-white font-bold shadow-3xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      Inventario Inicial
                    </div>
                  </div>

                  {/* Botón: Ingresar Factura */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => setInventoryFormMode(inventoryFormMode === "invoice" ? "none" : "invoice")}
                      className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                        inventoryFormMode === "invoice"
                          ? "bg-slate-950 border-slate-950 text-white font-bold shadow-3xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      Ingresar Factura
                    </div>
                  </div>

                  {/* Botón: Gestión de Listas */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => setInventoryFormMode(inventoryFormMode === "manage" ? "none" : "manage")}
                      className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                        inventoryFormMode === "manage"
                          ? "bg-slate-950 border-slate-950 text-white font-bold shadow-3xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Building className="w-4 h-4" />
                    </button>
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      Gestión de Listas
                    </div>
                  </div>
                </aside>



                {/* Área de Contenido Principal (con padding-left en escritorio para evitar solapamiento) */}
                <div className="w-full md:pl-4 space-y-6 pb-20 md:pb-0">

                {/* FORM: INVENTARIO INICIAL */}
                {inventoryFormMode === "initial" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-base mb-4 border-b pb-2">Registrar Producto de Inventario Inicial</h3>
                    <form onSubmit={onSubmitProductForm} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nombre Comercial *</label>
                        <input
                          type="text"
                          value={newProdName}
                          onChange={(e) => setNewProdName(e.target.value)}
                          required
                          placeholder="Ej: Dolex Forte Tabletas"
                          className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha de Vencimiento</label>
                        <input
                          type="month"
                          value={formatToMonth(newProdExp)}
                          onChange={(e) => setNewProdExp(e.target.value || "")}
                          className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Laboratorio *</label>
                        <select
                          value={newProdLab}
                          onChange={(e) => setNewProdLab(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600"
                        >
                          <option value="">Seleccione...</option>
                          {laboratories.map(lab => (
                            <option key={lab} value={lab}>{lab}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Clase / Categoría *</label>
                        <select
                          value={newProdCategory}
                          onChange={(e) => setNewProdCategory(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600"
                        >
                          <option value="">Seleccione...</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Selector de Modo de Venta */}
                      <div className="md:col-span-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">¿Cómo se vende este producto? *</label>
                          <span className="text-[11px] text-slate-500 block mt-0.5">Define las unidades y balances para la venta en el mostrador</span>
                        </div>
                        <div className="flex bg-slate-200/60 p-1 rounded-lg gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setNewProdSellMode("unidad");
                              setNewProdFactor(1);
                              setNewProdSkins(0);
                              setNewProdUnits(0);
                            }}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition ${
                              newProdSellMode === "unidad" 
                                ? "bg-teal-600 text-white shadow-sm" 
                                : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/40"
                            }`}
                          >
                            Por Unidad
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewProdSellMode("sobres");
                              setNewProdFactor(1);
                              setNewProdSkins(0);
                              setNewProdUnits(0);
                            }}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition ${
                              newProdSellMode === "sobres" 
                                ? "bg-teal-600 text-white shadow-sm" 
                                : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/40"
                            }`}
                          >
                            Por Sobres
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewProdSellMode("ambas");
                              setNewProdFactor(10);
                              setNewProdSkins(0);
                              setNewProdUnits(0);
                            }}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition ${
                              newProdSellMode === "ambas" 
                                ? "bg-teal-600 text-white shadow-sm" 
                                : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/40"
                            }`}
                          >
                            Las dos (Ambas)
                          </button>
                        </div>
                      </div>

                      {newProdSellMode === "unidad" && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Costo Neto x Unidad</label>
                            <input
                              type="number"
                              min="0"
                              value={newProdCost || ""}
                              onChange={(e) => handleCostChange(Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">% Ganancia (Ayuda Costo)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="Ej: 30"
                              value={profitPercentage || ""}
                              onChange={(e) => handlePercentageChange(e.target.value)}
                              className="w-full px-3 py-1.5 border border-teal-150 bg-teal-50/10 rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Precio Venta x Unidad *</label>
                            <input
                              type="number"
                              min="0"
                              value={newProdPrice || ""}
                              onChange={(e) => handlePriceChange(Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold text-teal-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cantidad de Unidades</label>
                            <input
                              type="number"
                              min="0"
                              value={newProdSkins || ""}
                              onChange={(e) => setNewProdSkins(Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold"
                            />
                          </div>
                        </>
                      )}

                      {newProdSellMode === "sobres" && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Costo Neto por Sobre</label>
                            <input
                              type="number"
                              min="0"
                              value={newProdCost || ""}
                              onChange={(e) => handleCostChange(Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">% Ganancia (Ayuda Costo)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="Ej: 30"
                              value={profitPercentage || ""}
                              onChange={(e) => handlePercentageChange(e.target.value)}
                              className="w-full px-3 py-1.5 border border-teal-150 bg-teal-50/10 rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Precio Venta por Sobre *</label>
                            <input
                              type="number"
                              min="0"
                              value={newProdPrice || ""}
                              onChange={(e) => handlePriceChange(Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold text-teal-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cantidad de Sobres</label>
                            <input
                              type="number"
                              min="0"
                              value={newProdSkins || ""}
                              onChange={(e) => setNewProdSkins(Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold"
                            />
                          </div>
                        </>
                      )}

                      {newProdSellMode === "ambas" && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Costo Neto (Caja/Sobre)</label>
                            <input
                              type="number"
                              min="0"
                              value={newProdCost || ""}
                              onChange={(e) => handleCostChange(Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">% Ganancia (Ayuda Costo)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="Ej: 30"
                              value={profitPercentage || ""}
                              onChange={(e) => handlePercentageChange(e.target.value)}
                              className="w-full px-3 py-1.5 border border-teal-150 bg-teal-50/10 rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Precio Venta (Caja/Sobre) *</label>
                            <input
                              type="number"
                              min="0"
                              value={newProdPrice || ""}
                              onChange={(e) => handlePriceChange(Number(e.target.value))}
                              className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold text-teal-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Precio Venta (Unidad Suelta) *</label>
                            <input
                              type="number"
                              min="0"
                              value={newProdPriceUnits || ""}
                              onChange={(e) => setNewProdPriceUnits(Number(e.target.value))}
                              placeholder="Ej: 500"
                              className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold text-teal-700"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-teal-700 uppercase tracking-wide text-[11px] font-bold mb-1">¿Cuántas unidades tiene cada sobre? *</label>
                            <input
                              type="number"
                              min="1"
                              value={newProdFactor || ""}
                              onChange={(e) => {
                                const newFactor = Math.max(1, Number(e.target.value));
                                setNewProdFactor(newFactor);
                                const total = newProdSkins * newFactor;
                                setNewProdUnits(total);
                              }}
                              placeholder="Ej: 10 pastillas"
                              className="w-full px-3 py-1.5 border border-teal-200 bg-teal-50/20 rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">¿Cuántos sobres hay? *</label>
                            <input
                              type="number"
                              min="0"
                              value={newProdSkins || ""}
                              onChange={(e) => {
                                const newSkins = Math.max(0, Number(e.target.value));
                                setNewProdSkins(newSkins);
                                const factor = newProdFactor || 1;
                                const leftover = newProdUnits % factor;
                                const total = newSkins * factor + leftover;
                                setNewProdUnits(total);
                              }}
                              className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-bold text-slate-800"
                            />
                          </div>
                          <div className="md:col-span-2 bg-emerald-50/40 p-3 rounded-lg border border-emerald-100 flex flex-col justify-center">
                            <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">¿Cuántas unidades hay en total? *</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={newProdUnits || ""}
                                onChange={(e) => {
                                  const newUnits = Math.max(0, Number(e.target.value));
                                  setNewProdUnits(newUnits);
                                  const factor = newProdFactor || 1;
                                  const computedSkins = Math.floor(newUnits / factor);
                                  setNewProdSkins(computedSkins);
                                }}
                                className="w-full px-3 py-1.5 border border-emerald-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-emerald-600 font-extrabold text-emerald-950 text-base"
                              />
                              <span className="text-xs text-emerald-700 font-semibold whitespace-nowrap min-w-fit">
                                ({newProdSkins} {newProdSkins === 1 ? 'sobre' : 'sobres'} y {newProdUnits % (newProdFactor || 1)} sueltas)
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-600 block mt-1">Este campo calcula y sincroniza automáticamente cuántos sobres y unidades sueltas quedan. Balance principal de stock.</span>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Umbral Stock Mínimo (Pastillas eq)</label>
                        <input
                          type="number"
                          value={newProdMinAlert || ""}
                          onChange={(e) => setNewProdMinAlert(Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Código de Barras</span>
                          <button
                            type="button"
                            onClick={() => setShowBarcodeScannerForNewProduct(true)}
                            className="text-teal-650 hover:text-teal-800 text-[10.5px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Escanear
                          </button>
                        </label>
                        <input
                          type="text"
                          value={newProdBarcode}
                          onChange={(e) => setNewProdBarcode(e.target.value)}
                          placeholder="Ej: 7702008123456"
                          className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs focus:ring-1 focus:ring-teal-600 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Imagen del fármaco</label>
                        {isCameraActive ? (
                          <div className="border border-teal-200 rounded-lg p-2 bg-teal-50/20 space-y-2">
                            <video ref={videoRef} className="w-full h-32 bg-black rounded-md object-cover" playsInline muted />
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={capturePhoto}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-2.5 rounded text-[10px] cursor-pointer"
                              >
                                Tomar Foto
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="bg-slate-650 hover:bg-slate-700 text-white font-bold py-1 px-2.5 rounded text-[10px] cursor-pointer"
                              >
                                Apagar
                              </button>
                            </div>
                          </div>
                        ) : newProdFoto ? (
                          <div className="relative border border-slate-200 rounded-md p-1 bg-slate-50 flex items-center justify-between h-9">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <img src={newProdFoto} alt="Preview" className="w-7 h-7 object-cover rounded border" />
                              <span className="text-[10px] text-emerald-600 font-semibold truncate">Cargada y optimizada</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewProdFoto('')}
                              className="text-slate-450 hover:text-rose-600 p-1 transition cursor-pointer"
                              title="Eliminar foto"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="w-full px-2 py-1 border border-slate-250 bg-white rounded-md text-[10px] focus:ring-1 focus:ring-teal-600 cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                            />
                            <button
                              type="button"
                              onClick={startCamera}
                              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 py-1.5 px-2 rounded-md text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Usar Cámara / Tomar Foto
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-4 flex justify-end gap-2 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => setInventoryFormMode("none")}
                          className="px-4 py-2 border rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
                        >
                          Guardar en Inventario
                        </button>
                      </div>

                    </form>
                  </div>
                )}

                {/* FORM: INGRESO FACTURA PROVEEDOR */}
                {inventoryFormMode === "invoice" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Cargue Completo de Factura de Proveedor</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Ingresa múltiples productos de una misma factura con datos exactos de stock, costos, precios y vencimiento.</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isOffline ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {isOffline ? '● Modo Offline (Cola Local)' : '● Conexión Nube Activa'}
                      </span>
                    </div>

                    {/* SECCIÓN 1: DATOS GENERALES DE LA FACTURA */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Proveedor de Origen *</label>
                        <div className="flex gap-2">
                          <select
                            required
                            value={restockSupplierId}
                            onChange={(e) => setRestockSupplierId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-250 bg-white rounded-md text-xs font-semibold"
                          >
                            <option value="">Seleccione el proveedor...</option>
                            {suppliers.map(sup => (
                              <option key={sup.id} value={sup.id}>{sup.companyName} {sup.nit ? `(NIT: ${sup.nit})` : ''}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowNewSupplierModal(true)}
                            className="px-3 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                            title="Crear Nuevo Proveedor"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nuevo</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col justify-end">
                        <p className="text-[11px] text-slate-500 leading-normal">
                          * Seleccione el proveedor de la factura primero. Luego, use el panel inferior para ingresar uno por uno los productos que contiene la factura.
                        </p>
                      </div>
                    </div>

                    {/* SECCIÓN 2: FORMULARIO AGREGAR PRODUCTO */}
                    <div className="border border-teal-200 rounded-lg p-4 bg-teal-50/20">
                      <h4 className="font-bold text-teal-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-teal-200/50 pb-2">
                        <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                        Paso 1: Agregar Producto a la Factura
                      </h4>
                      
                      <form onSubmit={handleAddInvoiceItem} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                        
                        <div className="md:col-span-4 grid grid-cols-12 gap-2">
                          <div className="col-span-8">
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Seleccionar Producto *</label>
                            <select
                              value={restockProductId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRestockProductId(val);
                                const found = products.find(p => p.id === val);
                                if (found) {
                                  setRestockCost(found.cost);
                                  setRestockPrice(found.price);
                                  setRestockPriceUnits(found.priceUnits || 0);
                                  setRestockExp(found.expirationDate || "");
                                  // auto set units to conversionFactor or 0 depending on mode
                                  setRestockTotalUnits(found.conversionFactor > 1 ? found.conversionFactor : 0);
                                  setRestockSkins(found.conversionFactor > 1 ? 1 : 0);
                                }
                              }}
                              className="w-full px-2 py-2 border border-slate-250 bg-white rounded-md text-xs font-bold text-slate-900"
                            >
                              <option value="">-- Buscar producto --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.laboratory})
                                </option>
                              ))}
                            </select>
                          </div>
                           <div className="col-span-4">
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center justify-between">
                              <span>Escanear / Buscar</span>
                              <button
                                type="button"
                                onClick={() => setShowBarcodeScannerForRestock(true)}
                                className="text-teal-650 hover:text-teal-850 cursor-pointer"
                                title="Escanear con cámara"
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                            </label>
                            <input
                              type="text"
                              placeholder="Código o nombre..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const target = e.target as HTMLInputElement;
                                  const query = target.value.trim();
                                  if (query) {
                                    // 1. Search by exact barcode match
                                    let found = products.find(p => p.barcode === query);
                                    
                                    // 2. Fallback to name search (case insensitive)
                                    if (!found) {
                                      found = products.find(p => p.name.toLowerCase().includes(query.toLowerCase()));
                                    }
                                    
                                    // 3. Fallback to barcode partial match (case insensitive)
                                    if (!found) {
                                      found = products.find(p => p.barcode && p.barcode.toLowerCase().includes(query.toLowerCase()));
                                    }

                                    if (found) {
                                      setRestockProductId(found.id);
                                      setRestockCost(found.cost);
                                      setRestockPrice(found.price);
                                      setRestockPriceUnits(found.priceUnits || 0);
                                      setRestockExp(found.expirationDate || "");
                                      setRestockTotalUnits(found.conversionFactor > 1 ? found.conversionFactor : 0);
                                      setRestockSkins(found.conversionFactor > 1 ? 1 : 0);
                                      target.value = "";
                                    } else {
                                      alert(`No se encontró producto con código o nombre: ${query}`);
                                    }
                                  }
                                }
                              }}
                              className="w-full px-2 py-2 border border-slate-250 bg-white rounded-md text-xs font-bold text-slate-900"
                            />
                          </div>
                        </div>

                        {/* Informacion de Producto en tiempo real si esta seleccionado */}
                        {restockSelectedProduct && (
                          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-5 gap-3.5 w-full">
                            
                            {/* CANTIDAD (DYNAMIC ONLY UNITS IF AMBAS SELLING MODE) */}
                            {restockSelectedProduct.conversionFactor > 1 ? (
                              <div className="md:col-span-1 min-w-[120px]">
                                <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1 leading-tight flex items-center justify-between">
                                  <span>Unidades *</span>
                                  <span className="text-[9px] text-emerald-600 lowercase bg-emerald-100/70 px-1 rounded">sueltas</span>
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={restockTotalUnits || ""}
                                  onChange={(e) => {
                                    const val = Math.max(1, Number(e.target.value));
                                    setRestockTotalUnits(val);
                                    setRestockSkins(Math.floor(val / restockProductFactor));
                                  }}
                                  className="w-full px-3 py-1.5 border border-emerald-300 bg-white rounded-md text-xs font-extrabold text-emerald-950 focus:ring-1 focus:ring-emerald-500"
                                />
                                <div className="text-[9.5px] font-medium text-emerald-700 leading-tight mt-1">
                                  = {Math.floor(restockTotalUnits / restockProductFactor)} sob. + {restockTotalUnits % restockProductFactor} u.
                                </div>
                              </div>
                            ) : (
                              <div className="md:col-span-1 min-w-[100px]">
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Cantidad *</label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={restockSkins || ""}
                                  onChange={(e) => {
                                    const val = Math.max(1, Number(e.target.value));
                                    setRestockSkins(val);
                                    setRestockTotalUnits(val);
                                  }}
                                  className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs font-bold"
                                />
                              </div>
                            )}

                            {/* COSTO NUEVO */}
                            <div className="md:col-span-1">
                              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Costo ($ COP) *</label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={restockCost || ""}
                                onChange={(e) => setRestockCost(Number(e.target.value))}
                                className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs font-bold"
                              />
                            </div>

                            {/* PRECIO NUEVO (SOBRE O EMPAQUE COMPLETO) */}
                            <div className="md:col-span-1">
                              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 leading-tight">
                                {restockSelectedProduct.conversionFactor > 1 ? 'PVP Sobre *' : 'PVP Venta *'}
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={restockPrice || ""}
                                onChange={(e) => setRestockPrice(Number(e.target.value))}
                                className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs font-bold text-teal-700"
                              />
                            </div>

                            {/* PRECIO NUEVO UNIDAD SUELTA (ONLY FOR AMBAS MODE) */}
                            {restockSelectedProduct.conversionFactor > 1 ? (
                              <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1 leading-tight">PVP Loose *</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={restockPriceUnits || ""}
                                  onChange={(e) => setRestockPriceUnits(Number(e.target.value))}
                                  className="w-full px-3 py-1.5 border border-emerald-300 bg-white rounded-md text-xs font-bold text-emerald-700"
                                />
                              </div>
                            ) : null}

                            {/* EXPIRACIÓN NUEVA */}
                            <div className={restockSelectedProduct.conversionFactor > 1 ? "md:col-span-1" : "md:col-span-2"}>
                              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Vencimiento</label>
                              <input
                                type="month"
                                value={formatToMonth(restockExp)}
                                onChange={(e) => setRestockExp(e.target.value || "")}
                                className="w-full px-3 py-1.5 border border-slate-250 bg-white rounded-md text-xs"
                              />
                            </div>

                          </div>
                        )}

                        <div className="md:col-span-12 flex justify-end">
                          <button
                            type="submit"
                            disabled={!restockProductId}
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 shadow-sm ${
                              restockProductId 
                                ? 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Agregar Producto a Factura
                          </button>
                        </div>

                      </form>
                    </div>

                    {/* SECCIÓN 3: TABLA DE PRODUCTOS EN LA FACTURA ACTUAL */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-4 py-3 border-b flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Paso 2: Detalle de Productos en esta Factura ({invoiceItems.length})
                        </span>
                        {invoiceItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("¿Estás seguro de que deseas vaciar toda la factura?")) {
                                setInvoiceItems([]);
                              }
                            }}
                            className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 hover:bg-red-100 font-semibold transition"
                          >
                            Vaciar Lista
                          </button>
                        )}
                      </div>

                      {invoiceItems.length === 0 ? (
                        <div className="p-8 text-center bg-white">
                          <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          <p className="text-xs font-medium text-slate-400">Aún no hay productos en la lista. Búsquelo arriba y presione "Agregar Producto a Factura".</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                <th className="p-3">Producto / Laboratorio</th>
                                <th className="p-3 text-center">Tipo Venta</th>
                                <th className="p-3 text-center">Cantidad a Ingresar</th>
                                <th className="p-3 text-right">Costo Unitario ($)</th>
                                <th className="p-3 text-right">Precio Venta ($)</th>
                                <th className="p-3 text-center">Fecha Vencimiento</th>
                                <th className="p-3 text-center w-16">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150">
                              {invoiceItems.map((item, idx) => {
                                const prodOriginal = products.find(p => p.id === item.productId);
                                return (
                                  <tr key={item.id} className="hover:bg-slate-50/50 transition font-medium text-slate-800">
                                    <td className="p-3">
                                      <div className="font-bold text-slate-900">{item.productName}</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">{item.laboratory}</div>
                                    </td>
                                    <td className="p-3 text-center">
                                      {item.conversionFactor > 1 ? (
                                        <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Ambas</span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-50 text-slate-600 border border-slate-200">Individual</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center bg-slate-50/50 font-bold">
                                      {item.conversionFactor > 1 ? (
                                        <div>
                                          <div className="text-emerald-900 text-xs font-extrabold">{item.quantityTotalUnits} unids.</div>
                                          <div className="text-[10px] text-emerald-600 mt-0.5">({item.quantitySkins} sob. + {item.quantityUnits} u. sueltas)</div>
                                        </div>
                                      ) : (
                                        <div className="text-slate-900 text-xs font-extrabold">{item.quantitySkins} unidades</div>
                                      )}
                                    </td>
                                    <td className="p-3 text-right font-bold text-slate-900">
                                      ${item.cost.toLocaleString("es-CO")}
                                      {prodOriginal && prodOriginal.cost !== item.cost && (
                                        <div className="text-[9px] text-amber-600 font-medium">Original: ${prodOriginal.cost.toLocaleString("es-CO")}</div>
                                      )}
                                    </td>
                                    <td className="p-3 text-right font-extrabold text-teal-800">
                                      <div>${item.price.toLocaleString("es-CO")} sob.</div>
                                      {item.conversionFactor > 1 && item.priceUnits && (
                                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">${item.priceUnits.toLocaleString("es-CO")} u. suelta</div>
                                      )}
                                      {prodOriginal && prodOriginal.price !== item.price && (
                                        <div className="text-[9px] text-amber-600 font-medium">Original: ${prodOriginal.price.toLocaleString("es-CO")}</div>
                                      )}
                                    </td>
                                    <td className="p-3 text-center font-bold text-slate-700">
                                      {item.expirationDate || 'Sin fecha'}
                                    </td>
                                    <td className="p-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteInvoiceItem(item.id)}
                                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition"
                                        title="Eliminar de la factura"
                                      >
                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* SECCIÓN 4: ACCIONES FINALES / PRE-GUARDAR */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t gap-4">
                      <div className="text-left text-xs text-slate-500">
                        Una vez agregados todos los productos, pulse <strong className="text-slate-800">Cargar Factura al Inventario</strong> para procesar la transacción y actualizar de forma masiva los stocks físicos.
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setInvoiceItems([]);
                            setInventoryFormMode("none");
                          }}
                          className="px-4 py-2 border rounded-md text-xs text-slate-600 hover:bg-slate-50 font-semibold transition"
                        >
                          Cancelar
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleSaveFullInvoice}
                          disabled={invoiceItems.length === 0 || !restockSupplierId}
                          className={`px-5 py-2.5 rounded-md text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md ${
                            invoiceItems.length > 0 && restockSupplierId
                              ? 'bg-slate-900 border border-slate-950 hover:bg-slate-850 text-teal-300 cursor-pointer pointer-events-auto'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed pointer-events-none'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Cargar Factura al Inventario ({invoiceItems.length} Refs)
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* GESTIÓN DE AUXILIARES: PROVEEDORES, LABS, CATEGORIAS */}
                {inventoryFormMode === "manage" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
                    <div className="flex border-b border-slate-100 gap-4 mb-4">
                      <button
                        onClick={() => setManageSubTab("suppliers")}
                        className={`pb-2 px-1 text-xs uppercase tracking-wider font-bold transition-all ${
                          manageSubTab === "suppliers" ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-400"
                        }`}
                      >
                        Proveedores
                      </button>
                      <button
                        onClick={() => setManageSubTab("laboratories")}
                        className={`pb-2 px-1 text-xs uppercase tracking-wider font-bold transition-all ${
                          manageSubTab === "laboratories" ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-400"
                        }`}
                      >
                        Laboratorios
                      </button>
                      <button
                        onClick={() => setManageSubTab("categories")}
                        className={`pb-2 px-1 text-xs uppercase tracking-wider font-bold transition-all ${
                          manageSubTab === "categories" ? "text-teal-600 border-b-2 border-teal-600" : "text-slate-400"
                        }`}
                      >
                        Categorías
                      </button>
                    </div>

                    {manageSubTab === "suppliers" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* List */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Proveedores Registrados</h4>
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {suppliers.map(sup => (
                              <div key={sup.id} className="p-3 bg-slate-50 rounded-lg border border-slate-150 text-xs flex justify-between items-start gap-2">
                                <div>
                                  <span className="font-semibold text-slate-950 block">{sup.companyName}</span>
                                  <p className="text-slate-500">NIT: {sup.nit} | Tel: {sup.phone}</p>
                                  <p className="text-emerald-700 font-bold mt-1 text-[10px]">Wsp: {sup.whatsapp}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSupplier(sup.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                                  title="Eliminar Proveedor"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCreateSupplier} className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3 text-xs">
                          <h4 className="font-bold text-slate-800">Agregar Empresa Proveedora</h4>
                          <div>
                            <label className="block mb-1 font-medium text-slate-600">Nombre Empresa (Obligatorio) *</label>
                            <input
                              type="text"
                              value={newSupName}
                              onChange={(e) => setNewSupName(e.target.value)}
                              required
                              className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium text-slate-600">NIT</label>
                            <input
                              type="text"
                              value={newSupNit}
                              onChange={(e) => setNewSupNit(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium text-slate-600">Teléfono</label>
                            <input
                              type="text"
                              value={newSupPhone}
                              onChange={(e) => setNewSupPhone(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 font-medium text-slate-600">WhatsApp</label>
                            <input
                              type="text"
                              value={newSupWsp}
                              onChange={(e) => setNewSupWsp(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded"
                            />
                          </div>
                          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded">
                            Registrar Proveedor
                          </button>
                        </form>
                      </div>
                    )}

                    {manageSubTab === "laboratories" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* List */}
                        <div>
                          <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">Lista General de Laboratorios</h4>
                          <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto p-2 border rounded-lg">
                            {laboratories.map(lab => (
                              <span key={lab} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded text-slate-700 font-semibold">
                                <span>{lab}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLab(lab)}
                                  className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  title="Eliminar Laboratorio"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Input block */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-110 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs mb-3">Agregar Laboratorio Farmacéutico</h4>
                            <input
                              type="text"
                              value={newLabName}
                              onChange={(e) => setNewLabName(e.target.value)}
                              placeholder="Ej: Pfizer"
                              className="w-full px-3 py-1.5 border bg-white rounded text-xs mb-2"
                            />
                            <p className="text-[10px] text-slate-400">Permite asociar productos a este laboratorio inmediatamente sin redundancias.</p>
                          </div>
                          <button onClick={handleAddLab} className="w-full mt-3 bg-slate-900 text-teal-300 text-xs font-bold py-2 rounded">
                            Adicionar Laboratorio
                          </button>
                        </div>
                      </div>
                    )}

                    {manageSubTab === "categories" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* List */}
                        <div>
                          <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">Categorías Médicas</h4>
                          <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto p-2 border rounded-lg">
                            {categories.map(cat => (
                              <span key={cat} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-purple-50 border border-purple-100 rounded text-purple-850 font-semibold font-mono">
                                <span>{cat}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCat(cat)}
                                  className="text-purple-400 hover:text-rose-600 transition cursor-pointer"
                                  title="Eliminar Categoría"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Input block */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-110 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs mb-3">Agregar Categoría Médica</h4>
                            <input
                              type="text"
                              value={newCatName}
                              onChange={(e) => setNewCatName(e.target.value)}
                              placeholder="Ej: Anestésicos"
                              className="w-full px-3 py-1.5 border bg-white rounded text-xs mb-2"
                            />
                            <p className="text-[10px] text-slate-400">Facilita el filtrado y segmentación en el POS de mostrador.</p>
                          </div>
                          <button onClick={handleAddCat} className="w-full mt-3 bg-slate-900 text-teal-300 text-xs font-bold py-2 rounded">
                            Adicionar Categoría
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* REAL TIME FILTERABLE MASTER TABLE */}
                {inventoryFormMode === "none" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-950 text-base leading-none">Catálogo Detallado de Fármacos</h3>
                      <p className="text-slate-500 text-xs mt-1">Busque medicamentos, filtre por tipo y verifique alertas de semáforo de vencimiento o stock mínimo.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Buscar por fármaco o código..."
                          value={prodSearchQuery}
                          onChange={(e) => setProdSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 border border-slate-250 rounded-lg text-xs w-48 focus:ring-1 focus:ring-teal-600 bg-white"
                        />
                      </div>

                      <select
                        value={prodCategoryFilter}
                        onChange={(e) => setProdCategoryFilter(e.target.value)}
                        className="py-1.5 px-3 border border-slate-250 bg-white rounded-lg text-xs"
                      >
                        <option value="">Todas las categorías</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b">
                        <tr>
                          <th className="p-3">Imagen/Medicamento</th>
                          <th className="p-3">Laboratorio</th>
                          <th className="p-3">Categoría</th>
                          <th className="p-3">Precio Venta (COP)</th>
                          <th className="p-3">Costo ($)</th>
                          <th className="p-3 text-center">Sobres / Cajas</th>
                          <th className="p-3 text-center">Unidades Sueltas</th>
                          <th className="p-3">Alerta de Stock (Mínimo)</th>
                          <th className="p-3">Próximo Vencimiento</th>
                          <th className="p-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-slate-400">
                              No se encontraron resultados
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map(p => {
                            const totalUnits = (p.quantityOnSkins * p.conversionFactor) + p.quantityUnits;
                            const isLowStock = totalUnits <= p.minStockAlert;
                            const dateExpiry = p.expirationDate ? new Date(p.expirationDate) : null;
                            const monthsToExpiry = dateExpiry && !isNaN(dateExpiry.getTime())
                              ? (dateExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
                              : NaN;
                            
                            let expiryBadge = "bg-emerald-50 text-emerald-800 border-emerald-100";
                            if (!isNaN(monthsToExpiry)) {
                              if (monthsToExpiry <= 3) {
                                expiryBadge = "bg-rose-100 text-rose-800 border-rose-200 animate-pulse font-bold";
                              } else if (monthsToExpiry <= 6) {
                                expiryBadge = "bg-amber-100 text-amber-800 border-amber-200";
                              }
                            }

                            return (
                              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-semibold text-slate-900">
                                  <div className="flex items-center gap-2.5">
                                    {p.fotoUrl ? (
                                      <img src={p.fotoUrl} alt={p.name} className="w-8 h-8 rounded-md object-cover border border-slate-200" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                                        <Package className="w-4 h-4" />
                                      </div>
                                    )}
                                    <div>
                                      <span>{p.name}</span>
                                      {p.barcode && <span className="block font-mono text-[9px] text-slate-400">Barcode: {p.barcode}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600 font-medium">{p.laboratory}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border text-[9px]">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-teal-800 text-xs">
                                  <div>${p.price.toLocaleString("es-CO")} COP</div>
                                  {p.conversionFactor > 1 && p.priceUnits !== undefined && p.priceUnits > 0 && (
                                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">${p.priceUnits.toLocaleString("es-CO")} u. suelta</div>
                                  )}
                                </td>
                                <td className="p-3 text-slate-500">${p.cost.toLocaleString("es-CO")}</td>
                                <td className="p-3 text-center font-bold text-slate-900 bg-slate-50/50">{p.quantityOnSkins}</td>
                                <td className="p-3 text-center font-mono text-slate-600">{p.quantityUnits} u <span className="text-[10px] text-slate-400">({p.conversionFactor > 1 ? `de ${p.conversionFactor}` : 'frac regular'})</span></td>
                                <td className="p-3">
                                  {isLowStock ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <AlertCircle className="w-3 h-3" />
                                      Stock Alerta (&lt;{p.minStockAlert})
                                    </span>
                                  ) : (
                                    <span className="text-[10.5px] text-emerald-600 font-bold">✔ Suficiente</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-0.5 rounded-md border text-[10px] ${expiryBadge}`}>
                                    {p.expirationDate || "Sin fecha"}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => setShowPasswordPromptForProduct(p)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                                  >
                                    <Settings className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-800 block">💡 Nota de Control Métrico:</span>
                    La cantidad por caja/sobre se disminuye de forma proporcional con la venta de pastillas sueltas. Por ejemplo, si un producto tiene un factor de conversión de 10 unidades por sobre, al vender 10 pastillas individuales, el sistema deduce automáticamente 1 sobre entero de stock.
                  </div>

                </div>
              )}

            </div>
          </div>
        )}
      {showBarcodeScannerForNewProduct && (
        <BarcodeScannerModal
          onScan={(code) => {
            setNewProdBarcode(code);
            setShowBarcodeScannerForNewProduct(false);
          }}
          onClose={() => setShowBarcodeScannerForNewProduct(false)}
        />
      )}
      {showBarcodeScannerForRestock && (
        <BarcodeScannerModal
          onScan={(code) => {
            const found = products.find(p => p.barcode === code);
            if (found) {
              setRestockProductId(found.id);
              setRestockCost(found.cost);
              setRestockPrice(found.price);
              setRestockPriceUnits(found.priceUnits || 0);
              setRestockExp(found.expirationDate || "");
              setRestockTotalUnits(found.conversionFactor > 1 ? found.conversionFactor : 0);
              setRestockSkins(found.conversionFactor > 1 ? 1 : 0);
            } else {
              alert(`No se encontró producto con código: ${code}`);
            }
            setShowBarcodeScannerForRestock(false);
          }}
          onClose={() => setShowBarcodeScannerForRestock(false)}
        />
      )}

      {showPasswordPromptForProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden text-slate-800 border">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h4 className="font-bold text-sm">Validación de Administrador</h4>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordPromptForProduct(null);
                  setEnteredPassword("");
                  setPasswordError("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleVerifyPasswordSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Para editar las cantidades, costos o precios del producto <strong>{showPasswordPromptForProduct.name}</strong>, ingrese la contraseña de su cuenta de usuario (<strong>{currentUser?.email}</strong>) por seguridad.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Contraseña de la Cuenta *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ingrese su contraseña"
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white text-xs focus:ring-1 focus:ring-teal-650"
                  autoFocus
                />
              </div>

              {passwordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordPromptForProduct(null);
                    setEnteredPassword("");
                    setPasswordError("");
                  }}
                  className="px-4 py-1.5 border hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPassword}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {isVerifyingPassword ? "Verificando..." : "Validar y Continuar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden text-slate-800 border my-8">
            <div className="p-4 bg-teal-900 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">Editar Producto</h4>
                <p className="text-[10px] text-teal-200 mt-0.5">ID: {editingProduct.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-teal-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nombre Comercial del Medicamento / Insumo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ibuprofeno 400mg Calox"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
                  />
                </div>

                {/* Expiration date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha de Expiración (Mes / Año)</label>
                  <input
                    type="month"
                    value={formatToMonth(editExp)}
                    onChange={(e) => setEditExp(e.target.value || "")}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-mono"
                  />
                </div>

                {/* Lab */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Laboratorio Responsable *</label>
                  <select
                    value={editLab}
                    onChange={(e) => setEditLab(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
                  >
                    <option value="">Seleccione laboratorio</option>
                    {laboratories.map(lab => (
                      <option key={lab} value={lab}>{lab}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Categoría Farmacéutica *</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
                  >
                    <option value="">Seleccione categoría</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Código de Barras (EAN / UPC)</label>
                  <input
                    type="text"
                    placeholder="Código leído por escáner"
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-mono"
                  />
                </div>

                {/* Sell Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Modalidad de Venta *</label>
                  <select
                    value={editSellMode}
                    onChange={(e) => setEditSellMode(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-bold"
                  >
                    <option value="unidad">Sueltas / Fracciones únicamente</option>
                    <option value="sobres">Caja / Blíster completo únicamente</option>
                    <option value="ambas">Ambas modalidades (Caja y pastilla suelta)</option>
                  </select>
                </div>

                {/* Factor (Conversion factor) */}
                {editSellMode === "ambas" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unidades por Caja/Sobre *</label>
                    <input
                      type="number"
                      required
                      min="2"
                      value={editFactor || ""}
                      onChange={(e) => setEditFactor(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-bold text-teal-800"
                    />
                  </div>
                )}

                {/* Price (Sale Price) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {editSellMode === "unidad" ? "Precio de Venta por Unidad ($) *" : "Precio de Venta por Caja/Sobre ($) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editPrice || ""}
                    onChange={(e) => handleEditPriceChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-bold text-teal-900"
                  />
                </div>

                {/* Profit percentage helper */}
                <div>
                  <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-1">% Ganancia Deseado (Calculadora Ayuda)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 30"
                    value={editProfitPercentage}
                    onChange={(e) => handleEditPercentageChange(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-amber-50/50 text-xs font-bold text-amber-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Cost (Net Cost) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Costo Neto de Compra ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editCost || ""}
                    onChange={(e) => handleEditCostChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-bold"
                  />
                </div>

                {/* PVP Loose (Price units) */}
                {editSellMode === "ambas" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Precio Venta Unitario (Suelto) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editPriceUnits || ""}
                      onChange={(e) => setEditPriceUnits(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-bold text-emerald-800"
                    />
                  </div>
                )}

                {/* Stock Sobres / Cajas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Existencia (Cajas/Sobres) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editSkins || ""}
                    onChange={(e) => setEditSkins(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-bold"
                  />
                </div>

                {/* Stock Unidades sueltas */}
                {editSellMode === "ambas" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Existencia Fracciones Sueltas *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editUnits || ""}
                      onChange={(e) => setEditUnits(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
                    />
                  </div>
                )}

                {/* Min stock Alert threshold */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Umbral Alerta Stock Mínimo (Unidades) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editMinAlert || ""}
                    onChange={(e) => setEditMinAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
                  />
                </div>

                {/* Image uploader / preview */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fotografía del Fármaco / Presentación</label>
                  <div className="flex items-center gap-4">
                    {editFoto ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                        <img src={editFoto} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditFoto("")}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[10px] font-bold"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border border-dashed border-slate-300">
                        <Camera className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageUpload}
                        className="hidden"
                        id="edit-file-upload"
                      />
                      <label
                        htmlFor="edit-file-upload"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 cursor-pointer shadow-xs"
                      >
                        Subir Foto
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">Crear Nuevo Proveedor</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Ingresa los datos para registrar un distribuidor nuevo en el sistema.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewSupplierModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                await handleCreateSupplier(e);
                setShowNewSupplierModal(false);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nombre de la Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Distribuidora Medix..."
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 bg-white rounded-md text-xs font-bold text-slate-900 placeholder:font-normal"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">NIT de la Empresa</label>
                <input
                  type="text"
                  placeholder="Ej: 900.123.456-1..."
                  value={newSupNit}
                  onChange={(e) => setNewSupNit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 bg-white rounded-md text-xs font-bold text-slate-900 placeholder:font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 3001234567..."
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-md text-xs font-bold text-slate-900 placeholder:font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ej: 3001234567..."
                    value={newSupWsp}
                    onChange={(e) => setNewSupWsp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-md text-xs font-bold text-slate-900 placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Registrar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-emerald-100 flex flex-col items-center gap-3 max-w-xs w-full mx-4 transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-6 h-6 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-sm">¡Producto Agregado!</span>
            <span className="text-xs text-slate-500 font-semibold text-center leading-none">Guardado con éxito</span>
          </div>
        </div>
      )}
    </>
  );
}
