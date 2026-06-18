import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Package, FileText, TrendingDown, LineChart, User, Settings, Plus, Search, AlertCircle, FileSpreadsheet, Building, CheckCircle, Trash2, Barcode, Printer, X, CreditCard, UserCheck, LogOut, Wifi, WifiOff, RefreshCw, PlusCircle, Info } from 'lucide-react';
import TechAdvisory from './TechAdvisory';

export default function Header() {
  const { isOffline, setIsOffline, offlineQueue, setOfflineQueue, syncLogs, setSyncLogs, isSyncing, setIsSyncing, currentUser, setCurrentUser, authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, registerName, setRegisterName, registerEmail, setRegisterEmail, registerPassword, setRegisterPassword, registerRole, setRegisterRole, authError, setAuthError, authSuccess, setAuthSuccess, business, setBusiness, products, setProducts, suppliers, setSuppliers, laboratories, setLaboratories, categories, setCategories, sales, setSales, closures, setClosures, activeClosure, setActiveClosure, activeTab, setActiveTab, showTechAdvisory, setShowTechAdvisory, inventoryFormMode, setInventoryFormMode, manageSubTab, setManageSubTab, prodSearchQuery, setProdSearchQuery, prodCategoryFilter, setProdCategoryFilter, newProdName, setNewProdName, newProdExp, setNewProdExp, newProdLab, setNewProdLab, newProdCost, setNewProdCost, newProdPrice, setNewProdPrice, newProdCategory, setNewProdCategory, newProdSkins, setNewProdSkins, newProdUnits, setNewProdUnits, newProdFactor, setNewProdFactor, newProdMinAlert, setNewProdMinAlert, newProdBarcode, setNewProdBarcode, newProdFoto, setNewProdFoto, newProdSellMode, setNewProdSellMode, newProdPriceUnits, setNewProdPriceUnits, newSupName, setNewSupName, newSupNit, setNewSupNit, newSupPhone, setNewSupPhone, newSupWsp, setNewSupWsp, newLabName, setNewLabName, newCatName, setNewCatName, restockSupplierId, setRestockSupplierId, restockProductId, setRestockProductId, restockSkins, setRestockSkins, restockUnits, setRestockUnits, restockTotalUnits, setRestockTotalUnits, restockCost, setRestockCost, restockPrice, setRestockPrice, restockPriceUnits, setRestockPriceUnits, restockExp, setRestockExp, invoiceItems, setInvoiceItems, posSearchQuery, setPosSearchQuery, barcodeInput, setBarcodeInput, posCart, setPosCart, invoiceClientNit, setInvoiceClientNit, showInvoicePreview, setShowInvoicePreview, posAlertMessage, setPosAlertMessage, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, showHistoryModal, setShowHistoryModal, profileName, setProfileName, profileImage, setProfileImage, fetchInitialData, syncOfflineQueue, handleToggleOffline, handleLogin, handleRegister, handleLogout, handleCreateProduct, handleCreateSupplier, handleAddInvoiceItem, handleDeleteInvoiceItem, handleSaveFullInvoice, handleAddLab, handleAddCat, handleAddProductToCart, handleBarcodeSubmit, handleUpdateCartQty, handleRemoveFromCart, calculateCartTotals, handleCheckoutSale, handleAddExpense, handleFinalizeClosure, handleUpdateBusinessProfile, handleUpdatePersonalProfile, handleDownloadXLS, filteredProducts, totalInventoryCost, totalInventoryPriceValue, preseededBarcodes, restockSelectedProduct, isRestockProductAmbasMode, restockProductFactor } = useAppContext();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  return (
    <>
      <header id="main-header" className="sticky top-0 z-40 bg-white border-b border-slate-200 py-2.5 sm:py-3.5 px-4 md:px-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-3">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm font-sans flex-shrink-0">
              {business.name ? business.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'VP'}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-slate-950 flex items-center gap-2 leading-tight">
              {business.name}
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-normal border border-slate-200">
                POS Droguería
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">NIT: {business.nit} | {business.address}</p>
          </div>
        </div>

        {/* Sync panel and mock network status banner */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* OFFLINE TOGGLE CHIPS */}
          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5 sm:p-1 font-mono text-xs shadow-3xs">
            <button
              onClick={handleToggleOffline}
              id="offline-btn"
              className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md transition-all font-semibold ${
                !isOffline 
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Online</span>
              <span className="sm:hidden">On</span>
            </button>
            <button
              onClick={handleToggleOffline}
              id="online-btn"
              className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md transition-all font-semibold ${
                isOffline 
                  ? "bg-amber-100 text-amber-800 border border-amber-200" 
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Offline-First</span>
              <span className="sm:hidden">Off</span>
            </button>
          </div>

          {/* QUEUE COUNT */}
          {offlineQueue.length > 0 && (
            <button
              onClick={() => syncOfflineQueue()}
              disabled={isOffline || isSyncing}
              className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 animate-pulse text-xs font-bold rounded-lg flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{offlineQueue.length} Sincronizaciones por enviar</span>
            </button>
          )}

          {/* Logged in indicator */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-2.5 sm:pl-3.5">
              <div className="hidden sm:block text-right">
                <span className="text-xs font-semibold block text-slate-800 leading-none">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-none">
                  Controles: {currentUser.role === 'admin' ? 'Administrador' : 'Empleado'}
                </span>
              </div>
              <img
                src={currentUser.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-slate-300"
              />
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    await fetchInitialData();
                  } catch (e) {
                    alert("Error al sincronizar con el servidor");
                  } finally {
                    setTimeout(() => setIsRefreshing(false), 500);
                  }
                }}
                id="refresh-btn"
                title="Sincronizar datos"
                className="p-1 px-2 border border-slate-150 rounded text-slate-500 hover:text-teal-650 hover:bg-teal-50 transition active:scale-95 cursor-pointer flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                id="logout-btn"
                title="Cerrar sesión"
                className="p-1 px-2 border border-slate-150 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Sin autenticar</span>
          )}

        </div>
      </header>
    </>
  );
}
