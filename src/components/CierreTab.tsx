import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Package, FileText, TrendingDown, LineChart, User, Settings, Plus, Search, AlertCircle, FileSpreadsheet, Building, CheckCircle, Trash2, Barcode, Printer, X, CreditCard, UserCheck, LogOut, Wifi, WifiOff, RefreshCw, PlusCircle, Info } from 'lucide-react';
import TechAdvisory from './TechAdvisory';

export default function CierreTab() {
  const { isOffline, setIsOffline, offlineQueue, setOfflineQueue, syncLogs, setSyncLogs, isSyncing, setIsSyncing, currentUser, setCurrentUser, authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, registerName, setRegisterName, registerEmail, setRegisterEmail, registerPassword, setRegisterPassword, registerRole, setRegisterRole, authError, setAuthError, authSuccess, setAuthSuccess, business, setBusiness, products, setProducts, suppliers, setSuppliers, laboratories, setLaboratories, categories, setCategories, sales, setSales, closures, setClosures, activeClosure, setActiveClosure, activeTab, setActiveTab, showTechAdvisory, setShowTechAdvisory, inventoryFormMode, setInventoryFormMode, manageSubTab, setManageSubTab, prodSearchQuery, setProdSearchQuery, prodCategoryFilter, setProdCategoryFilter, newProdName, setNewProdName, newProdExp, setNewProdExp, newProdLab, setNewProdLab, newProdCost, setNewProdCost, newProdPrice, setNewProdPrice, newProdCategory, setNewProdCategory, newProdSkins, setNewProdSkins, newProdUnits, setNewProdUnits, newProdFactor, setNewProdFactor, newProdMinAlert, setNewProdMinAlert, newProdBarcode, setNewProdBarcode, newProdFoto, setNewProdFoto, newProdSellMode, setNewProdSellMode, newProdPriceUnits, setNewProdPriceUnits, newSupName, setNewSupName, newSupNit, setNewSupNit, newSupPhone, setNewSupPhone, newSupWsp, setNewSupWsp, newLabName, setNewLabName, newCatName, setNewCatName, restockSupplierId, setRestockSupplierId, restockProductId, setRestockProductId, restockSkins, setRestockSkins, restockUnits, setRestockUnits, restockTotalUnits, setRestockTotalUnits, restockCost, setRestockCost, restockPrice, setRestockPrice, restockPriceUnits, setRestockPriceUnits, restockExp, setRestockExp, invoiceItems, setInvoiceItems, posSearchQuery, setPosSearchQuery, barcodeInput, setBarcodeInput, posCart, setPosCart, invoiceClientNit, setInvoiceClientNit, showInvoicePreview, setShowInvoicePreview, posAlertMessage, setPosAlertMessage, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, showHistoryModal, setShowHistoryModal, profileName, setProfileName, profileImage, setProfileImage, fetchInitialData, syncOfflineQueue, handleToggleOffline, handleLogin, handleRegister, handleLogout, handleCreateProduct, handleCreateSupplier, handleAddInvoiceItem, handleDeleteInvoiceItem, handleSaveFullInvoice, handleAddLab, handleAddCat, handleAddProductToCart, handleBarcodeSubmit, handleUpdateCartQty, handleRemoveFromCart, calculateCartTotals, handleCheckoutSale, handleAddExpense, handleFinalizeClosure, handleUpdateBusinessProfile, handleUpdatePersonalProfile, handleDownloadXLS, filteredProducts, totalInventoryCost, totalInventoryPriceValue, preseededBarcodes, restockSelectedProduct, isRestockProductAmbasMode, restockProductFactor } = useAppContext();

  const [historySubTab, setHistorySubTab] = React.useState<"daily" | "monthly">("daily");

  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const idx = parseInt(month, 10) - 1;
    return `${monthNames[idx] || month} ${year}`;
  };

  const getMonthlySummaries = () => {
    const groups: { [key: string]: { month: string; salesRevenue: number; expenses: number; netCash: number; dayCount: number } } = {};
    
    closures.forEach(cl => {
      if (!cl.date) return;
      const monthKey = cl.date.substring(0, 7); // "YYYY-MM"
      if (!groups[monthKey]) {
        groups[monthKey] = {
          month: monthKey,
          salesRevenue: 0,
          expenses: 0,
          netCash: 0,
          dayCount: 0
        };
      }
      groups[monthKey].salesRevenue += cl.totalSalesRevenue || 0;
      groups[monthKey].expenses += cl.totalExpenses || 0;
      groups[monthKey].netCash += (cl.totalSalesRevenue || 0) - (cl.totalExpenses || 0);
      groups[monthKey].dayCount += 1;
    });
    
    return Object.values(groups).sort((a, b) => b.month.localeCompare(a.month));
  };

  return (
    <>
      {/* TAB CONTENT: CIERRE */}
            {activeTab === "cierre" && (
              <div className="space-y-6 text-slate-800">
                
                {/* Closure Header stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border p-5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block">Monto Total de Ventas</span>
                    <strong className="text-2xl font-black text-slate-900 block mt-1">
                      ${activeClosure.totalSalesRevenue.toLocaleString("es-CO")} COP
                    </strong>
                    <span className="text-[10.5px] text-slate-500 block mt-1.5">{activeClosure.totalSalesCount} transacciones en mostrador</span>
                  </div>

                  <div className="bg-white rounded-xl border p-5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block">Gastos Registrados (Deducción)</span>
                    <strong className="text-2xl font-black text-rose-700 block mt-1">
                      -${activeClosure.totalExpenses.toLocaleString("es-CO")} COP
                    </strong>
                    <span className="text-[10.5px] text-slate-500 block mt-1.5">{activeClosure.expenses.length} ítems de egresos</span>
                  </div>

                  <div className="bg-white rounded-xl border p-5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block">Base Operativa (Fondo de caja)</span>
                    <strong className="text-2xl font-black text-slate-900 block mt-1">
                      ${activeClosure.initialCash.toLocaleString("es-CO")} COP
                    </strong>
                    <span className="text-[10.5px] text-slate-500 block mt-1.5">Efectivo inicial estandarizado</span>
                  </div>

                  <div className="bg-teal-900 rounded-xl p-5 shadow-xs text-white">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 block">Flujo de Caja Real Neto</span>
                    <strong className="text-2xl font-black block mt-1">
                      ${activeClosure.finalCash.toLocaleString("es-CO")} COP
                    </strong>
                    <span className="text-[10.5px] text-teal-100/70 block mt-1.5">Balance de arqueo de caja</span>
                  </div>
                </div>

                {/* Sub-panels for history modal and Register expense form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Expense formulation registered */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-950 text-base leading-none">Registrar Gasto de Caja Diaria</h3>
                      <p className="text-[11px] text-slate-550 mt-1 mb-4">Adicione egresos debidamente justificados (bolsas plásticas, tinto, servicios básicos, papelería) para el balance de arqueo.</p>
                      
                      <form onSubmit={handleAddExpense} className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Descripción de Gasto *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Compra de bolsas biodegradables"
                            value={expenseDesc}
                            onChange={(e) => setExpenseDesc(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Monto en Pesos ($ COP) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Monto gastado"
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-bold"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 border border-slate-850 text-white font-semibold py-2 rounded-lg text-xs"
                        >
                          Adicionar Gasto y Restar de Flujo
                        </button>
                      </form>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <button
                        onClick={() => setShowHistoryModal(true)}
                        className="w-full px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                      >
                        Ver Historial de Cierres Consolidados
                      </button>
                    </div>
                  </div>

                  {/* ACTIVE EXPENSE TRACKING LOG AND SHIFT CLOSE OUT */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b pb-2 mb-4">
                        <span className="font-bold text-xs uppercase text-slate-400 tracking-wider">Libro Auxiliar de Egresos Hoy</span>
                        <span className="text-[10px] font-mono text-slate-500">{activeClosure.date}</span>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {activeClosure.expenses.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-xs italic">
                            No se han registrado gastos en el turno actual.
                          </div>
                        ) : (
                          activeClosure.expenses.map((exp: any) => (
                            <div key={exp.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded border text-xs">
                              <div>
                                <strong className="text-slate-900">{exp.description}</strong>
                                <span className="block text-[10px] text-slate-400">{new Date(exp.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <span className="text-rose-700 font-bold">-${exp.amount.toLocaleString()} COP</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <span className="block text-[11px] text-slate-500 text-center">Una vez realizado el cierre final, la caja de mostrador se re-inicia con la base autorizada de $120.000 COP</span>
                      <button
                        onClick={handleFinalizeClosure}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-xs font-bold shadow-sm"
                      >
                        Consolidar Cierre Financiero del Día
                      </button>
                    </div>

                  </div>

                </div>

                {/* MODAL HISTORICO DE MESES PASADOS Y CIERRES COMPLETADOS */}
                {showHistoryModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[550px] flex flex-col text-slate-800">
                      
                      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                        <h4 className="font-bold text-sm">Historial General de Cierres Financieros Consolidados</h4>
                        <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-6 overflow-y-auto space-y-4 flex-1">
                        <p className="text-xs text-slate-505 leading-relaxed">
                          La siguiente tabla almacena las trazas financieras concluidas e indexadas. Estos cierres evitan la alteración diurna de deudas a proveedores.
                        </p>

                        <div className="flex gap-2 border-b pb-2 mb-4">
                          <button
                            type="button"
                            onClick={() => setHistorySubTab("daily")}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              historySubTab === "daily"
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-650 hover:bg-slate-100"
                            }`}
                          >
                            Cierres Diarios
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistorySubTab("monthly")}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              historySubTab === "monthly"
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-650 hover:bg-slate-100"
                            }`}
                          >
                            Resumen Mensual
                          </button>
                        </div>

                        {historySubTab === "daily" ? (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                                <tr>
                                  <th className="p-2.5">Fecha Cierre</th>
                                  <th className="p-2.5">Ventas Registradas</th>
                                  <th className="p-2.5">Gastos Deducidos</th>
                                  <th className="p-2.5">Fondo Inicial</th>
                                  <th className="p-2.5">Arqueo Neto</th>
                                  <th className="p-2.5">Estado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y font-mono text-[10.5px]">
                                {closures.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="p-4 text-center text-slate-400">Sin historial en base local</td>
                                  </tr>
                                ) : (
                                  closures.map((cl) => (
                                    <tr key={cl.id} className="hover:bg-slate-50 font-medium">
                                      <td className="p-2.5 font-bold text-slate-900">{cl.date}</td>
                                      <td className="p-2.5 text-emerald-700">+${cl.totalSalesRevenue.toLocaleString()}</td>
                                      <td className="p-2.5 text-rose-700">-${cl.totalExpenses.toLocaleString()}</td>
                                      <td className="p-2.5 text-slate-500">${cl.initialCash.toLocaleString()}</td>
                                      <td className="p-2.5 text-slate-900 font-bold">${cl.finalCash.toLocaleString()}</td>
                                      <td className="p-2.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                          cl.isClosed ? 'bg-slate-100 text-slate-700 border' : 'bg-amber-50 text-amber-800 border'
                                        }`}>
                                          {cl.isClosed ? 'Consolidado' : 'Abierto'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                                <tr>
                                  <th className="p-2.5">Mes / Año</th>
                                  <th className="p-2.5">Días Consolidados</th>
                                  <th className="p-2.5">Ventas Totales</th>
                                  <th className="p-2.5">Gastos Totales</th>
                                  <th className="p-2.5">Flujo Neto Real</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y font-mono text-[10.5px]">
                                {getMonthlySummaries().length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="p-4 text-center text-slate-400">Sin historial en base local</td>
                                  </tr>
                                ) : (
                                  getMonthlySummaries().map((m) => (
                                    <tr key={m.month} className="hover:bg-slate-50 font-medium">
                                      <td className="p-2.5 font-bold text-slate-900">{formatMonthName(m.month)}</td>
                                      <td className="p-2.5 text-slate-650">{m.dayCount} {m.dayCount === 1 ? 'día' : 'días'}</td>
                                      <td className="p-2.5 text-emerald-700 font-bold">+${m.salesRevenue.toLocaleString()}</td>
                                      <td className="p-2.5 text-rose-700">-${m.expenses.toLocaleString()}</td>
                                      <td className="p-2.5 text-teal-800 font-extrabold">${m.netCash.toLocaleString()}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 border-t text-right">
                        <button onClick={() => setShowHistoryModal(false)} className="px-4 py-1.5 border hover:bg-slate-100 rounded text-xs">
                          Cerrar Vista
                        </button>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            )}
    </>
  );
}
