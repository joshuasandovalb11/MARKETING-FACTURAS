import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

import Logout from '../components/ui/LogoutModal';
import MapContainer from '../components/map/MapContainer';
import DateRangePicker from '../components/filters/DateRangePicker';
import VendorPicker from '../components/filters/VendorPicker';
import StatusPicker from '../components/filters/StatusPicker';
import ClientSearch from '../components/filters/ClientSearch';
import ProveedorPicker from '../components/filters/ProveedorPicker';
import FilterSection from '../components/ui/FilterSection';
import type { Client } from '../types';
import Login from './Login';
import UserMenu from '../components/ui/UserMenu';
import InvoiceDrawer from '../components/ui/InvoiceDrawer';
import { useMarketingAnalysis } from '../hooks/useMarketingAnalysis';
import { warmupStaticCatalogs } from '../utils/queryWarmup';
import { useMinimumVisibleFlag } from '../hooks/useMinimumVisibleFlag';
import { useNotificationToast } from '../hooks/useNotificationToast';
import {
  resolveErrorMessageNotification,
  resolveEventNotification,
} from '../utils/notificationPolicy';

function normalizeProviderIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b)
  );
}

function readProviderIdsFromParams(searchParams: URLSearchParams) {
  const repeated = searchParams.getAll('idProveedor');
  const rawValues =
    repeated.length > 0 ? repeated : [searchParams.get('idProveedor') || ''];

  return normalizeProviderIds(
    rawValues.flatMap((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

type FilterUpdateValue = string | string[];

export default function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoginTransitioning, setIsLoginTransitioning] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { notify } = useNotificationToast();

  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);
  const [invoiceClient, setInvoiceClient] = useState<Client | null>(null);

  const filters = useMemo(
    () => ({
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      vendor: searchParams.get('vendor') || '',
      status: searchParams.get('status') || '',
      idProveedorIds: readProviderIdsFromParams(searchParams),
    }),
    [searchParams]
  );

  const updateFilters = (newValues: Record<string, FilterUpdateValue>) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);

      Object.entries(newValues).forEach(([key, value]) => {
        if (key === 'idProveedor') {
          params.delete(key);

          if (Array.isArray(value)) {
            const providerIds = normalizeProviderIds(value);
            providerIds.forEach((id) => {
              params.append(key, id);
            });
          }

          return;
        }

        if (typeof value === 'string' && value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      return params;
    });
  };

  const hasActiveFilters = Boolean(
    (filters.startDate && filters.endDate) ||
    filters.vendor !== '' ||
    filters.idProveedorIds.length > 0 ||
    (filters.status !== '' && filters.status !== 'all')
  );

  const filterHash =
    JSON.stringify(filters) +
    (selectedClient?.id || '') +
    ':' +
    (selectedClient?.idSucursal ?? 'none');

  useEffect(() => {
    setIsInvoiceDrawerOpen(false);
  }, [filterHash]);

  const {
    mapClients,
    isInitialLoading,
    isRefreshing,
    hasError,
    fetchError,
    refetchAnalysis,
  } = useMarketingAnalysis({
    filters,
    selectedClient,
    hasActiveFilters,
  });

  const isRefreshingVisible = useMinimumVisibleFlag(isRefreshing, 450);

  useEffect(() => {
    if (!fetchError) return;

    notify(
      resolveErrorMessageNotification({
        scope: 'analysis-map',
        message: fetchError,
        fallback: 'No se pudo cargar el analisis de clientes.',
      })
    );
  }, [fetchError, notify]);

  useEffect(() => {
    if (!user) return;

    const handleOffline = () => {
      notify(resolveEventNotification('network-offline'));
    };

    const handleOnline = () => {
      notify(resolveEventNotification('network-online'));
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [user, notify]);

  useEffect(() => {
    const savedMessage = window.sessionStorage.getItem('toast_message');
    if (savedMessage) {
      notify(resolveEventNotification('session-message', savedMessage));
      window.sessionStorage.removeItem('toast_message');
    }
  }, [notify]);

  useEffect(() => {
    if (!user) return;

    void warmupStaticCatalogs(queryClient);
  }, [user, queryClient]);

  const clientsToDisplay = useMemo(() => {
    if (!hasActiveFilters && !selectedClient) {
      return [];
    }

    if (mapClients.length > 0) {
      return mapClients.filter((client) => {
        if (!filters.status || filters.status === 'all') return true;
        const status = client.marketingData?.status;
        if (filters.status === 'active') return status === 'activo';
        if (filters.status === 'inactive') return status === 'sin_compra';
        return true;
      });
    }

    if (selectedClient && !hasActiveFilters) return [selectedClient];

    return [];
  }, [mapClients, filters.status, selectedClient, hasActiveFilters]);

  const handleDateRangeApply = (start: string, end: string) =>
    updateFilters({ startDate: start, endDate: end });

  const handleDateRangeClear = () =>
    updateFilters({ startDate: '', endDate: '' });

  const handleStatusSelect = (value: string) =>
    updateFilters({ status: value });

  const handleVendorSelect = (vendorCode: string) => {
    setSelectedClient(null);
    updateFilters({ vendor: vendorCode });
  };

  const handleProveedorSelect = (proveedorIds: string[]) => {
    setSelectedClient(null);
    updateFilters({ idProveedor: proveedorIds });
  };

  const handleRefresh = () => {
    const hadActiveContext = hasActiveFilters || Boolean(selectedClient);

    setSearchParams({});
    setSelectedClient(null);
    setIsInvoiceDrawerOpen(false);

    notify(
      resolveEventNotification(
        hadActiveContext ? 'filters-reset' : 'filters-reset-empty'
      ),
      { bypassDedupe: true }
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <AnimatePresence>
        {(!user || isLoginTransitioning) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <Login onLoginTransition={setIsLoginTransitioning} />
          </div>
        )}
      </AnimatePresence>

      {user && (
        <aside className="w-70 bg-gray-50 border-r border-slate-200 flex flex-col shrink-0 z-20">
          <div className="h-14 flex items-center px-5 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
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
              <span>Limpiar</span>
            </button>
          </div>

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
                selectedProveedores={filters.idProveedorIds}
                onChange={handleProveedorSelect}
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

          <div className="px-3 py-2 border-t border-slate-200 bg-white shrink-0">
            <UserMenu
              userEmail={user?.email || undefined}
              onLogoutClick={() => setIsLogoutModalOpen(true)}
            />
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {user && (
          <header className="h-14 bg-gray-50 border-b border-slate-200 flex items-center justify-center px-6 shrink-0 gap-4">
            <div className="w-full max-w-sm">
              <ClientSearch
                selectedClient={selectedClient}
                onSelect={(client) => {
                  setSelectedClient(client);
                  if (client) {
                    updateFilters({ vendor: '', idProveedor: [] });
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
              isLoading={isInitialLoading}
              isRefreshing={isRefreshingVisible}
              errorMessage={hasError ? fetchError : null}
              onRetry={refetchAnalysis}
              filterHash={filterHash}
              visitFilters={{
                startDate: filters.startDate,
                endDate: filters.endDate,
              }}
              onOpenInvoices={(client) => {
                setInvoiceClient(client);
                setIsInvoiceDrawerOpen(true);
              }}
            />

            <InvoiceDrawer
              isOpen={isInvoiceDrawerOpen}
              onClose={() => setIsInvoiceDrawerOpen(false)}
              client={invoiceClient}
              filters={filters}
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
    </div>
  );
}
