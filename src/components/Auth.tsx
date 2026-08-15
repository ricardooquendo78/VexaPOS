import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AlertCircle, CheckCircle, Lock, ShieldCheck, Mail } from 'lucide-react';
import logoNegro from '../img/Logo en negro.png';

export default function Auth() {
  const {
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    authError,
    authSuccess,
    handleLogin,
    isSyncing
  } = useAppContext();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 text-slate-800 backdrop-blur-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <img src={logoNegro} alt="VexaPOS" className="h-16 mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Vexa POS</h2>
          <p className="text-slate-500 text-sm mt-1">Sistema de Control y Facturación de Droguería</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200/60 rounded-full text-xs font-semibold text-teal-800 mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Acceso Seguro a Cuentas Autorizadas</span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {authError && (
          <div className="p-3.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 mb-5 flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span className="font-medium">{authError}</span>
          </div>
        )}
        
        {authSuccess && (
          <div className="p-3.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 mb-5 flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-medium">{authSuccess}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} id="login-form" className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all placeholder:text-slate-400"
                placeholder="ejemplo@vexapos.com"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSyncing}
            className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white py-3 rounded-xl text-sm font-semibold shadow-md shadow-teal-700/10 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <Lock className="w-4 h-4" />
            <span>Ingresar al Sistema</span>
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            Acceso restringido únicamente para personal autorizado.
          </p>
        </div>
      </div>
    </div>
  );
}
