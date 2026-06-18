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

# Remove duplicates
vars_to_export = list(dict.fromkeys(vars_to_export))

# Generate AppContext
os.makedirs('src/context', exist_ok=True)
with open('src/context/AppContext.tsx', 'w', encoding='utf-8') as f:
    f.write("""import React, { createContext, useContext } from 'react';

export const AppContext = createContext<any>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
""")

# Define the boundaries of the sections in the return statement
sections = [
    ('Header', '<header id="main-header"', '</header>'),
    ('Auth', '{/* AUTH SECTION */}', '{/* NAVIGATION TABS FOR ACTIVE ROLES */}'),
    ('Navigation', '{/* NAVIGATION TABS FOR ACTIVE ROLES */}', '{/* TAB CONTENT: INVENTARIO */}'),
    ('InventarioTab', '{/* TAB CONTENT: INVENTARIO */}', '{/* TAB CONTENT: FACTURACIÓN / POS */}'),
    ('FacturacionTab', '{/* TAB CONTENT: FACTURACIÓN / POS */}', '{/* TAB CONTENT: CIERRE */}'),
    ('CierreTab', '{/* TAB CONTENT: CIERRE */}', '{/* TAB CONTENT: REPORTES */}'),
    ('ReportesTab', '{/* TAB CONTENT: REPORTES */}', '{/* TAB CONTENT: PERFIL CONFIGURATION */}'),
    ('PerfilTab', '{/* TAB CONTENT: PERFIL CONFIGURATION */}', '</main>'),
]

# Write components
os.makedirs('src/components', exist_ok=True)
for name, start_str, end_str in sections:
    start_idx = content.find(start_str, return_start)
    if end_str == '</main>':
        # Need to find the closing tag of main
        end_idx = content.find(end_str, start_idx)
    elif end_str == '</header>':
        end_idx = content.find(end_str, start_idx) + len('</header>')
    else:
        end_idx = content.find(end_str, start_idx)
    
    comp_content = content[start_idx:end_idx].strip()
    
    comp_code = f"""import React from 'react';
import {{ useAppContext }} from '../context/AppContext';
import {{ Package, FileText, TrendingDown, LineChart, User, Settings, Plus, Search, AlertCircle, FileSpreadsheet, Building, CheckCircle, Trash2, Barcode, Printer, X, CreditCard, UserCheck, LogOut, Wifi, WifiOff, RefreshCw, PlusCircle, Info }} from 'lucide-react';
import TechAdvisory from './TechAdvisory';

export default function {name}() {{
  const {{ {', '.join(vars_to_export)} }} = useAppContext();

  return (
    <>
      {comp_content}
    </>
  );
}}
"""
    with open(f'src/components/{name}.tsx', 'w', encoding='utf-8') as f:
        f.write(comp_code)

print("Generated components.")
