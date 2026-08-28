import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Printer, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  X,
  Clock,
  HardDrive,
  Filter,
  FileCheck
} from 'lucide-react';
import { DocumentItem } from '../types';

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-camara-dg",
    title: "Cámara de Comercio - Droguería Gratamira",
    category: "mercantil",
    categoryLabel: "Legal / Mercantil",
    description: "Certificado de existencia, representación legal y matrícula mercantil vigente de Droguería Gratamira.",
    fileName: "Camara_de_Comercio_DG.pdf",
    fileUrl: "/documents/camara-comercio-dg.pdf",
    fileSize: "278 KB",
    lastUpdated: "2026",
    iconType: "certificate"
  },
  {
    id: "doc-camara-map",
    title: "Cámara de Comercio - MAP",
    category: "mercantil",
    categoryLabel: "Legal / Mercantil",
    description: "Certificado de matrícula mercantil y registro de establecimiento de comercio adicional / MAP.",
    fileName: "Camara_de_Comercio_MAP.pdf",
    fileUrl: "/documents/camara-comercio-map.pdf",
    fileSize: "1.9 MB",
    lastUpdated: "2026",
    iconType: "certificate"
  },
  {
    id: "doc-ica-dg",
    title: "Industria y Comercio (ICA) - Droguería Gratamira",
    category: "tributario",
    categoryLabel: "Tributario / Municipal",
    description: "Registro y declaración del Impuesto de Industria y Comercio (ICA) distrital/municipal al día.",
    fileName: "Industria_y_Comercio_DG.pdf",
    fileUrl: "/documents/industria-comercio-dg.pdf",
    fileSize: "50 KB",
    lastUpdated: "2026",
    iconType: "tax"
  },
  {
    id: "doc-sgc-dg",
    title: "Sistema de Gestión de Calidad (SGC) - Droguería Gratamira",
    category: "sgc",
    categoryLabel: "Calidad & SGC (Sanitario)",
    description: "Manual integral de Calidad, Procedimientos Operativos Estandarizados (POE), buenas prácticas de dispensación, control de devoluciones y farmacovigilancia.",
    fileName: "SGC_Drogueria_Gratamira.pdf",
    fileUrl: "/documents/sgc-drogueria-gratamira.pdf",
    fileSize: "5.4 MB",
    lastUpdated: "2026",
    iconType: "quality"
  }
];

export default function DocumentosTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [fullscreenDoc, setFullscreenDoc] = useState<DocumentItem | null>(null);

  const filteredDocs = useMemo(() => {
    return INITIAL_DOCUMENTS.filter(doc => {
      const matchCategory = selectedCategory === "all" || doc.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        doc.title.toLowerCase().includes(q) || 
        doc.description.toLowerCase().includes(q) ||
        doc.categoryLabel.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  const togglePreview = (id: string) => {
    setExpandedDocId(prev => (prev === id ? null : id));
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "mercantil":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "tributario":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "sgc":
        return "bg-teal-50 text-teal-700 border-teal-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getDocIcon = (iconType: string) => {
    switch (iconType) {
      case "certificate":
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case "tax":
        return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
      case "quality":
        return <ShieldCheck className="w-5 h-5 text-teal-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-xs font-semibold text-teal-300">
              <FileCheck className="w-3.5 h-3.5" />
              Expediente Normativo y Regulatorio
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Documentos y Registros Oficiales
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Repositorio centralizado de certificados mercantiles, declaraciones tributarias y el Sistema de Gestión de Calidad (SGC) listos para auditorías sanitarias y consultas administrativas.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 items-start md:items-end justify-start">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-2 rounded-xl text-center">
              <span className="text-[11px] uppercase tracking-wider text-teal-200 block font-medium">Documentos Activos</span>
              <span className="text-xl font-bold text-white">4 Archivos PDF</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verificados y Vigentes</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-teal-500 text-white shadow-xs"
                  : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Todos ({INITIAL_DOCUMENTS.length})
            </button>
            <button
              onClick={() => setSelectedCategory("mercantil")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === "mercantil"
                  ? "bg-blue-500 text-white shadow-xs"
                  : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Mercantil / Legal (2)
            </button>
            <button
              onClick={() => setSelectedCategory("tributario")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === "tributario"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Tributario (1)
            </button>
            <button
              onClick={() => setSelectedCategory("sgc")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === "sgc"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Calidad SGC (1)
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título o contenido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No se encontraron documentos</h3>
            <p className="text-xs text-slate-500 mt-1">Intenta con otro término de búsqueda o cambia la categoría seleccionada.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Ver todos los documentos
            </button>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isExpanded = expandedDocId === doc.id;
            return (
              <div 
                key={doc.id}
                className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  isExpanded ? "border-teal-500 ring-2 ring-teal-500/20" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                {/* Document Main Card */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left info */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 mt-0.5">
                      {getDocIcon(doc.iconType)}
                    </div>
                    
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-950 leading-snug">
                          {doc.title}
                        </h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadge(doc.category)}`}>
                          {doc.categoryLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {doc.description}
                      </p>
                      
                      {/* Metadata Chips */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-mono">
                          <HardDrive className="w-3 h-3 text-slate-400" />
                          {doc.fileSize}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Vigencia: {doc.lastUpdated}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 font-mono text-[10.5px]">
                          {doc.fileName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                    
                    {/* Botón: Vista Previa Desplegable */}
                    <button
                      onClick={() => togglePreview(doc.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isExpanded
                          ? "bg-teal-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700 border border-slate-200"
                      }`}
                      title={isExpanded ? "Ocultar vista previa" : "Ver vista previa desplegable"}
                    >
                      {isExpanded ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span>Ocultar Vista</span>
                          <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Vista Previa</span>
                          <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                        </>
                      )}
                    </button>

                    {/* Botón: Descargar PDF */}
                    <a
                      href={doc.fileUrl}
                      download={doc.fileName}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="Descargar archivo PDF al computador"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar</span>
                    </a>

                    {/* Botón: Abrir en pestaña / Imprimir */}
                    <button
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      className="p-2 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                      title="Abrir en pestaña completa / Imprimir"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vista Previa Desplegable (Accordion Panel) */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-950 p-3 sm:p-5">
                    <div className="flex items-center justify-between pb-3 text-white border-b border-slate-800 mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-semibold text-slate-200">
                          Visor Interactivo: {doc.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFullscreenDoc(doc)}
                          className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-700 transition-all cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Pantalla Completa
                        </button>
                        <button
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          className="flex items-center gap-1 text-[11px] bg-teal-700 hover:bg-teal-600 text-white px-2.5 py-1 rounded transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir
                        </button>
                      </div>
                    </div>

                    {/* Embedded Viewer Container */}
                    <div className="relative w-full h-[550px] md:h-[650px] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-inner">
                      <iframe
                        src={`${doc.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                        className="w-full h-full border-0"
                        title={`Vista previa de ${doc.title}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Pantalla Completa */}
      {fullscreenDoc && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 text-white">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-bold text-white">{fullscreenDoc.title}</h3>
                <p className="text-[11px] text-slate-400">{fullscreenDoc.fileName} • {fullscreenDoc.fileSize}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={fullscreenDoc.fileUrl}
                download={fullscreenDoc.fileName}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar
              </a>
              <button
                onClick={() => setFullscreenDoc(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Cerrar pantalla completa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full p-2 md:p-4 bg-slate-950">
            <iframe
              src={`${fullscreenDoc.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full rounded-lg border border-slate-800 bg-white"
              title={fullscreenDoc.title}
            />
          </div>
        </div>
      )}
    </div>
  );
}
