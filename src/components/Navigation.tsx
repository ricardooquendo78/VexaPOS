import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Package, FileText, TrendingDown, LineChart, User, Settings, Plus, Search, AlertCircle, FileSpreadsheet, Building, CheckCircle, Trash2, Barcode, Printer, X, CreditCard, UserCheck, LogOut, Wifi, WifiOff, RefreshCw, PlusCircle, Info } from 'lucide-react';
import TechAdvisory from './TechAdvisory';

export default function Navigation() {
  const { isOffline, setIsOffline, offlineQueue, setOfflineQueue, syncLogs, setSyncLogs, isSyncing, setIsSyncing, currentUser, setCurrentUser, authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, registerName, setRegisterName, registerEmail, setRegisterEmail, registerPassword, setRegisterPassword, registerRole, setRegisterRole, authError, setAuthError, authSuccess, setAuthSuccess, business, setBusiness, products, setProducts, suppliers, setSuppliers, laboratories, setLaboratories, categories, setCategories, sales, setSales, closures, setClosures, activeClosure, setActiveClosure, activeTab, setActiveTab, showTechAdvisory, setShowTechAdvisory, inventoryFormMode, setInventoryFormMode, manageSubTab, setManageSubTab, prodSearchQuery, setProdSearchQuery, prodCategoryFilter, setProdCategoryFilter, newProdName, setNewProdName, newProdExp, setNewProdExp, newProdLab, setNewProdLab, newProdCost, setNewProdCost, newProdPrice, setNewProdPrice, newProdCategory, setNewProdCategory, newProdSkins, setNewProdSkins, newProdUnits, setNewProdUnits, newProdFactor, setNewProdFactor, newProdMinAlert, setNewProdMinAlert, newProdBarcode, setNewProdBarcode, newProdFoto, setNewProdFoto, newProdSellMode, setNewProdSellMode, newProdPriceUnits, setNewProdPriceUnits, newSupName, setNewSupName, newSupNit, setNewSupNit, newSupPhone, setNewSupPhone, newSupWsp, setNewSupWsp, newLabName, setNewLabName, newCatName, setNewCatName, restockSupplierId, setRestockSupplierId, restockProductId, setRestockProductId, restockSkins, setRestockSkins, restockUnits, setRestockUnits, restockTotalUnits, setRestockTotalUnits, restockCost, setRestockCost, restockPrice, setRestockPrice, restockPriceUnits, setRestockPriceUnits, restockExp, setRestockExp, invoiceItems, setInvoiceItems, posSearchQuery, setPosSearchQuery, barcodeInput, setBarcodeInput, posCart, setPosCart, invoiceClientNit, setInvoiceClientNit, showInvoicePreview, setShowInvoicePreview, posAlertMessage, setPosAlertMessage, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, showHistoryModal, setShowHistoryModal, profileName, setProfileName, profileImage, setProfileImage, fetchInitialData, syncOfflineQueue, handleToggleOffline, handleLogin, handleRegister, handleLogout, handleCreateProduct, handleCreateSupplier, handleAddInvoiceItem, handleDeleteInvoiceItem, handleSaveFullInvoice, handleAddLab, handleAddCat, handleAddProductToCart, handleBarcodeSubmit, handleUpdateCartQty, handleRemoveFromCart, calculateCartTotals, handleCheckoutSale, handleAddExpense, handleFinalizeClosure, handleUpdateBusinessProfile, handleUpdatePersonalProfile, handleDownloadXLS, filteredProducts, totalInventoryCost, totalInventoryPriceValue, preseededBarcodes, restockSelectedProduct, isRestockProductAmbasMode, restockProductFactor } = useAppContext();

  return (
    <>
      {/* NAVIGATION TABS FOR ACTIVE ROLES */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pb-1 border-b border-slate-200">
              
              <button
                onClick={() => {
                  if (currentUser.role !== 'admin') {
                    alert("El inventario y administración general de productos es de manejo exclusivo exclusivo para el Administrador.");
                    return;
                  }
                  setActiveTab("inventario");
                }}
                className={`py-3 px-4 rounded-lg font-semibold text-xs md:text-sm transition-all text-center flex flex-col items-center gap-1.5 border ${
                  activeTab === "inventario"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : currentUser.role !== 'admin'
                      ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                      : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Inventario {currentUser.role !== 'admin' && '🔒'}</span>
              </button>

              <button
                onClick={() => setActiveTab("facturacion")}
                className={`py-3 px-4 rounded-lg font-semibold text-xs md:text-sm transition-all text-center flex flex-col items-center gap-1.5 border ${
                  activeTab === "facturacion"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Facturación (POS)</span>
              </button>

              <button
                onClick={() => setActiveTab("cierre")}
                className={`py-3 px-4 rounded-lg font-semibold text-xs md:text-sm transition-all text-center flex flex-col items-center gap-1.5 border ${
                  activeTab === "cierre"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <TrendingDown className="w-5 h-5" />
                <span>Cierre Caja</span>
              </button>

              <button
                onClick={() => setActiveTab("reportes")}
                className={`py-3 px-4 rounded-lg font-semibold text-xs md:text-sm transition-all text-center flex flex-col items-center gap-1.5 border ${
                  activeTab === "reportes"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <LineChart className="w-5 h-5" />
                <span>Reportes</span>
              </button>

              <button
                onClick={() => setActiveTab("perfil")}
                className={`py-3 px-4 rounded-lg font-semibold text-xs md:text-sm transition-all text-center flex flex-col items-center gap-1.5 border ${
                  activeTab === "perfil"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Perfil y Negocio</span>
              </button>
            </div>
    </>
  );
}
