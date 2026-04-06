import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CircleCheck,
  // RefreshCw,
  XCircle,
  X,
  SlidersHorizontal,
  // ChartNoAxesCombined,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Logout from '../components/ui/LogoutModal';
import MapContainer from '../components/map/MapContainer';
import DateRangePicker from '../components/filters/DateRangePicker';
import VendorPicker from '../components/filters/VendorPicker';
import StatusPicker from '../components/filters/StatusPicker';
import ClientSearch from '../components/filters/ClientSearch';
import ProveedorPicker from '../components/filters/ProveedorPicker';
import FilterSection from '../components/ui/FilterSection';
import type { Client } from '../types';
import LoadingScreen from '../components/ui/LoadingScreen';
import Login from './Login';
import { clear } from 'idb-keyval';
import UserMenu from '../components/ui/UserMenu';

export default function Home() {
  const { user } = useAuth();

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const [isLoginTransitioning, setIsLoginTransitioning] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [mapClients, setMapClients] = useState<Client[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    vendor: '',
    status: '',
    idProveedor: '',
  });

  const hasActiveFilters = Boolean(
    (filters.startDate && filters.endDate) ||
    filters.vendor !== '' ||
    filters.idProveedor !== ''
  );

  useEffect(() => {
    if (!hasActiveFilters && !selectedClient) {
      setMapClients([]);
      return;
    }

    const fetchAnalysis = async () => {
      setIsDataLoading(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

        const params: Record<string, string> = {};

        if (filters.startDate && filters.endDate) {
          params.fechaInicio = filters.startDate;
          params.fechaFin = filters.endDate;
        }

        if (filters.vendor && filters.vendor !== 'all') {
          params.vendedor = filters.vendor;
        }
        if (filters.idProveedor && filters.idProveedor !== 'all') {
          params.idProveedor = filters.idProveedor;
        }

        if (selectedClient) {
          const clientId =
            selectedClient.marketingData?.clienteId || selectedClient.id;
          params.idCliente = String(clientId);

          if (typeof selectedClient.idSucursal === 'number') {
            params.idSucursal = String(selectedClient.idSucursal);
          }
        }

        const queryParams = new URLSearchParams(params).toString();
        console.log('🌐 Mapa: Descargando análisis...', queryParams);

        const response = await fetch(`${API_BASE_URL}/analisis?${queryParams}`);

        if (response.ok) {
          const rawData = await response.json();
          const normalizedClients: Client[] = rawData.map((item: any) => {
            const marketingInfo = item.marketingData || item;
            return {
              id: item.id,
              name: item.name,
              branchName: item.branchName,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lng),
              vendor: item.vendor,
              marketingData: {
                clienteId: marketingInfo.clienteId,
                status: marketingInfo.status,
                totalSpentMXN: marketingInfo.totalSpentMXN || 0,
                totalSpentUSD: marketingInfo.totalSpentUSD || 0,
                ordersCount: marketingInfo.ordersCount || 0,
                lastPurchase: marketingInfo.lastPurchase || null,
              },
            };
          });
          setMapClients(normalizedClients);
        }
      } catch (err: any) {
        console.error(err);
        setError('Error al cargar datos del mapa');
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchAnalysis();
  }, [
    filters.startDate,
    filters.endDate,
    filters.vendor,
    filters.idProveedor,
    selectedClient,
  ]);

  const clientsToDisplay = useMemo(() => {
    if (mapClients.length > 0) {
      return mapClients.filter((client) => {
        if (!filters.status || filters.status === 'all') return true;
        const status = client.marketingData?.status;
        if (filters.status === 'active') return status === 'activo';
        if (filters.status === 'inactive') return status === 'sin_compra';
        return true;
      });
    }

    if (selectedClient) return [selectedClient];

    return [];
  }, [mapClients, filters.status, selectedClient]);

  const handleDateRangeApply = (start: string, end: string) =>
    setFilters((prev) => ({ ...prev, startDate: start, endDate: end }));

  const handleDateRangeClear = () =>
    setFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));

  const handleStatusSelect = (value: string) =>
    setFilters((prev) => ({ ...prev, status: value }));

  const handleVendorSelect = (vendorCode: string) => {
    setFilters((prev) => ({ ...prev, vendor: vendorCode }));
  };

  const handleProveedorSelect = (proveedorId: string) => {
    setFilters((prev) => ({ ...prev, idProveedor: proveedorId }));
  };

  useEffect(() => {
    const savedMessage = window.sessionStorage.getItem('toast_message');
    if (savedMessage) {
      setSuccess(savedMessage);
      window.sessionStorage.removeItem('toast_message');
    }
  }, []);

  useEffect(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (success || error) {
      setIsToastVisible(true);
      toastTimerRef.current = window.setTimeout(() => {
        setIsToastVisible(false);
        setTimeout(() => {
          setSuccess(null);
          setError(null);
        }, 500);
      }, 5000);
    } else {
      setIsToastVisible(false);
    }
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [success, error]);

  const handleCloseToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setIsToastVisible(false);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 500);
  };

  const handleRefresh = async () => {
    setIsReloading(true);
    window.sessionStorage.clear();
    window.localStorage.clear();
    await clear();
    setFilters({
      startDate: '',
      endDate: '',
      vendor: '',
      status: '',
      idProveedor: '',
    });
    setMapClients([]);
    setSelectedClient(null);
    setTimeout(() => setIsReloading(false), 1000);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <AnimatePresence>
        {isReloading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <LoadingScreen />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(!user || isLoginTransitioning) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <Login onLoginTransition={setIsLoginTransitioning} />
          </div>
        )}
      </AnimatePresence>

      {/* SIDEBAR IZQUIERDO */}
      {user && (
        <aside className="w-70 bg-gray-50 border-r border-slate-200 flex flex-col shrink-0 z-20">
          {/* Header */}
          <div className="h-14 flex items-center px-5 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              {/* <ChartNoAxesCombined className="w-5 h-5 text-slate-600" /> */}
              <img
                src="/marketing.svg"
                alt="TMEMarketing"
                className="w-6 h-6"
              />
              <h1 className="text-lg font-semibold text-slate-900">
                TMEMarketing
              </h1>
            </div>
          </div>

          {/* Subheader Filtros */}
          <div className="flex px-5 py-3.5 justify-between items-center border-b border-slate-200 shrink-0">
            <div className="flex gap-2 items-center">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-700" />
              <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                Filtros
              </h2>
            </div>
            <button
              onClick={handleRefresh}
              title="Limpiar todos los filtros"
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              {/* <RefreshCw className="w-3 h-3" /> */}
              <span>Limpiar</span>
            </button>
          </div>

          {/* Secciones scrolleables */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* 1. FECHAS */}
            <FilterSection title="FECHA" defaultOpen={true}>
              <DateRangePicker
                startDate={filters.startDate}
                endDate={filters.endDate}
                onApply={handleDateRangeApply}
                onClear={handleDateRangeClear}
              />
            </FilterSection>

            {/* 2. VENDEDORES */}
            <FilterSection title="VENDEDORES">
              <VendorPicker
                selectedVendor={filters.vendor}
                onSelect={handleVendorSelect}
              />
            </FilterSection>

            {/* 3. PROVEEDORES */}
            <FilterSection title="PROVEEDORES">
              <ProveedorPicker
                selectedProveedor={filters.idProveedor}
                onSelect={handleProveedorSelect}
              />
            </FilterSection>

            {/* 4. ESTADO DE CLIENTES */}
            <FilterSection title="ESTADO DE CLIENTES">
              <StatusPicker
                selectedStatus={filters.status}
                onSelect={handleStatusSelect}
              />
            </FilterSection>
          </div>

          {/* MENÚ DE USUARIO (Footer del Sidebar) */}
          <div className="px-3 py-2 border-t border-slate-200 bg-white shrink-0">
            <UserMenu
              userEmail={user?.email || undefined}
              onLogoutClick={() => setIsLogoutModalOpen(true)}
            />
          </div>
        </aside>
      )}

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {user && (
          <header className="h-14 bg-gray-50 border-b border-slate-200 flex items-center justify-center px-6 shrink-0 gap-4">
            {/* BUSCADOR GLOBAL */}
            <div className="w-full max-w-sm">
              <ClientSearch
                selectedClient={selectedClient}
                onSelect={(client) => {
                  setSelectedClient(client);
                  if (client) {
                    setFilters((prev) => ({
                      ...prev,
                      vendor: '',
                      idProveedor: '',
                    }));
                  }
                }}
              />
            </div>
          </header>
        )}

        <div className="flex-1 overflow-hidden flex flex-col p-0">
          <div className="w-full h-full relative">
            <MapContainer
              clients={clientsToDisplay}
              isIdle={!hasActiveFilters && !selectedClient}
              isLoading={isDataLoading}
            />
          </div>
        </div>
      </main>

      {user && (
        <Logout
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
        />
      )}

      {/* TOASTS */}
      <AnimatePresence>
        {isToastVisible && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-white border border-red-200 text-slate-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm"
          >
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={handleCloseToast}
              className="ml-auto text-slate-400 hover:text-slate-600 rounded p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isToastVisible && success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-white border border-green-200 text-slate-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm"
          >
            <CircleCheck className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm font-medium">{success}</p>
            <button
              onClick={handleCloseToast}
              className="ml-auto text-slate-400 hover:text-slate-600 rounded p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
