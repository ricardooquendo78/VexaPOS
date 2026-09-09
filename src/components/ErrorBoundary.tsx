import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Contiene los errores de una pestaña para que no derriben toda la aplicación.
// Sin esto, cualquier excepción durante el dibujado deja la pantalla en blanco
// y el mostrador queda sin poder facturar, aunque la falla esté en otra parte.

interface Props {
  children: React.ReactNode;
  // Cambiar este valor vuelve a intentar el dibujado: se usa la pestaña activa,
  // de modo que salir y entrar limpia el error.
  resetKey?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

// Los miembros se declaran de forma explícita porque este proyecto no tiene
// instaladas las definiciones de tipos de React (@types/react), y sin ellas
// TypeScript no conoce los miembros heredados de React.Component.
export default class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  declare setState: (state: Partial<State>) => void;
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message || "Error inesperado" };
  }

  componentDidCatch(error: any, info: any) {
    console.error("[VexaPOS] Error contenido en la pestaña:", error, info);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: "" });
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="max-w-lg mx-auto my-10 bg-white border border-rose-200 rounded-2xl shadow-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6 text-rose-600" />
        </div>
        <h3 className="font-bold text-slate-900 text-base">No se pudo mostrar esta sección</h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Ocurrió un problema al dibujar esta pestaña. Las demás siguen
          funcionando con normalidad: puede continuar facturando sin riesgo.
        </p>
        <button
          type="button"
          onClick={() => this.setState({ hasError: false, message: "" })}
          className="mt-4 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </button>
        {this.state.message && (
          <p className="mt-4 text-[10px] text-slate-400 font-mono break-words">
            {this.state.message}
          </p>
        )}
      </div>
    );
  }
}
