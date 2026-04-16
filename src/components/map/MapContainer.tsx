import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import { AnimatePresence } from 'framer-motion';
import type { Client } from '../../types';
import LoadingLayer from '../ui/feedback/LoadingLayer';
import RefreshingMask from '../ui/feedback/RefreshingMask';
import RecoverableErrorBanner from '../ui/feedback/RecoverableErrorBanner';

interface MapProps {
  clients: Client[];
  isIdle?: boolean;
  isLoading?: boolean;
  isRefreshing?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onOpenInvoices?: (client: Client) => void;
  filterHash?: string;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute' as const,
  top: 0,
  left: 0,
};

const defaultCenter = { lat: 32.51280471628713, lng: -116.97569084246706 };

const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default function MapContainer({
  clients,
  isIdle = false,
  isLoading = false,
  isRefreshing = false,
  errorMessage = null,
  onRetry,
  onOpenInvoices,
  filterHash,
}: MapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    setSelectedClient(null);
  }, [filterHash]);

  const stats = useMemo(() => {
    return clients.reduce(
      (acc, client) => {
        acc.totalMXN += client.marketingData?.totalSpentMXN || 0;
        acc.totalUSD += client.marketingData?.totalSpentUSD || 0;

        const status = client.marketingData?.status;
        const isActive = status === 'activo';

        if (isActive) {
          acc.active += 1;
        } else {
          acc.inactive += 1;
        }

        acc.total += 1;
        return acc;
      },
      { totalMXN: 0, totalUSD: 0, total: 0, active: 0, inactive: 0 }
    );
  }, [clients]);

  useEffect(() => {
    if (selectedClient) {
      const stillVisible = clients.some((client) => {
        const selectedId =
          selectedClient.marketingData?.clienteId ?? selectedClient.id;
        const currentId = client.marketingData?.clienteId ?? client.id;

        return String(selectedId) === String(currentId);
      });

      if (!stillVisible) {
        setSelectedClient(null);
      }
    }

    if (map && clients.length > 0 && !isIdle) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidPoints = false;

      clients.forEach((client) => {
        if (
          client.lat &&
          client.lng &&
          !isNaN(client.lat) &&
          !isNaN(client.lng)
        ) {
          bounds.extend({ lat: client.lat, lng: client.lng });
          hasValidPoints = true;
        }
      });

      if (hasValidPoints) {
        map.fitBounds(bounds);

        if (clients.length === 1) {
          map.setZoom(18);
          setSelectedClient(clients[0]);
        }
      }
    } else if (map && isIdle) {
      map.setCenter(defaultCenter);
      map.setZoom(12);
    }
  }, [map, clients, isIdle]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const capitalizeText = (name?: string | null) => {
    if (!name) return '';
    return name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getMarkerIcon = (client: Client) => {
    const status = client.marketingData?.status;
    const isInactive = status === 'sin_compra';

    return isInactive
      ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
      : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
  };

  if (!isLoaded)
    return <div className="w-full h-full bg-gray-100 animate-pulse" />;

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={defaultOptions}
      >
        {clients.map((client) => (
          <Marker
            key={client.id}
            position={{ lat: client.lat, lng: client.lng }}
            icon={getMarkerIcon(client)}
            onClick={() => {
              setSelectedClient(client);
            }}
          />
        ))}

        {selectedClient && (
          <InfoWindow
            position={{ lat: selectedClient.lat, lng: selectedClient.lng }}
            onCloseClick={() => setSelectedClient(null)}
          >
            <div className="min-w-40 max-w-50">
              <p className="text-[13px] font-bold text-gray-900">
                #{selectedClient.marketingData?.clienteId || selectedClient.id}
              </p>

              {/* NOMBRE DEL CLIENTE */}
              <p className="text-[13px] font-bold text-gray-900 truncate leading-tight">
                {capitalizeText(selectedClient.name)}
              </p>

              {/* SUCURSAL */}
              {selectedClient.branchName && (
                <p className="text-[13px] font-semibold text-blue-600 mt-0.5">
                  {capitalizeText(selectedClient.branchName)}
                </p>
              )}

              {/* GIRO COMERCIAL */}
              {selectedClient.giroComercial && (
                <p className="text-[10px] font-bold text-slate-500 mt-1.5 tracking-wider uppercase">
                  {selectedClient.giroComercial}
                </p>
              )}

              <div className="border-t border-gray-200 my-2"></div>

              <div className="space-y-1.5">
                {/* ESTADO */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700">Estado:</span>
                  <span
                    className={`font-bold ${
                      selectedClient.marketingData?.status === 'activo'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {selectedClient.marketingData?.status || 'Desconocido'}
                  </span>
                </div>

                {/* NÚMERO DE FACTURAS */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-800"># Facturas:</span>
                  <span className="font-medium text-gray-900">
                    {selectedClient.marketingData?.ordersCount || 0}
                  </span>
                </div>

                {/* TOTAL MXN */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-800">Total MXN:</span>
                  <span className="font-medium text-gray-900">
                    $
                    {selectedClient.marketingData?.totalSpentMXN.toLocaleString(
                      'es-MX'
                    ) || 0}
                  </span>
                </div>

                {/* TOTAL USD */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-800">Total USD:</span>
                  <span className="font-medium text-gray-900">
                    $
                    {selectedClient.marketingData?.totalSpentUSD.toLocaleString(
                      'es-US'
                    ) || 0}
                  </span>
                </div>
              </div>

              {(selectedClient.marketingData?.ordersCount || 0) > 0 && (
                <button
                  onClick={() => onOpenInvoices?.(selectedClient)}
                  className="mt-2 w-full items-center text-center justify-center text-blue-700 hover:underline font-bold text-[11px] tracking-wider transition-colors cursor-pointer"
                >
                  Ver detalle
                </button>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* OVERLAY DE CARGA */}
      <AnimatePresence>
        {isLoading && (
          <LoadingLayer
            variant="absolute"
            className="bg-white/25 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {!isLoading && isRefreshing && <RefreshingMask />}

      {!isLoading && errorMessage && (
        <RecoverableErrorBanner message={errorMessage} onRetry={onRetry} />
      )}

      {/* BARRA DE ESTADÍSTICAS FLOTANTE */}
      {!isIdle && !isLoading && !errorMessage && clients.length > 0 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 w-auto max-w-[95%]">
          <div className="bg-white/90 backdrop-blur-md shadow-xl rounded-full px-5 py-2.5 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Sección: Clientes */}
            <div className="flex flex-col min-w-25">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-gray-800 leading-none">
                  {stats.total.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Clientes
                </span>
              </div>
              <div className="flex gap-2 text-[11px] font-semibold mt-0.5 leading-none">
                <span className="text-green-600">{stats.active} Activos</span>
                <span className="text-gray-300">|</span>
                <span className="text-red-500">
                  {stats.inactive} Sin Compra
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-gray-300"></div>

            {/* Sección: Ventas MXN */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Venta MXN
                </span>
                <span className="text-sm font-bold text-gray-800 leading-tight">
                  $
                  {stats.totalMXN.toLocaleString('es-MX', {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>

            {/* Sección: Ventas USD */}
            {stats.totalUSD > 0 && (
              <>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Venta USD
                    </span>
                    <span className="text-sm font-bold text-gray-800 leading-tight">
                      $
                      {stats.totalUSD.toLocaleString('en-US', {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
