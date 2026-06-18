import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Package, FileText, TrendingDown, LineChart, User, Settings, Plus, Search, AlertCircle, FileSpreadsheet, Building, CheckCircle, Trash2, Barcode, Printer, X, CreditCard, UserCheck, LogOut, Wifi, WifiOff, RefreshCw, PlusCircle, Info } from 'lucide-react';
import TechAdvisory from './TechAdvisory';

export default function ReportesTab() {
  const { isOffline, setIsOffline, offlineQueue, setOfflineQueue, syncLogs, setSyncLogs, isSyncing, setIsSyncing, currentUser, setCurrentUser, authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, registerName, setRegisterName, registerEmail, setRegisterEmail, registerPassword, setRegisterPassword, registerRole, setRegisterRole, authError, setAuthError, authSuccess, setAuthSuccess, business, setBusiness, products, setProducts, suppliers, setSuppliers, laboratories, setLaboratories, categories, setCategories, sales, setSales, closures, setClosures, activeClosure, setActiveClosure, activeTab, setActiveTab, showTechAdvisory, setShowTechAdvisory, inventoryFormMode, setInventoryFormMode, manageSubTab, setManageSubTab, prodSearchQuery, setProdSearchQuery, prodCategoryFilter, setProdCategoryFilter, newProdName, setNewProdName, newProdExp, setNewProdExp, newProdLab, setNewProdLab, newProdCost, setNewProdCost, newProdPrice, setNewProdPrice, newProdCategory, setNewProdCategory, newProdSkins, setNewProdSkins, newProdUnits, setNewProdUnits, newProdFactor, setNewProdFactor, newProdMinAlert, setNewProdMinAlert, newProdBarcode, setNewProdBarcode, newProdFoto, setNewProdFoto, newProdSellMode, setNewProdSellMode, newProdPriceUnits, setNewProdPriceUnits, newSupName, setNewSupName, newSupNit, setNewSupNit, newSupPhone, setNewSupPhone, newSupWsp, setNewSupWsp, newLabName, setNewLabName, newCatName, setNewCatName, restockSupplierId, setRestockSupplierId, restockProductId, setRestockProductId, restockSkins, setRestockSkins, restockUnits, setRestockUnits, restockTotalUnits, setRestockTotalUnits, restockCost, setRestockCost, restockPrice, setRestockPrice, restockPriceUnits, setRestockPriceUnits, restockExp, setRestockExp, invoiceItems, setInvoiceItems, posSearchQuery, setPosSearchQuery, barcodeInput, setBarcodeInput, posCart, setPosCart, invoiceClientNit, setInvoiceClientNit, showInvoicePreview, setShowInvoicePreview, posAlertMessage, setPosAlertMessage, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, showHistoryModal, setShowHistoryModal, profileName, setProfileName, profileImage, setProfileImage, fetchInitialData, syncOfflineQueue, handleToggleOffline, handleLogin, handleRegister, handleLogout, handleCreateProduct, handleCreateSupplier, handleAddInvoiceItem, handleDeleteInvoiceItem, handleSaveFullInvoice, handleAddLab, handleAddCat, handleAddProductToCart, handleBarcodeSubmit, handleUpdateCartQty, handleRemoveFromCart, calculateCartTotals, handleCheckoutSale, handleAddExpense, handleFinalizeClosure, handleUpdateBusinessProfile, handleUpdatePersonalProfile, handleDownloadXLS, filteredProducts, totalInventoryCost, totalInventoryPriceValue, preseededBarcodes, restockSelectedProduct, isRestockProductAmbasMode, restockProductFactor } = useAppContext();

  return (
    <>
      {/* TAB CONTENT: REPORTES */}
            {activeTab === "reportes" && (
              <div className="space-y-6 text-slate-800">
                
                {/* Visual Cards reporting panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="bg-white rounded-xl border p-5 shadow-xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block">Valorización Total Categoria Costo Neto</span>
                      <strong className="text-3xl font-black text-slate-900 block mt-1">
                        ${totalInventoryCost.toLocaleString("es-CO")} COP
                      </strong>
                      <span className="text-xs text-slate-500 mt-1 block">Suma del costo base de fármacos en bodega</span>
                    </div>
                    <FileSpreadsheet className="w-12 h-12 text-teal-600/25 flex-shrink-0" />
                  </div>

                  <div className="bg-white rounded-xl border p-5 shadow-xs flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block">Expectativa Retorno Comercial</span>
                      <strong className="text-3xl font-black text-teal-700 block mt-1">
                        ${totalInventoryPriceValue.toLocaleString("es-CO")} COP
                      </strong>
                      <span className="text-xs text-slate-500 mt-1 block">Proyección del valor de venta final esperado</span>
                    </div>
                    <TrendingDown className="w-12 h-12 text-emerald-600/25 flex-shrink-0" />
                  </div>
                </div>

                {/* XLS interactive exporter widgets */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-none">Exportación De Informes Consolidados (.xls / CSV)</h3>
                    <p className="text-xs text-slate-500 mt-1">Descarga hojas de cálculo formateadas para excel con información en tiempo real para control de contabilidad externa.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-xs uppercase text-slate-400 tracking-wider">Módulo de Inventario Total</span>
                        <p className="text-[11px] text-slate-650 tracking-wide mt-1.5 leading-relaxed">
                          Exporta código de barras, laboratorio, fechas de expiración, existencias de sobres y pastillas sueltas, además del margen absoluto comercial.
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadXLS("inventario")}
                        className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 rounded text-xs flex items-center justify-center gap-1"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Descargar Inventario .xls</span>
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-xs uppercase text-slate-400 tracking-wider">Historial de Turnos de Caja</span>
                        <p className="text-[11px] text-slate-650 tracking-wide mt-1.5 leading-relaxed">
                          Exporta los flujos de entrada acumulados para contrastar pérdidas contra ingresos de la operación POS.
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadXLS("closures")}
                        className="mt-4 w-full bg-slate-950 hover:bg-slate-900 text-teal-300 font-bold py-1.5 rounded text-xs flex items-center justify-center gap-1"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Descargar Cierres .xls</span>
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-xs uppercase text-slate-400 tracking-wider">Bitácora de Ventas Realizadas</span>
                        <p className="text-[11px] text-slate-650 tracking-wide mt-1.5 leading-relaxed">
                          Relación de folios térmicos emitidos, cajero responsable en turno, nit de clientes asociados y sumatorias de ingresos diurnos.
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadXLS("sales")}
                        className="mt-4 w-full bg-slate-950 hover:bg-slate-900 text-teal-300 font-bold py-1.5 rounded text-xs flex items-center justify-center gap-1"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Descargar Facturación .xls</span>
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            )}
    </>
  );
}
