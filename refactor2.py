import re
import os

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the end of imports
imports_end = content.find('export default function App() {')
imports_section = content[:imports_end]

# Find the start of return
return_start = content.find('  return (', imports_end)
logic_section = content[imports_end:return_start]

# Find all variables and functions to export
vars_to_export = []
for line in logic_section.split('\n'):
    if 'const [' in line or 'let [' in line:
        match = re.search(r'\[(.*?)\]', line)
        if match:
            parts = match.group(1).split(',')
            for p in parts:
                p = p.strip()
                if p: vars_to_export.append(p)
    elif line.strip().startswith('const handle') or line.strip().startswith('const calculate') or line.strip().startswith('const sync') or line.strip().startswith('const fetch'):
        match = re.search(r'const\s+([a-zA-Z0-9_]+)\s*=', line)
        if match: vars_to_export.append(match.group(1))
    elif line.strip().startswith('const filteredProducts') or line.strip().startswith('const totalInventory') or line.strip().startswith('const preseededBarcodes') or line.strip().startswith('const restockSelectedProduct') or line.strip().startswith('const isRestockProductAmbasMode') or line.strip().startswith('const restockProductFactor'):
        match = re.search(r'const\s+([a-zA-Z0-9_]+)\s*=', line)
        if match: vars_to_export.append(match.group(1))

vars_to_export = list(dict.fromkeys(vars_to_export))

# Generate the new App.tsx
new_app_content = imports_section + """import { AppContext } from './context/AppContext';
import Header from './components/Header';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import InventarioTab from './components/InventarioTab';
import FacturacionTab from './components/FacturacionTab';
import CierreTab from './components/CierreTab';
import ReportesTab from './components/ReportesTab';
import PerfilTab from './components/PerfilTab';

export default function App() {
""" + logic_section.replace('export default function App() {', '').strip() + f"""

  const appState = {{
    {', '.join(vars_to_export)}
  }};

  return (
    <AppContext.Provider value={{appState}}>
      <div id="main-app" className="min-h-screen bg-[#fafbfc] flex flex-col font-sans antialiased text-slate-900 selection:bg-teal-100 selection:text-teal-900">
        <Header />
        <main id="app-content" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
          {{syncLogs.length > 0 && (
            <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 rounded-lg flex items-center gap-3 overflow-hidden font-mono shadow-xs">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold tracking-wider">
                RECOGNIZER LOG
              </span>
              <div className="flex-1 truncate">
                🚀 <span className="font-semibold text-white">{{syncLogs[0]}}</span>
              </div>
            </div>
          )}}

          {{!currentUser ? (
            <Auth />
          ) : (
            <>
              <Navigation />
              {{activeTab === "inventario" && currentUser.role === "admin" && <InventarioTab />}}
              {{activeTab === "facturacion" && <FacturacionTab />}}
              {{activeTab === "cierre" && <CierreTab />}}
              {{activeTab === "reportes" && <ReportesTab />}}
              {{activeTab === "perfil" && <PerfilTab />}}
            </>
          )}}
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-12">
          <p>© 2026 {{business.name}}. Todos los derechos reservados. Diseñado bajo principios de resiliencia Local-First.</p>
        </footer>

        {{/* Floating Info Button */}}
        <button
          onClick={{() => setShowTechAdvisory(true)}}
          className="fixed bottom-6 right-6 z-50 bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full shadow-lg transition-all"
          title="Ver Guía de Estrategia Arquitectónica"
        >
          <Info className="w-6 h-6" />
        </button>

        {{/* Tech Advisory Modal */}}
        {{showTechAdvisory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative">
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={{() => setShowTechAdvisory(false)}}
                  className="bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 transition-colors backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <TechAdvisory />
              </div>
            </div>
          </div>
        )}}

      </div>
    </AppContext.Provider>
  );
}}
"""

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(new_app_content)

print("App.tsx rewritten.")
