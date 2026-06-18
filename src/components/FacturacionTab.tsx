import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Camera, Package, FileText, TrendingDown, LineChart, User, Settings, Plus, Search, AlertCircle, FileSpreadsheet, Building, CheckCircle, Trash2, Barcode, Printer, X, CreditCard, UserCheck, LogOut, Wifi, WifiOff, RefreshCw, PlusCircle, Info } from 'lucide-react';
import TechAdvisory from './TechAdvisory';
import BarcodeScannerModal from './BarcodeScannerModal';

export default function FacturacionTab() {
  const { isOffline, setIsOffline, offlineQueue, setOfflineQueue, syncLogs, setSyncLogs, isSyncing, setIsSyncing, currentUser, setCurrentUser, authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, registerName, setRegisterName, registerEmail, setRegisterEmail, registerPassword, setRegisterPassword, registerRole, setRegisterRole, authError, setAuthError, authSuccess, setAuthSuccess, business, setBusiness, products, setProducts, suppliers, setSuppliers, laboratories, setLaboratories, categories, setCategories, sales, setSales, closures, setClosures, activeClosure, setActiveClosure, activeTab, setActiveTab, showTechAdvisory, setShowTechAdvisory, inventoryFormMode, setInventoryFormMode, manageSubTab, setManageSubTab, prodSearchQuery, setProdSearchQuery, prodCategoryFilter, setProdCategoryFilter, newProdName, setNewProdName, newProdExp, setNewProdExp, newProdLab, setNewProdLab, newProdCost, setNewProdCost, newProdPrice, setNewProdPrice, newProdCategory, setNewProdCategory, newProdSkins, setNewProdSkins, newProdUnits, setNewProdUnits, newProdFactor, setNewProdFactor, newProdMinAlert, setNewProdMinAlert, newProdBarcode, setNewProdBarcode, newProdFoto, setNewProdFoto, newProdSellMode, setNewProdSellMode, newProdPriceUnits, setNewProdPriceUnits, newSupName, setNewSupName, newSupNit, setNewSupNit, newSupPhone, setNewSupPhone, newSupWsp, setNewSupWsp, newLabName, setNewLabName, newCatName, setNewCatName, restockSupplierId, setRestockSupplierId, restockProductId, setRestockProductId, restockSkins, setRestockSkins, restockUnits, setRestockUnits, restockTotalUnits, setRestockTotalUnits, restockCost, setRestockCost, restockPrice, setRestockPrice, restockPriceUnits, setRestockPriceUnits, restockExp, setRestockExp, invoiceItems, setInvoiceItems, posSearchQuery, setPosSearchQuery, barcodeInput, setBarcodeInput, posCart, setPosCart, invoiceClientNit, setInvoiceClientNit, showInvoicePreview, setShowInvoicePreview, posAlertMessage, setPosAlertMessage, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, showHistoryModal, setShowHistoryModal, profileName, setProfileName, profileImage, setProfileImage, fetchInitialData, syncOfflineQueue, handleToggleOffline, handleLogin, handleRegister, handleLogout, handleCreateProduct, handleCreateSupplier, handleAddInvoiceItem, handleDeleteInvoiceItem, handleSaveFullInvoice, handleAddLab, handleAddCat, handleAddProductToCart, handleBarcodeSubmit, handleUpdateCartQty, handleRemoveFromCart, calculateCartTotals, handleCheckoutSale, handleAddExpense, handleFinalizeClosure, handleUpdateBusinessProfile, handleUpdatePersonalProfile, handleDownloadXLS, filteredProducts, totalInventoryCost, totalInventoryPriceValue, preseededBarcodes, restockSelectedProduct, isRestockProductAmbasMode, restockProductFactor } = useAppContext();
  const [unifiedQuery, setUnifiedQuery] = React.useState('');
  const [showCameraScanner, setShowCameraScanner] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (activeTab === "facturacion" && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "facturacion") return;

    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput) {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key.length === 1) {
        const isFast = buffer.length === 0 || diff < 45;
        if (isFast) {
          buffer += e.key;
        } else {
          buffer = e.key;
        }
      } else if (e.key === "Enter") {
        const isFastSequence = buffer.length >= 5 && diff < 45;
        if (isFastSequence) {
          e.preventDefault();
          e.stopPropagation();
          const barcode = buffer.trim();
          buffer = "";

          const match = products.find((p: any) => p.barcode === barcode);
          if (match) {
            const isAvailable = (match.quantityOnSkins > 0) || (match.quantityUnits > 0);
            if (isAvailable) {
              handleAddProductToCart(match);
              setPosAlertMessage(`Lector Láser: "${match.name}" agregado.`);
              setTimeout(() => setPosAlertMessage(""), 3000);
            } else {
              setPosAlertMessage(`⚠ Lector Láser: "${match.name}" no tiene stock disponible.`);
              setTimeout(() => setPosAlertMessage(""), 3000);
            }
          } else {
            setPosAlertMessage(`⚠ Lector Láser: Código "${barcode}" no registrado.`);
            setTimeout(() => setPosAlertMessage(""), 4000);
          }
        } else {
          buffer = "";
        }
      } else if (e.key === "Escape") {
        buffer = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [activeTab, products, handleAddProductToCart]);

  const posSearchResults = products.filter((p: any) => {
    if (!unifiedQuery.trim()) return false;
    const q = unifiedQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.laboratory.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q))
    );
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = unifiedQuery.trim();
    if (!query) return;

    // Find exact barcode or ID match
    const match = products.find((p: any) => p.barcode === query || p.id === query);
    if (match) {
      const isAvailable = (match.quantityOnSkins > 0) || (match.quantityUnits > 0);
      if (isAvailable) {
        handleAddProductToCart(match);
        setUnifiedQuery('');
        setPosAlertMessage(`Lector: "${match.name}" agregado.`);
        setTimeout(() => setPosAlertMessage(""), 3000);
      } else {
        setPosAlertMessage(`⚠ "${match.name}" no tiene stock disponible.`);
        setTimeout(() => setPosAlertMessage(""), 3000);
      }
      return;
    }

    // Try to find matching products by name
    const matches = products.filter((p: any) => {
      const q = query.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.laboratory.toLowerCase().includes(q);
    });

    if (matches.length === 1) {
      const p = matches[0];
      const isAvailable = (p.quantityOnSkins > 0) || (p.quantityUnits > 0);
      if (isAvailable) {
        handleAddProductToCart(p);
        setUnifiedQuery('');
        setPosAlertMessage(`Agregado: "${p.name}".`);
        setTimeout(() => setPosAlertMessage(""), 3000);
      } else {
        setPosAlertMessage(`⚠ "${p.name}" no tiene stock disponible.`);
        setTimeout(() => setPosAlertMessage(""), 3000);
      }
    } else if (matches.length > 1) {
      setPosAlertMessage(`Seleccione un producto de la lista desplegable.`);
      setTimeout(() => setPosAlertMessage(""), 3000);
    } else {
      setPosAlertMessage(`⚠ No se encontró ningún producto para "${query}".`);
      setTimeout(() => setPosAlertMessage(""), 4000);
    }
  };

  const handleCameraScan = (barcode: string) => {
    const match = products.find((p: any) => p.barcode === barcode);
    if (match) {
      const isAvailable = (match.quantityOnSkins > 0) || (match.quantityUnits > 0);
      if (isAvailable) {
        handleAddProductToCart(match);
        setPosAlertMessage(`Cámara: "${match.name}" agregado.`);
        setTimeout(() => setPosAlertMessage(""), 3000);
      } else {
        setPosAlertMessage(`⚠ Cámara: "${match.name}" no tiene stock disponible.`);
        setTimeout(() => setPosAlertMessage(""), 3000);
      }
    } else {
      setPosAlertMessage(`⚠ Cámara: Código "${barcode}" no registrado.`);
      setTimeout(() => setPosAlertMessage(""), 4000);
    }
    setShowCameraScanner(false);
  };

  return (
    <>
      {/* TAB CONTENT: FACTURACIÓN / POS */}
      {activeTab === "facturacion" && (
        <div className="max-w-4xl mx-auto w-full space-y-6 text-slate-800">
          
          {/* UNIFIED SEARCH AND BARCODE SCANNER */}
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-xl p-5 md:p-6 shadow-sm space-y-4 relative border border-teal-950">
            <div className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-teal-300 animate-pulse" />
              <h3 className="font-bold text-white text-base">Buscador Inteligente / Lector de Código de Barras</h3>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-teal-350 absolute left-3.5 top-3.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={unifiedQuery}
                  onChange={(e) => setUnifiedQuery(e.target.value)}
                  placeholder="Escanea un código de barras o busca por nombre, laboratorio, categoría..."
                  className="pl-10 pr-16 py-2.5 w-full border border-teal-500/30 rounded-lg text-xs bg-teal-950/70 text-white placeholder-teal-100/50 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                />
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  {unifiedQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setUnifiedQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="text-teal-300 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCameraScanner(true)}
                    className="text-teal-300 hover:text-white transition cursor-pointer"
                    title="Escanear con cámara"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Floating Dropdown overlay */}
              {posSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto z-40 divide-y divide-slate-100">
                  {posSearchResults.map((p: any) => {
                    const isAvailable = (p.quantityOnSkins > 0) || (p.quantityUnits > 0);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (isAvailable) {
                            handleAddProductToCart(p);
                            setUnifiedQuery('');
                            searchInputRef.current?.focus();
                          }
                        }}
                        className={`p-3 text-xs flex items-center justify-between transition ${
                          isAvailable
                            ? "hover:bg-slate-50 cursor-pointer text-slate-800"
                            : "opacity-50 bg-slate-50 cursor-not-allowed text-slate-400"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-950 text-sm">{p.name}</span>
                          <span className="text-slate-500 text-[10.5px]">
                            {p.laboratory} • {p.category} {p.barcode ? `• Cód: ${p.barcode}` : ""}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-teal-700 text-sm">${p.price.toLocaleString("es-CO")} COP</div>
                          <div className="text-[10px] text-slate-550">
                            Stock: {p.quantityOnSkins} sob. / {p.quantityUnits} u.
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </form>
            
            {posAlertMessage && (
              <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                posAlertMessage.includes('⚠') 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-teal-50 border-teal-200 text-teal-800'
              }`}>
                {posAlertMessage.includes('⚠') ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle className="w-4 h-4 text-teal-600" />}
                <span>{posAlertMessage}</span>
              </div>
            )}
          </div>

          {/* MAIN CART AND SALE DISPLAY */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" />
                  Mostrador de Facturación
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {new Date().toLocaleDateString("es-CO", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <span className="text-[11px] font-bold px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-teal-800">
                Boleta POS N° {sales.length + 1}
              </span>
            </div>

            {/* CART CARDS CONTAINER */}
            <div className="space-y-4">
              {posCart.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                  <Barcode className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                  <span>El carrito está vacío. Escanea un código de barras o busca medicamentos.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {posCart.map((item: any) => {
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
                        unitPrice = Math.round(item.customPrice / item.product.conversionFactor);
                      }
                    } else {
                      unitPrice = item.customPrice;
                    }
                    
                    const itemTotal = (item.qtySkins * item.customPrice) + (item.qtyUnits * unitPrice);

                    return (
                      <div key={item.product.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-900 text-sm block truncate">{item.product.name}</span>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            {item.product.laboratory} • Cód: {item.product.barcode || 'N/A'} • {item.product.category}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                            Precio Sob/Caja: ${item.customPrice.toLocaleString("es-CO")} COP {item.product.conversionFactor > 1 ? `• Precio Unit: $${unitPrice.toLocaleString("es-CO")} COP` : ''}
                          </span>
                        </div>

                        {/* Adjust quantities */}
                        <div className="flex items-center gap-4">
                          {item.product.conversionFactor > 1 ? (
                            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1 text-center">Sobres/Cajas</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(item.product.id, Math.max(0, item.qtySkins - 1), item.qtyUnits)}
                                    className="w-5 h-5 bg-white border border-slate-200 rounded text-slate-700 flex items-center justify-center hover:bg-slate-100 font-bold transition text-[11px]"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.qtySkins}
                                    onChange={(e) => handleUpdateCartQty(item.product.id, Number(e.target.value), item.qtyUnits)}
                                    className="w-10 bg-white border border-slate-200 rounded text-center text-xs py-0.5 font-semibold text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(item.product.id, item.qtySkins + 1, item.qtyUnits)}
                                    className="w-5 h-5 bg-white border border-slate-200 rounded text-slate-700 flex items-center justify-center hover:bg-slate-100 font-bold transition text-[11px]"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div className="border-l border-slate-200 h-8 self-end" />

                              <div>
                                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1 text-center">Unidades</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(item.product.id, item.qtySkins, Math.max(0, item.qtyUnits - 1))}
                                    className="w-5 h-5 bg-white border border-slate-200 rounded text-slate-700 flex items-center justify-center hover:bg-slate-100 font-bold transition text-[11px]"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.qtyUnits}
                                    onChange={(e) => handleUpdateCartQty(item.product.id, item.qtySkins, Number(e.target.value))}
                                    className="w-10 bg-white border border-slate-200 rounded text-center text-xs py-0.5 font-semibold text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(item.product.id, item.qtySkins, item.qtyUnits + 1)}
                                    className="w-5 h-5 bg-white border border-slate-200 rounded text-slate-700 flex items-center justify-center hover:bg-slate-100 font-bold transition text-[11px]"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1 text-center">Cantidad</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(item.product.id, Math.max(1, item.qtySkins - 1), 0)}
                                    className="w-5 h-5 bg-white border border-slate-200 rounded text-slate-700 flex items-center justify-center hover:bg-slate-100 font-bold transition text-[11px]"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.qtySkins}
                                    onChange={(e) => handleUpdateCartQty(item.product.id, Number(e.target.value), 0)}
                                    className="w-12 bg-white border border-slate-200 rounded text-center text-xs py-0.5 font-bold text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(item.product.id, item.qtySkins + 1, 0)}
                                    className="w-5 h-5 bg-white border border-slate-200 rounded text-slate-700 flex items-center justify-center hover:bg-slate-100 font-bold transition text-[11px]"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Subtotal & Delete */}
                          <div className="flex items-center gap-3 pl-2 min-w-[120px] justify-end">
                            <div className="text-right">
                              <span className="block text-[10px] text-slate-400 font-medium font-sans">Subtotal</span>
                              <strong className="text-slate-950 text-xs">${itemTotal.toLocaleString("es-CO")}</strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.product.id)}
                              className="text-slate-450 hover:text-rose-600 transition p-1 hover:bg-rose-50 rounded"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SUMMARY & CHECKOUT */}
            {posCart.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                  
                  {/* Client Identification */}
                  <div className="w-full md:max-w-xs">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
                      Cédula o NIT de Cliente (Opcional)
                    </label>
                    <input
                      type="text"
                      value={invoiceClientNit}
                      onChange={(e) => setInvoiceClientNit(e.target.value)}
                      placeholder="Ej: 1.032.482.115"
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-teal-600 transition"
                    />
                  </div>

                  {/* Summary calculations */}
                  <div className="w-full md:max-w-xs bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Subtotal Neto</span>
                      <span>${calculateCartTotals().toLocaleString("es-CO")} COP</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-sans">
                      <span>IVA Incluido (Medicamentos)</span>
                      <span className="italic text-slate-450">Exento</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black border-t pt-2.5 border-slate-200">
                      <span className="text-slate-900 text-[11px] uppercase tracking-wider font-bold">TOTAL VENTA</span>
                      <span className="text-teal-700 text-lg font-bold">${calculateCartTotals().toLocaleString("es-CO")} COP</span>
                    </div>
                  </div>

                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowInvoicePreview(true)}
                    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-200 transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Vista Previa Impresión</span>
                  </button>

                  <button
                    onClick={handleCheckoutSale}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Registrar Factura</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RECEIPT PREVIEW MODAL */}
          {showInvoicePreview && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 text-slate-800">
                
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-widest text-slate-350">Vista Previa de Ticket POS</span>
                  <button onClick={() => setShowInvoicePreview(false)} className="text-white/60 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 font-mono text-[11px] leading-relaxed space-y-4 max-h-[460px] overflow-y-auto">
                  <div className="text-center font-bold text-slate-950 uppercase border-b border-dashed pb-3 flex flex-col items-center">
                    {business.logoUrl && (
                      <img src={business.logoUrl} alt="Logo" className="w-12 h-12 mb-2 rounded object-cover filter grayscale border border-slate-200" />
                    )}
                    <span className="text-[14px] leading-tight block font-sans font-bold">{business.name}</span>
                    <span className="text-[9px] font-normal lowercase block text-slate-500">Año fundación: {business.foundationYear}</span>
                    <br />
                    <span>NIT: {business.nit}</span>
                    <span className="font-normal block">Telf: {business.phone}</span>
                    <span className="font-normal block">{business.address}, {business.city}</span>
                  </div>

                  <div className="border-b border-dashed pb-2.5">
                    <div><strong>FACTURA POS:</strong> FC-TEMPORAL</div>
                    <div><strong>FECHA:</strong> {new Date().toLocaleString()}</div>
                    <div><strong>CAJERO:</strong> {currentUser?.name}</div>
                    {invoiceClientNit && <div><strong>CLIENTE NIT:</strong> {invoiceClientNit}</div>}
                    <div className="italic text-[10px] text-slate-400 mt-1">Sujeto a normas simplificadas de comercio farmacéutico.</div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold block border-b border-dashed pb-1">MEDICAMENTOS CARGADOS:</span>
                    {posCart.map((item: any) => {
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
                          unitPrice = Math.round(item.customPrice / item.product.conversionFactor);
                        }
                      } else {
                        unitPrice = item.customPrice;
                      }
                      return (
                        <div key={item.product.id} className="flex justify-between">
                          <span className="max-w-[200px] truncate">
                            {item.qtySkins > 0 ? `${item.qtySkins} Sob. ` : ""}{item.qtyUnits > 0 ? `${item.qtyUnits} Past. ` : ""}{item.product.name}
                          </span>
                          <span>${((item.qtySkins * item.customPrice) + (item.qtyUnits * unitPrice)).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-dashed pt-2 space-y-1">
                    <div className="flex justify-between font-black text-[13px] text-slate-900">
                      <span>TOTAL NETO COP</span>
                      <span>${calculateCartTotals().toLocaleString("es-CO")} COP</span>
                    </div>
                  </div>

                  <div className="text-center text-[10px] pt-4 border-t border-slate-100 text-slate-400 leading-tight">
                    --- Gracias por su confianza ---
                    <br />
                    {business.name} - Tu salud en manos expertas.
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setShowInvoicePreview(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-slate-100 transition"
                  >
                    Regresar
                  </button>
                  <button
                    onClick={handleCheckoutSale}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition"
                  >
                    Autorizar e Imprimir Venta
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
      {showCameraScanner && (
        <BarcodeScannerModal
          onScan={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </>
  );
}
