import React, { useState } from "react";
import { BookOpen, AlertTriangle, RefreshCw, Cpu, Server, Database, Smartphone, CheckCircle, HelpCircle, Layers, Award } from "lucide-react";

export default function TechAdvisory() {
  const [activeTab, setActiveTab] = useState<"architecture" | "sync" | "blindspots">("architecture");

  return (
    <div id="tech-advisory" className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-xs font-semibold text-teal-300 mb-2">
              <Award className="w-3.5 h-3.5" />
              Arquitecto de Software Senior & Consultor Tech
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Guía de Estrategia Arquitectónica y Viabilidad
            </h2>
            <p className="text-teal-100/80 text-sm mt-1 max-w-2xl">
              Análisis de pilas tecnológicas, consistencia Offline-First y controles críticos para el ecosistema de Vexa POS.
            </p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-lg p-3 text-right">
            <span className="text-xs text-slate-400 block">Cliente Objetivo:</span>
            <span className="font-semibold text-white text-sm">Vexa POS</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/10 mt-6 gap-2">
          <button
            onClick={() => setActiveTab("architecture")}
            className={`pb-3 px-4 text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "architecture"
                ? "text-teal-300 border-b-2 border-teal-400"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            Pila Tecnológica e Infraestructura
          </button>
          <button
            onClick={() => setActiveTab("sync")}
            className={`pb-3 px-4 text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "sync"
                ? "text-teal-300 border-b-2 border-teal-400"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            Sincronización Offline-First
          </button>
          <button
            onClick={() => setActiveTab("blindspots")}
            className={`pb-3 px-4 text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "blindspots"
                ? "text-teal-300 border-b-2 border-teal-400"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Instancias Críticas y Puntos Ciegos
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        
        {/* TAB 1: ARCHITECTURE */}
        {activeTab === "architecture" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-4 text-teal-700">
                  <Cpu className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-slate-900">1. Electron vs. Tauri</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Para la aplicación de escritorio de la droguería, recomendamos <strong>Tauri</strong> sobre Electron por las siguientes razones:
                </p>
                <ul className="text-xs text-slate-700 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">✔</span>
                    <span><strong>Consumo de Memoria:</strong> Tauri (~20-40MB RAM) vs Electron (~150-300MB RAM), vital para computadores de mostrador promedio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">✔</span>
                    <span><strong>Tamaño del Ejecutable:</strong> ~10MB instalador (Tauri) vs &gt;130MB (Electron).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">✔</span>
                    <span><strong>Seguridad:</strong> El núcleo Rust de Tauri ofrece aislamiento de memoria frente a fugas de Node.js.</span>
                  </li>
                  <li className="text-slate-400 italic mt-1 font-mono">
                    *Nota: Se usará React para el frontend en ambos casos, permitiendo compartir el 95% del código UI.
                  </li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-4 text-emerald-700">
                  <Database className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-slate-900">2. MongoDB e Ingesta local</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Dado que necesita funcionamiento offline, MongoDB directo en la nube no basta. Necesita un modelado híbrido:
                </p>
                <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3 text-xs mb-3">
                  <strong>Estrategia Híbrida Recomendada:</strong>
                  <br />
                  Local: <strong>IndexedDB</strong> (en Navegador) o <strong>SQLite / RxDB</strong> (en Tauri de escritorio) sincronizados con <strong>MongoDB Atlas</strong> en la nube mendiante un API REST intermedio.
                </div>
                <ul className="text-xs text-slate-700 space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Escrituras Rápidas:</strong> El cajero no puede esperar latencia de red. Siempre se escribe en local primero.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>MongoDB Atlas:</strong> Funciona como agregador corporativo de reportes y maestro de inventario.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 mb-4 text-blue-700">
                  <Server className="w-6 h-6" />
                  <h3 className="font-bold text-lg text-slate-900">3. Node.js + Socket.io</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Actúa como el orquestador principal de eventos cuando los clientes están en línea:
                </p>
                <ul className="text-xs text-slate-700 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✔</span>
                    <span><strong>Evento Presencia:</strong> Sabe qué cajas/vendedores están activos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✔</span>
                    <span><strong>Push de Inventario:</strong> Si el Administrador altera el precio de un antibiótico desde la Web, se notifica y actualiza instantáneamente en el POS de Escritorio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">✔</span>
                    <span><strong>Colas de Transacciones:</strong> Procesa con Socket.io el estado de sincronización de cierres de caja continuos.</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Architecture Flow Card */}
            <div className="bg-slate-900 text-slate-100 rounded-lg p-6 font-mono text-xs">
              <div className="flex items-center justify-between mb-3 text-teal-400">
                <span className="font-bold flex items-center gap-1">💻 DIAGRAMA DE FLUJO ARQUITECTÓNICO (PROPUESSTA DE CONSULTORÍA)</span>
                <span className="px-2 py-0.5 rounded bg-teal-900 text-teal-300 text-[10px]">RECOMENDADO</span>
              </div>
              <div className="space-y-2 leading-none whitespace-pre-wrap">
{`+---------------------------------------------------------------------------------+
|                       APLICACIÓN DE ESCRITORIO POS (TAURI)                      |
|  [React POS Interface] ---> [IndexedDB / RxDB Cache] <--- [Bridge Rust Native]  |
|                                     | (Trabajo local instantáneo)                |
+-------------------------------------+-------------------------------------------+
                                      |
                       (Sincronización segura por Red)
                                      v
+---------------------------------------------------------------------------------+
|                    BACKEND CENTRAL (NODE.JS EXPRESS + SOCKET.IO)                |
|                    * REST API: Cuentas, Facturas, Cargues Proveedor             |
|                    * Socket.io: Broadcast instantáneo de Stock / Cierres        |
+-------------------------------------+-------------------------------------------+
                                      |
                     (Reconciliación y Escrituras)
                                      v
+---------------------------------------------------------------------------------+
|                                BASE DE DATOS (NUBE)                             |
|               [MongoDB Atlas] <--- [Sincronizadores en segundo plano]           |
+---------------------------------------------------------------------------------+`}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SYNC STRATEGY */}
        {activeTab === "sync" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-teal-600 animate-spin-slow" />
                Evolución Técnica: Algoritmo de Sincronización y Consistencia de Datos
              </h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                El mayor riesgo en los negocios con flujos offline-first (como una droguería en horas pico con cortes de internet) son los <strong>conflictos de datos concurrentes</strong>. Por ejemplo: vender una ampolla en la Caja 1 y otra en la Caja 2 exactamente al mismo tiempo estando desconectados, habiendo solo 1 unidad disponible.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-150">
                  <h4 className="font-bold text-sm text-slate-800 mb-2">A. Estructura de Cola de Operaciones (Logs)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    En lugar de sincronizar estados enteros de bases de datos (que sobreescriben cambios), guardamos un <strong>historico cronológico de acciones</strong> (Event-Sourcing) local en un almacenamiento aislado (localStorage / IndexedDB):
                  </p>
                  <pre className="p-2.5 bg-slate-900 text-teal-400 rounded text-[10px] font-mono overflow-x-auto">
{`{
  id: "log_329aef",
  op: "DEDUCT_STOCK",
  productId: "prod-acetaminofen",
  data: { quantityUnits: 12, client: "900.232-1" },
  timestamp: 178129312112, // Timestamp físico del dispositivo
  status: "pending"
}`}
                  </pre>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-150">
                  <h4 className="font-bold text-sm text-slate-800 mb-2">B. Estrategia de Resolución de Conflictos</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Al reconectarse el internet, el sistema aplica tres reglas de oro:
                  </p>
                  <ul className="text-xs text-slate-700 space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">1.</span>
                      <span><strong>Inventarios Operacionales:</strong> En lugar de sobreescribir stock, enviamos "restar X unidades". El servidor procesa aritméticamente los movimientos relativos.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">2.</span>
                      <span><strong>Modificaciones concurrentes del perfil (Nombre, NIT):</strong> Resuelve por <em>Last-Write-Wins (LWW)</em> basado en el timestamp sincronizado con el Network NTP.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">3.</span>
                      <span><strong>Cierres Diarios:</strong> Se integran de forma acumulativa en el servidor para evitar discrepancia de dineros físicos (Flujo de Caja).</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Steps for Local-First Persistence */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h4 className="font-bold text-sm text-slate-900 mb-3">Pasos de Ejecución ante una Venta Offline:</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-teal-50 border border-teal-100 rounded text-center">
                    <span className="block font-bold text-teal-800 text-xs">Paso 1</span>
                    <span className="text-[11px] text-slate-600">La Cajera presiona "Cobrar (Enter)". Se genera la factura local con ID temporal.</span>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-100 rounded text-center">
                    <span className="block font-bold text-teal-800 text-xs">Paso 2</span>
                    <span className="text-[11px] text-slate-600">Se resta el stock de inmediato del IndexedDB local para mantener venta ágil.</span>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-100 rounded text-center">
                    <span className="block font-bold text-teal-800 text-xs">Paso 3</span>
                    <span className="text-[11px] text-slate-600">Se añade la operación y la venta a la "Cola de Sincronización Pendiente".</span>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-100 rounded text-center">
                    <span className="block font-bold text-teal-800 text-xs">Paso 4</span>
                    <span className="text-[11px] text-slate-600">Cuando la red vuelve, un Worker sincroniza en batch con Back y actualiza nubes.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: BLINDSPOTS */}
        {activeTab === "blindspots" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Punto Ciego 1: Fraccionamiento de Medicamentos</h4>
                    <span className="text-[10px] uppercase font-bold text-rose-600 mt-0.5 block">Complejidad Física</span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      En droguerías es común vender una caja completa, o "sobres/skins/pastillas sueltas". Para evitar desajustes de inventario, el software debe calcular <strong>la unidad mínima equivalente (pastilla / cápsula)</strong>:
                    </p>
                    <div className="bg-rose-50/50 p-2.5 rounded mt-2 text-[11px] border border-rose-100 text-slate-700 font-mono">
                      Stock = 5 cajas, Factor Conver = 10.
                      <br />
                      Total Unidades = 50.
                      <br />
                      Vender 3 pastillas sueltas altera stock a:
                      <br />
                      <span className="text-rose-700 font-semibold">4 cajas y 7 pastillas sueltas</span> (No se restan cajas enteras!).
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Punto Ciego 2: Lector de Códigos de Barras e Interfaces USB</h4>
                    <span className="text-[10px] uppercase font-bold text-amber-600 mt-0.5 block">Hardware POS</span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      La mayoría de lectoras USB se comportan como emuladores de teclado (Keyboard Emulators) inyectando caracteres seguidos de la tecla `Enter`.
                    </p>
                    <div className="bg-amber-50/50 p-2.5 rounded mt-2 text-[11px] border border-amber-100 text-slate-700">
                      <strong>Riesgo:</strong> Si la cajera no tiene el foco en el input del buscador, el código se dispara y activa atajos locos en la UI.
                      <br />
                      <strong>Solución técnica:</strong> Escuchar a nivel global de `window` y capturar inputs con un intervalo de milisegundos inter-caracteres sumamente bajo (&lt; 20ms entre pulsadas).
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Punto Ciego 3: Normativa DIAN y Factura Electrónica (Colombia)</h4>
                    <span className="text-[10px] uppercase font-bold text-blue-600 mt-0.5 block">Regulación Legal</span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      En Colombia, las droguerías deben emitir facturas bajo normativas de sistema POS inteligente o Factura Electrónica si supera los topes UVT regulados.
                    </p>
                    <div className="bg-blue-50/50 p-2.5 rounded mt-2 text-[11px] border border-blue-100 text-slate-700">
                      El sistema offline-first debe almacenar una secuencia numérica de folios POS autorizada por la DIAN en local, y sincronizar el JSON con el proveedor tecnológico de confianza tan pronto retorne la red para el CUFE y Firma Digital.
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Punto Ciego 4: Alertas de Vencimiento de Lotes</h4>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 mt-0.5 block">Gestión Farmacéutica</span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Un producto vencido en estantería puede acarrear sellamiento del establecimiento por entes territoriales de salud.
                    </p>
                    <div className="bg-indigo-50/50 p-2.5 rounded mt-2 text-[11px] border border-indigo-100 text-slate-700">
                      Es crucial que el inventario registre <strong>Lotes y fechas de expiración específicos</strong>. El módulo de productos debe disparar semáforos visuales automáticos (Rojo: &lt; 3 meses, Amarillo: 3-6 meses, Verde: Estable).
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Closing Advisor Note bar */}
        <div className="mt-8 bg-teal-50 border border-teal-200 rounded-lg p-4 flex gap-3 text-xs leading-relaxed text-teal-900">
          <BookOpen className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-teal-950">RECOMENDACIÓN METODOLÓGICA GENERAL:</strong>
            Para el desarrollo de la solución, hemos creado esta versión web interactiva del software que simula <strong>en tiempo real</strong> las colas offline/online en la cabecera, de manera que pueda validar el comportamiento del POS, cálculos de fraccionamiento de sobres, alertamiento y cierres de caja tanto en condiciones ideales como simulando cortes de red con un solo clic.
          </div>
        </div>

      </div>
    </div>
  );
}
