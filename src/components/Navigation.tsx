import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Package, FileText, TrendingDown, LineChart, Settings } from 'lucide-react';

export default function Navigation() {
  const { currentUser, activeTab, setActiveTab } = useAppContext();

  if (!currentUser) return null;

  return (
    <nav className="sticky top-[65px] md:top-[73px] z-30 bg-white border-b border-slate-200 py-1 md:py-1.5 px-2 md:px-8 w-full shadow-3xs">
      <div className="max-w-7xl mx-auto grid grid-cols-5 md:flex md:flex-wrap items-center gap-1 md:gap-1.5 w-full">
        
        {/* Pestaña: Inventario */}
        <button
          onClick={() => {
            if (currentUser.role !== 'admin') {
              alert("El inventario y administración general de productos es de manejo exclusivo para el Administrador.");
              return;
            }
            setActiveTab("inventario");
          }}
          className={`w-full md:w-auto py-1.5 md:px-3 md:py-1.5 rounded-lg font-bold text-center flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 border transition-all ${
            activeTab === "inventario"
              ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
              : currentUser.role !== 'admin'
                ? "bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed"
                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
          }`}
        >
          <Package className="w-4 h-4 md:w-3.5 md:h-3.5" />
          <span className="text-[9px] md:text-xs block whitespace-nowrap">
            <span className="inline md:hidden">Inv.</span>
            <span className="hidden md:inline">Inventario {currentUser.role !== 'admin' && '🔒'}</span>
          </span>
        </button>

        {/* Pestaña: Facturación */}
        <button
          onClick={() => setActiveTab("facturacion")}
          className={`w-full md:w-auto py-1.5 md:px-3 md:py-1.5 rounded-lg font-bold text-center flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 border transition-all ${
            activeTab === "facturacion"
              ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4 md:w-3.5 md:h-3.5" />
          <span className="text-[9px] md:text-xs block whitespace-nowrap">
            <span className="inline md:hidden">Fact.</span>
            <span className="hidden md:inline">Facturación (POS)</span>
          </span>
        </button>

        {/* Pestaña: Cierre Caja */}
        <button
          onClick={() => setActiveTab("cierre")}
          className={`w-full md:w-auto py-1.5 md:px-3 md:py-1.5 rounded-lg font-bold text-center flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 border transition-all ${
            activeTab === "cierre"
              ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
          }`}
        >
          <TrendingDown className="w-4 h-4 md:w-3.5 md:h-3.5" />
          <span className="text-[9px] md:text-xs block whitespace-nowrap">
            <span className="inline md:hidden">Cierre</span>
            <span className="hidden md:inline">Cierre Caja</span>
          </span>
        </button>

        {/* Pestaña: Reportes */}
        <button
          onClick={() => setActiveTab("reportes")}
          className={`w-full md:w-auto py-1.5 md:px-3 md:py-1.5 rounded-lg font-bold text-center flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 border transition-all ${
            activeTab === "reportes"
              ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
          }`}
        >
          <LineChart className="w-4 h-4 md:w-3.5 md:h-3.5" />
          <span className="text-[9px] md:text-xs block whitespace-nowrap">
            <span className="inline md:hidden">Rep.</span>
            <span className="hidden md:inline">Reportes</span>
          </span>
        </button>

        {/* Pestaña: Perfil y Negocio */}
        <button
          onClick={() => setActiveTab("perfil")}
          className={`w-full md:w-auto py-1.5 md:px-3 md:py-1.5 rounded-lg font-bold text-center flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 border transition-all ${
            activeTab === "perfil"
              ? "bg-slate-950 border-slate-950 text-white shadow-3xs"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
          }`}
        >
          <Settings className="w-4 h-4 md:w-3.5 md:h-3.5" />
          <span className="text-[9px] md:text-xs block whitespace-nowrap">
            <span className="inline md:hidden">Perfil</span>
            <span className="hidden md:inline">Perfil y Negocio</span>
          </span>
        </button>

      </div>
    </nav>
  );
}
