import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Package, FileText, TrendingDown, LineChart, User, Settings, Plus, Search, AlertCircle, FileSpreadsheet, Building, CheckCircle, Trash2, Barcode, Printer, X, CreditCard, UserCheck, LogOut, Wifi, WifiOff, RefreshCw, PlusCircle, Info } from 'lucide-react';
import TechAdvisory from './TechAdvisory';
import logoNegro from '../img/Logo en negro.png';

export default function Auth() {
  const { isOffline, setIsOffline, offlineQueue, setOfflineQueue, syncLogs, setSyncLogs, isSyncing, setIsSyncing, currentUser, setCurrentUser, authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, registerName, setRegisterName, registerEmail, setRegisterEmail, registerPassword, setRegisterPassword, registerRole, setRegisterRole, authError, setAuthError, authSuccess, setAuthSuccess, business, setBusiness, products, setProducts, suppliers, setSuppliers, laboratories, setLaboratories, categories, setCategories, sales, setSales, closures, setClosures, activeClosure, setActiveClosure, activeTab, setActiveTab, showTechAdvisory, setShowTechAdvisory, inventoryFormMode, setInventoryFormMode, manageSubTab, setManageSubTab, prodSearchQuery, setProdSearchQuery, prodCategoryFilter, setProdCategoryFilter, newProdName, setNewProdName, newProdExp, setNewProdExp, newProdLab, setNewProdLab, newProdCost, setNewProdCost, newProdPrice, setNewProdPrice, newProdCategory, setNewProdCategory, newProdSkins, setNewProdSkins, newProdUnits, setNewProdUnits, newProdFactor, setNewProdFactor, newProdMinAlert, setNewProdMinAlert, newProdBarcode, setNewProdBarcode, newProdFoto, setNewProdFoto, newProdSellMode, setNewProdSellMode, newProdPriceUnits, setNewProdPriceUnits, newSupName, setNewSupName, newSupNit, setNewSupNit, newSupPhone, setNewSupPhone, newSupWsp, setNewSupWsp, newLabName, setNewLabName, newCatName, setNewCatName, restockSupplierId, setRestockSupplierId, restockProductId, setRestockProductId, restockSkins, setRestockSkins, restockUnits, setRestockUnits, restockTotalUnits, setRestockTotalUnits, restockCost, setRestockCost, restockPrice, setRestockPrice, restockPriceUnits, setRestockPriceUnits, restockExp, setRestockExp, invoiceItems, setInvoiceItems, posSearchQuery, setPosSearchQuery, barcodeInput, setBarcodeInput, posCart, setPosCart, invoiceClientNit, setInvoiceClientNit, showInvoicePreview, setShowInvoicePreview, posAlertMessage, setPosAlertMessage, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, showHistoryModal, setShowHistoryModal, profileName, setProfileName, profileImage, setProfileImage, fetchInitialData, syncOfflineQueue, handleToggleOffline, handleLogin, handleRegister, handleLogout, handleCreateProduct, handleCreateSupplier, handleAddInvoiceItem, handleDeleteInvoiceItem, handleSaveFullInvoice, handleAddLab, handleAddCat, handleAddProductToCart, handleBarcodeSubmit, handleUpdateCartQty, handleRemoveFromCart, calculateCartTotals, handleCheckoutSale, handleAddExpense, handleFinalizeClosure, handleUpdateBusinessProfile, handleUpdatePersonalProfile, handleDownloadXLS, filteredProducts, totalInventoryCost, totalInventoryPriceValue, preseededBarcodes, restockSelectedProduct, isRestockProductAmbasMode, restockProductFactor } = useAppContext();

  return (
    <>
      {/* AUTH SECTION */}
          <div className="max-w-md mx-auto my-12 bg-white rounded-xl border border-slate-200 shadow-md p-6 md:p-8 text-slate-800">
            <div className="text-center mb-6">
              <img src={logoNegro} alt="VexaPOS" className="h-16 mx-auto mb-4 object-contain" />
              <h2 className="text-2xl font-bold text-slate-950">Vexa POS</h2>
              <p className="text-slate-500 text-sm mt-1">Por favor ingrese sus credenciales para continuar</p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            
            {authSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {authMode === "login" ? (
              <form onSubmit={handleLogin} id="login-form" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
                    placeholder="email@vexapos.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold shadow-xs transition"
                >
                  Iniciar Sesión
                </button>
                
                <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <span>¿Deseas registrar una nueva cuenta de mostrador? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className="text-teal-600 font-bold hover:underline"
                  >
                    Registrar Cuenta
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
                    placeholder="Ej: Daniel Restrepo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
                    placeholder="email@vexapos.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1">Rol Operativo</label>
                  <select
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value as "admin" | "worker")}
                    className="w-full px-3 py-2 border border-slate-250 bg-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
                  >
                    <option value="worker">Worker (Cajero/Mostrador)</option>
                    <option value="admin">Admin (Acceso Completo)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-sm font-semibold shadow-xs transition"
                >
                  Registrarse
                </button>
                <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <span>¿Ya tienes una cuenta operativa? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="text-teal-600 font-bold hover:underline"
                  >
                    Ingresar
                  </button>
                </div>
              </form>
            )}


          </div>
    </>
  );
}
