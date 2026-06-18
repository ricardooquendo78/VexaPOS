import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Package, FileText, TrendingDown, LineChart, User, Settings, Plus, Search, AlertCircle, FileSpreadsheet, Building, CheckCircle, Trash2, Barcode, Printer, X, CreditCard, UserCheck, LogOut, Wifi, WifiOff, RefreshCw, PlusCircle, Info } from 'lucide-react';
import TechAdvisory from './TechAdvisory';

export default function PerfilTab() {
  const { isOffline, setIsOffline, offlineQueue, setOfflineQueue, syncLogs, setSyncLogs, isSyncing, setIsSyncing, currentUser, setCurrentUser, authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword, registerName, setRegisterName, registerEmail, setRegisterEmail, registerPassword, setRegisterPassword, registerRole, setRegisterRole, authError, setAuthError, authSuccess, setAuthSuccess, business, setBusiness, products, setProducts, suppliers, setSuppliers, laboratories, setLaboratories, categories, setCategories, sales, setSales, closures, setClosures, activeClosure, setActiveClosure, activeTab, setActiveTab, showTechAdvisory, setShowTechAdvisory, inventoryFormMode, setInventoryFormMode, manageSubTab, setManageSubTab, prodSearchQuery, setProdSearchQuery, prodCategoryFilter, setProdCategoryFilter, newProdName, setNewProdName, newProdExp, setNewProdExp, newProdLab, setNewProdLab, newProdCost, setNewProdCost, newProdPrice, setNewProdPrice, newProdCategory, setNewProdCategory, newProdSkins, setNewProdSkins, newProdUnits, setNewProdUnits, newProdFactor, setNewProdFactor, newProdMinAlert, setNewProdMinAlert, newProdBarcode, setNewProdBarcode, newProdFoto, setNewProdFoto, newProdSellMode, setNewProdSellMode, newProdPriceUnits, setNewProdPriceUnits, newSupName, setNewSupName, newSupNit, setNewSupNit, newSupPhone, setNewSupPhone, newSupWsp, setNewSupWsp, newLabName, setNewLabName, newCatName, setNewCatName, restockSupplierId, setRestockSupplierId, restockProductId, setRestockProductId, restockSkins, setRestockSkins, restockUnits, setRestockUnits, restockTotalUnits, setRestockTotalUnits, restockCost, setRestockCost, restockPrice, setRestockPrice, restockPriceUnits, setRestockPriceUnits, restockExp, setRestockExp, invoiceItems, setInvoiceItems, posSearchQuery, setPosSearchQuery, barcodeInput, setBarcodeInput, posCart, setPosCart, invoiceClientNit, setInvoiceClientNit, showInvoicePreview, setShowInvoicePreview, posAlertMessage, setPosAlertMessage, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount, showHistoryModal, setShowHistoryModal, profileName, setProfileName, profileImage, setProfileImage, fetchInitialData, syncOfflineQueue, handleToggleOffline, handleLogin, handleRegister, handleLogout, handleCreateProduct, handleCreateSupplier, handleAddInvoiceItem, handleDeleteInvoiceItem, handleSaveFullInvoice, handleAddLab, handleAddCat, handleAddProductToCart, handleBarcodeSubmit, handleUpdateCartQty, handleRemoveFromCart, calculateCartTotals, handleCheckoutSale, handleAddExpense, handleFinalizeClosure, handleUpdateBusinessProfile, handleUpdatePersonalProfile, handleDownloadXLS, filteredProducts, totalInventoryCost, totalInventoryPriceValue, preseededBarcodes, restockSelectedProduct, isRestockProductAmbasMode, restockProductFactor } = useAppContext();

  const handleBusinessLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setBusiness({ ...business, logoUrl: dataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUserProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 150;
        const MAX_HEIGHT = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProfileImage(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* TAB CONTENT: PERFIL CONFIGURATION */}
            {activeTab === "perfil" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-slate-800">
                
                {/* Business Information settings panel (Admins only) */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
                  <div className="border-b pb-2 flex items-center gap-2">
                    <Building className="w-5 h-5 text-teal-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Información Legal del Establecimiento</h3>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">SOLO ADMINISTRADOR</span>
                    </div>
                  </div>

                  {currentUser.role === 'admin' ? (
                    <form onSubmit={handleUpdateBusinessProfile} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Nombre Comercial de Droguería</label>
                        <input
                          type="text"
                          required
                          value={business.name}
                          onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                          className="w-full px-3 py-1.5 border bg-white rounded-md text-xs font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">NIT</label>
                          <input
                            type="text"
                            required
                            value={business.nit}
                            onChange={(e) => setBusiness({ ...business, nit: e.target.value })}
                            className="w-full px-3 py-1.5 border bg-white rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Año de Fundación</label>
                          <input
                            type="text"
                            required
                            value={business.foundationYear}
                            onChange={(e) => setBusiness({ ...business, foundationYear: e.target.value })}
                            className="w-full px-3 py-1.5 border bg-white rounded-md text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Teléfono Corporativo POS</label>
                        <input
                          type="text"
                          required
                          value={business.phone}
                          onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                          className="w-full px-3 py-1.5 border bg-white rounded-md text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Dirección Física</label>
                          <input
                            type="text"
                            required
                            value={business.address}
                            onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                            className="w-full px-3 py-1.5 border bg-white rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Ciudad / País</label>
                          <input
                            type="text"
                            required
                            value={business.city}
                            onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                            className="w-full px-3 py-1.5 border bg-white rounded-md text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Logotipo del Establecimiento</label>
                        {business.logoUrl ? (
                          <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={business.logoUrl} alt="Logo de negocio" className="w-12 h-12 rounded-lg object-cover border" />
                              <span className="text-[10px] text-emerald-600 font-semibold">Logotipo cargado y optimizado</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setBusiness({ ...business, logoUrl: '' })}
                              className="text-slate-450 hover:text-rose-600 p-1.5 transition cursor-pointer"
                              title="Eliminar logotipo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBusinessLogoUpload}
                              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-[10px] cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                            />
                            <p className="text-[10px] text-slate-400">Selecciona una imagen del logotipo. Se optimizará y guardará de forma liviana.</p>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 border border-slate-850 hover:bg-slate-800 text-teal-300 font-bold py-2 rounded-lg text-xs cursor-pointer"
                      >
                        Guardar Configuración de Boleta Térmica
                      </button>

                    </form>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 border rounded text-xs text-slate-400">
                      🔒 No tienes permisos de rol Administrativo para alterar los metadatos comerciales expuestos en la boleta tributaria.
                    </div>
                  )}

                </div>

                {/* Personal profile metadata settings */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4">
                  <div className="border-b pb-2 flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Perfil de Operario Mostrador</h3>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ficha de Usuario</span>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePersonalProfile} className="space-y-4 text-xs font-medium">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-150">
                      <img
                        src={profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                        alt="Usuario"
                        className="w-14 h-14 rounded-full object-cover border-2 border-teal-500"
                      />
                      <div>
                        <strong className="text-sm text-slate-900 block">{currentUser.name}</strong>
                        <span className="text-xs text-slate-500 block">Correo: {currentUser.email}</span>
                        <span className="text-[9.5px] uppercase font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full mt-1 inline-block">
                          Rol Asignado: {currentUser.role}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Nombre Mostrado</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-3 py-1.5 border bg-white rounded-md text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Foto de Perfil</label>
                      {profileImage ? (
                        <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={profileImage} alt="Foto de perfil" className="w-12 h-12 rounded-full object-cover border" />
                            <span className="text-[10px] text-emerald-600 font-semibold">Foto cargada y optimizada</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProfileImage('')}
                            className="text-slate-450 hover:text-rose-600 p-1.5 transition cursor-pointer"
                            title="Eliminar foto de perfil"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUserProfileImageUpload}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-md text-[10px] cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                          />
                          <p className="text-[10px] text-slate-400">Selecciona una imagen de perfil. Se optimizará y guardará de forma liviana.</p>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs"
                    >
                      Actualizar Mi Perfil
                    </button>
                  </form>
                </div>

              </div>
            )}
    </>
  );
}
