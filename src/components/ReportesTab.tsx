import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Package, FileText, TrendingDown, LineChart, FileSpreadsheet, Calendar, DollarSign, Clock, ListOrdered, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function ReportesTab() {
  const { 
    products, 
    sales, 
    closures, 
    activeTab, 
    totalInventoryCost, 
    totalInventoryPriceValue, 
    handleDownloadXLS 
  } = useAppContext();

  const [supplierInvoices, setSupplierInvoices] = React.useState<any[]>([]);
  const [reportsSubTab, setReportsSubTab] = React.useState<"day" | "month" | "year">("day");

  // Fetch supplier invoices history
  React.useEffect(() => {
    if (activeTab === "reportes") {
      fetch("/api/inventory/invoices/history")
        .then(r => r.json())
        .then(data => setSupplierInvoices(data))
        .catch(e => console.error("Error fetching supplier invoices:", e));
    }
  }, [activeTab, sales, closures]);

  // Bogota local timezone date helpers
  const getTodayBogotaStr = () => {
    const bogotaDate = new Date(new Date().getTime() - 5 * 60 * 60 * 1000);
    return bogotaDate.toISOString().split("T")[0];
  };

  const getSaleBogotaDate = (dateTimeStr: string) => {
    const d = new Date(dateTimeStr);
    const bogotaTime = new Date(d.getTime() - 5 * 60 * 60 * 1000);
    return bogotaTime.toISOString().split("T")[0];
  };

  // Helper to calculate cost of goods sold (COGS) for a specific sale
  const calculateSaleCost = (sale: any) => {
    let saleCost = 0;
    if (sale && Array.isArray(sale.items)) {
      sale.items.forEach((item: any) => {
        const p = products.find((prod: any) => prod.id === item.productId);
        if (p) {
          const factor = p.conversionFactor || 1;
          const skinsQty = Number(item.quantitySkins) || 0;
          const unitsQty = Number(item.quantityUnits) || 0;
          const unitCost = p.cost;
          saleCost += unitCost * (skinsQty + (factor > 1 ? (unitsQty / factor) : 0));
        }
      });
    }
    return Math.round(saleCost);
  };

  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const idx = parseInt(month, 10) - 1;
    return `${monthNames[idx] || month} ${year}`;
  };

  // 1. REPORTE DEL DÍA (TODAY)
  const todayStr = getTodayBogotaStr();
  const todaySales = sales.filter(s => getSaleBogotaDate(s.dateTime) === todayStr);
  const todaySalesRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const todayCOGS = todaySales.reduce((acc, s) => acc + calculateSaleCost(s), 0);

  const todayClosure = closures.find(c => c.date === todayStr);
  const todayExpenses = todayClosure ? todayClosure.totalExpenses : 0;
  const todayExpensesList = todayClosure ? (todayClosure.expenses || []) : [];
  const todayUtility = todaySalesRevenue - todayCOGS - todayExpenses;

  // 2. REPORTE DEL MES
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const monthDaysMap: { [date: string]: { sales: number; cogs: number; boxExpenses: number; supplierInvoices: number } } = {};

  sales.forEach(s => {
    const date = getSaleBogotaDate(s.dateTime);
    if (date.startsWith(currentMonthStr)) {
      if (!monthDaysMap[date]) monthDaysMap[date] = { sales: 0, cogs: 0, boxExpenses: 0, supplierInvoices: 0 };
      monthDaysMap[date].sales += s.total;
      monthDaysMap[date].cogs += calculateSaleCost(s);
    }
  });

  closures.forEach(c => {
    if (c.date && c.date.startsWith(currentMonthStr)) {
      if (!monthDaysMap[c.date]) monthDaysMap[c.date] = { sales: 0, cogs: 0, boxExpenses: 0, supplierInvoices: 0 };
      monthDaysMap[c.date].boxExpenses += c.totalExpenses || 0;
    }
  });

  supplierInvoices.forEach(inv => {
    if (inv.date && inv.date.startsWith(currentMonthStr)) {
      if (!monthDaysMap[inv.date]) monthDaysMap[inv.date] = { sales: 0, cogs: 0, boxExpenses: 0, supplierInvoices: 0 };
      monthDaysMap[inv.date].supplierInvoices += inv.totalCost || 0;
    }
  });

  const monthDays = Object.keys(monthDaysMap).sort((a, b) => b.localeCompare(a)).map(date => {
    const d = monthDaysMap[date];
    const utility = d.sales - d.cogs - d.boxExpenses - d.supplierInvoices;
    return { date, sales: d.sales, cogs: d.cogs, boxExpenses: d.boxExpenses, supplierInvoices: d.supplierInvoices, utility };
  });

  const mTotalSales = monthDays.reduce((acc, d) => acc + d.sales, 0);
  const mTotalCogs = monthDays.reduce((acc, d) => acc + d.cogs, 0);
  const mTotalBoxExpenses = monthDays.reduce((acc, d) => acc + d.boxExpenses, 0);
  const mTotalSupplierInvoices = monthDays.reduce((acc, d) => acc + d.supplierInvoices, 0);
  const mTotalUtility = mTotalSales - mTotalCogs - mTotalBoxExpenses - mTotalSupplierInvoices;

  // 3. REPORTE DEL AÑO
  const currentYearStr = todayStr.substring(0, 4); // YYYY
  const yearMonthsMap: { [month: string]: { sales: number; cogs: number; boxExpenses: number; supplierInvoices: number } } = {};

  sales.forEach(s => {
    const date = getSaleBogotaDate(s.dateTime);
    if (date.startsWith(currentYearStr)) {
      const month = date.substring(0, 7);
      if (!yearMonthsMap[month]) yearMonthsMap[month] = { sales: 0, cogs: 0, boxExpenses: 0, supplierInvoices: 0 };
      yearMonthsMap[month].sales += s.total;
      yearMonthsMap[month].cogs += calculateSaleCost(s);
    }
  });

  closures.forEach(c => {
    if (c.date && c.date.startsWith(currentYearStr)) {
      const month = c.date.substring(0, 7);
      if (!yearMonthsMap[month]) yearMonthsMap[month] = { sales: 0, cogs: 0, boxExpenses: 0, supplierInvoices: 0 };
      yearMonthsMap[month].boxExpenses += c.totalExpenses || 0;
    }
  });

  supplierInvoices.forEach(inv => {
    if (inv.date && inv.date.startsWith(currentYearStr)) {
      const month = inv.date.substring(0, 7);
      if (!yearMonthsMap[month]) yearMonthsMap[month] = { sales: 0, cogs: 0, boxExpenses: 0, supplierInvoices: 0 };
      yearMonthsMap[month].supplierInvoices += inv.totalCost || 0;
    }
  });

  const yearMonths = Object.keys(yearMonthsMap).sort((a, b) => b.localeCompare(a)).map(month => {
    const d = yearMonthsMap[month];
    const utility = d.sales - d.cogs - d.boxExpenses - d.supplierInvoices;
    return { month, sales: d.sales, cogs: d.cogs, boxExpenses: d.boxExpenses, supplierInvoices: d.supplierInvoices, utility };
  });

  const yTotalSales = yearMonths.reduce((acc, m) => acc + m.sales, 0);
  const yTotalCogs = yearMonths.reduce((acc, m) => acc + m.cogs, 0);
  const yTotalBoxExpenses = yearMonths.reduce((acc, m) => acc + m.boxExpenses, 0);
  const yTotalSupplierInvoices = yearMonths.reduce((acc, m) => acc + m.supplierInvoices, 0);
  const yTotalUtility = yTotalSales - yTotalCogs - yTotalBoxExpenses - yTotalSupplierInvoices;

  return (
    <>
      {activeTab === "reportes" && (
        <div className="space-y-6 text-slate-800 animate-fade-in">
          
          {/* HEADER AND SUB-TAB NAVIGATION */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Auditoría Financiera y Reportes</h2>
              <p className="text-xs text-slate-500 mt-1">Monitorea y exporta el balance diario, mensual y anual de utilidad neta y egresos.</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full md:w-auto">
              <button
                onClick={() => setReportsSubTab("day")}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  reportsSubTab === "day"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Reporte del Día</span>
              </button>
              <button
                onClick={() => setReportsSubTab("month")}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  reportsSubTab === "month"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reporte del Mes</span>
              </button>
              <button
                onClick={() => setReportsSubTab("year")}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  reportsSubTab === "year"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Reporte del Año</span>
              </button>
            </div>
          </div>

          {/* MAIN MODULE CONTENT */}
          
          {/* TAB 1: REPORTE DEL DÍA */}
          {reportsSubTab === "day" && (
            <div className="space-y-6">
              {/* Day Cards stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block">Ventas de Hoy</span>
                  <strong className="text-xl font-black text-slate-900 block mt-1">
                    ${todaySalesRevenue.toLocaleString("es-CO")} COP
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-1">{todaySales.length} ventas realizadas</span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block">Costo de lo Vendido</span>
                  <strong className="text-xl font-black text-slate-700 block mt-1">
                    ${todayCOGS.toLocaleString("es-CO")} COP
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-1">Costo neto de fármacos vendidos</span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block">Gastos de Caja</span>
                  <strong className="text-xl font-black text-rose-700 block mt-1">
                    -${todayExpenses.toLocaleString("es-CO")} COP
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-1">{todayExpensesList.length} egresos manuales</span>
                </div>

                <div className={`rounded-xl p-4 shadow-xs text-white ${todayUtility >= 0 ? 'bg-teal-900' : 'bg-rose-900'}`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">Utilidad Neta Hoy</span>
                  <strong className="text-xl font-black block mt-1">
                    ${todayUtility.toLocaleString("es-CO")} COP
                  </strong>
                  <span className="text-[10px] block mt-1 font-medium flex items-center gap-0.5">
                    {todayUtility >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>Ganancia operativa neta</span>
                  </span>
                </div>
              </div>

              {/* Day Lists Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Sales List Table */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-teal-600" />
                    <span>Detalle de Ventas de Hoy</span>
                  </h3>
                  
                  <div className="overflow-x-auto max-h-80 overflow-y-auto border rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase tracking-wider text-[9px] sticky top-0">
                        <tr>
                          <th className="p-2.5">Hora</th>
                          <th className="p-2.5">Factura</th>
                          <th className="p-2.5 text-right">Venta</th>
                          <th className="p-2.5 text-right">Costo</th>
                          <th className="p-2.5 text-right">Utilidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono text-[10px]">
                        {todaySales.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic">No se han registrado ventas hoy.</td>
                          </tr>
                        ) : (
                          todaySales.map(s => {
                            const cogs = calculateSaleCost(s);
                            const profit = s.total - cogs;
                            return (
                              <tr key={s.id} className="hover:bg-slate-50">
                                <td className="p-2.5 text-slate-500">
                                  {new Date(s.dateTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </td>
                                <td className="p-2.5 font-bold text-slate-900">{s.invoiceNumber}</td>
                                <td className="p-2.5 text-right font-bold text-emerald-800">${s.total.toLocaleString()}</td>
                                <td className="p-2.5 text-right text-slate-500">${cogs.toLocaleString()}</td>
                                <td className={`p-2.5 text-right font-bold ${profit >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
                                  ${profit.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Expenses List Table */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>Detalle de Egresos de Caja de Hoy</span>
                  </h3>
                  
                  <div className="overflow-x-auto max-h-80 overflow-y-auto border rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase tracking-wider text-[9px] sticky top-0">
                        <tr>
                          <th className="p-2.5">Hora</th>
                          <th className="p-2.5">Descripción</th>
                          <th className="p-2.5 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono text-[10px]">
                        {todayExpensesList.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-slate-400 italic">No se han registrado egresos de caja hoy.</td>
                          </tr>
                        ) : (
                          todayExpensesList.map((exp: any) => (
                            <tr key={exp.id} className="hover:bg-slate-50">
                              <td className="p-2.5 text-slate-500 font-medium">
                                {new Date(exp.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </td>
                              <td className="p-2.5 text-slate-900 font-bold uppercase">{exp.description}</td>
                              <td className="p-2.5 text-right font-bold text-rose-700">-${exp.amount.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: REPORTE DEL MES */}
          {reportsSubTab === "month" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Desglose Diario de {formatMonthName(currentMonthStr)}</span>
              </h3>
              
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3 text-right">Ventas Totales (+)</th>
                      <th className="p-3 text-right">Costo de lo Vendido (-)</th>
                      <th className="p-3 text-right">Egresos Caja (-)</th>
                      <th className="p-3 text-right">Facturas Proveedor (-)</th>
                      <th className="p-3 text-right">Utilidad Neta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono text-[10.5px]">
                    {monthDays.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">Sin transacciones registradas este mes.</td>
                      </tr>
                    ) : (
                      monthDays.map(d => (
                        <tr key={d.date} className="hover:bg-slate-50 font-medium">
                          <td className="p-3 font-bold text-slate-900">{d.date}</td>
                          <td className="p-3 text-right text-emerald-800 font-bold">+${d.sales.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-500">${d.cogs.toLocaleString()}</td>
                          <td className="p-3 text-right text-rose-700">-${d.boxExpenses.toLocaleString()}</td>
                          <td className="p-3 text-right text-amber-700 font-bold">
                            {d.supplierInvoices > 0 ? `-$${d.supplierInvoices.toLocaleString()}` : "$0"}
                          </td>
                          <td className={`p-3 text-right font-extrabold ${d.utility >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
                            ${d.utility.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {monthDays.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold font-mono text-xs border-t-2 border-slate-200">
                      <tr className="text-slate-900">
                        <td className="p-3">TOTALES</td>
                        <td className="p-3 text-right text-emerald-950 font-extrabold">+${mTotalSales.toLocaleString()}</td>
                        <td className="p-3 text-right">${mTotalCogs.toLocaleString()}</td>
                        <td className="p-3 text-right text-rose-800">-${mTotalBoxExpenses.toLocaleString()}</td>
                        <td className="p-3 text-right text-amber-800">-${mTotalSupplierInvoices.toLocaleString()}</td>
                        <td className={`p-3 text-right font-black text-sm ${mTotalUtility >= 0 ? 'text-teal-850' : 'text-rose-850'}`}>
                          ${mTotalUtility.toLocaleString()} COP
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: REPORTE DEL AÑO */}
          {reportsSubTab === "year" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                <LineChart className="w-4 h-4 text-teal-600" />
                <span>Desglose Mensual del Año {currentYearStr}</span>
              </h3>
              
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                    <tr>
                      <th className="p-3">Mes</th>
                      <th className="p-3 text-right">Ventas Totales (+)</th>
                      <th className="p-3 text-right">Costo de lo Vendido (-)</th>
                      <th className="p-3 text-right">Egresos Caja (-)</th>
                      <th className="p-3 text-right">Facturas Proveedor (-)</th>
                      <th className="p-3 text-right">Utilidad Neta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono text-[10.5px]">
                    {yearMonths.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">Sin transacciones registradas este año.</td>
                      </tr>
                    ) : (
                      yearMonths.map(m => (
                        <tr key={m.month} className="hover:bg-slate-50 font-medium">
                          <td className="p-3 font-bold text-slate-900">{formatMonthName(m.month)}</td>
                          <td className="p-3 text-right text-emerald-800 font-bold">+${m.sales.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-500">${m.cogs.toLocaleString()}</td>
                          <td className="p-3 text-right text-rose-700">-${m.boxExpenses.toLocaleString()}</td>
                          <td className="p-3 text-right text-amber-700 font-bold">
                            {m.supplierInvoices > 0 ? `-$${m.supplierInvoices.toLocaleString()}` : "$0"}
                          </td>
                          <td className={`p-3 text-right font-extrabold ${m.utility >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
                            ${m.utility.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {yearMonths.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold font-mono text-xs border-t-2 border-slate-200">
                      <tr className="text-slate-900">
                        <td className="p-3">TOTALES</td>
                        <td className="p-3 text-right text-emerald-950 font-extrabold">+${yTotalSales.toLocaleString()}</td>
                        <td className="p-3 text-right">${yTotalCogs.toLocaleString()}</td>
                        <td className="p-3 text-right text-rose-800">-${yTotalBoxExpenses.toLocaleString()}</td>
                        <td className="p-3 text-right text-amber-800">-${yTotalSupplierInvoices.toLocaleString()}</td>
                        <td className={`p-3 text-right font-black text-sm ${yTotalUtility >= 0 ? 'text-teal-850' : 'text-rose-850'}`}>
                          ${yTotalUtility.toLocaleString()} COP
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* XLS INTERACTIVE EXPORTERS WIDGETS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Exportación De Informes Consolidados (.xls / CSV)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleDownloadXLS("inventario")}
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Inventario .xls</span>
              </button>

              <button
                onClick={() => handleDownloadXLS("closures")}
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Cierres .xls</span>
              </button>

              <button
                onClick={() => handleDownloadXLS("sales")}
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Facturación .xls</span>
              </button>
            </div>
          </div>

          {/* COMPACT FOOTER: INVENTORY VALUATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex justify-between items-center gap-3">
              <div>
                <span className="text-[9.5px] uppercase font-bold tracking-wider text-slate-450 block">Valorización Inventario (Costo Neto)</span>
                <strong className="text-xl font-black text-slate-900 block mt-0.5">
                  ${totalInventoryCost.toLocaleString("es-CO")} COP
                </strong>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Suma del costo base de fármacos en bodega</span>
              </div>
              <Package className="w-9 h-9 text-teal-600/20 flex-shrink-0" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex justify-between items-center gap-3">
              <div>
                <span className="text-[9.5px] uppercase font-bold tracking-wider text-slate-450 block">Retorno Comercial Esperado</span>
                <strong className="text-xl font-black text-teal-700 block mt-0.5">
                  ${totalInventoryPriceValue.toLocaleString("es-CO")} COP
                </strong>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Proyección de valor de venta final esperado</span>
              </div>
              <TrendingDown className="w-9 h-9 text-emerald-600/20 flex-shrink-0" />
            </div>
          </div>

        </div>
      )}
    </>
  );
}
