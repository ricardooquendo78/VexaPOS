import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Package, FileText, TrendingDown, LineChart, Settings } from 'lucide-react';

export default function Navigation() {
  const { currentUser, activeTab, setActiveTab } = useAppContext();

  if (!currentUser) return null;

  return (
    <nav className="sticky top-[65px] md:top-[73px] z-30 bg-white border-b border-slate-200 py-1.5 px-4 md:px-8 w-full shadow-3xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => {
            if (currentUser.role !== 'admin') {
              alert("El inventario y administración general de productos es de manejo exclusivo para el Administrador.");
              return;
            }
            setActiveTab("inventario");
          }}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border ${
            activeTab === "inventario"
              ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
              : currentUser.role !== 'admin'
                ? "bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed"
                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Inventario {currentUser.role !== 'admin' && '🔒'}</span>
        </button>

        <button
          onClick={() => setActiveTab("facturacion")}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border ${
            activeTab === "facturacion"
              ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Facturación (POS)</span>
        </button>

        <button
          onClick={() => setActiveTab("cierre")}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border ${
            activeTab === "cierre"
              ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Cierre Caja</span>
        </button>

        <button
          onClick={() => setActiveTab("reportes")}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border ${
            activeTab === "reportes"
              ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>Reportes</span>
        </button>

        <button
          onClick={() => setActiveTab("perfil")}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border ${
            activeTab === "perfil"
              ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Perfil y Negocio</span>
        </button>
      </div>
    </nav>
  );
}
