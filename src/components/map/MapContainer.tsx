import { useState, useCallback, useEffect } from 'react';
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
import { useClientVisits } from '../../hooks/useClientVisits';
import { useMapStatistics } from '../../hooks/useMapStatistics';
import MapStatisticsBar from './MapStatisticsBar';
import {
  formatVendorTag,
  formatLastVisitSummary,
} from '../../utils/visitInsights';

interface MapProps {
  clients: Client[];
  isIdle?: boolean;
  isLoading?: boolean;
  isRefreshing?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onOpenInvoices?: (client: Client) => void;
  filterHash?: string;
  visitFilters: { startDate: string; endDate: string };
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
  visitFilters,
}: MapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_Maps_API_KEY,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { visitsData, isLoadingVisits } = useClientVisits({
    client: selectedClient,
    filters: visitFilters,
  });
  const stats = useMapStatistics(clients);

  useEffect(() => {
    setSelectedClient(null);
  }, [filterHash]);

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

  const formatStatusText =
    selectedClient?.marketingData?.status === 'activo'
      ? 'Activo'
      : 'Sin compra';

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
            <div className="min-w-48 max-w-56">
              {/* ID DEL CLIENTE */}
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
                <p className="text-[10px] font-bold text-slate-500 mt-1 tracking-wider uppercase">
                  {selectedClient.giroComercial}
                </p>
              )}

              <div className="border-t border-gray-200 my-2.5"></div>

              {/* INFORMACIÓN ESTRUCTURADA */}
              <div className="space-y-1">
                {/* ESTADO */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-medium">Estado:</span>
                  <span
                    className={`font-bold ${
                      selectedClient.marketingData?.status === 'activo'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatStatusText}
                  </span>
                </div>

                {/* VENDEDOR */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-medium">Vendedor:</span>
                  <span className="font-semibold text-gray-900">
                    {formatVendorTag(selectedClient.vendor)}
                  </span>
                </div>

                {/* NÚMERO DE FACTURAS */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-medium"># Facturas:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedClient.marketingData?.ordersCount || 0}
                  </span>
                </div>

                {/* TOTAL MXN */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-medium">Total MXN:</span>
                  <span className="font-semibold text-gray-900">
                    $
                    {selectedClient.marketingData?.totalSpentMXN.toLocaleString(
                      'es-MX'
                    ) || 0}
                  </span>
                </div>

                {/* TOTAL USD */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-medium">Total USD:</span>
                  <span className="font-semibold text-gray-900">
                    $
                    {selectedClient.marketingData?.totalSpentUSD.toLocaleString(
                      'es-US'
                    ) || 0}
                  </span>
                </div>

                {/* ÚLTIMA VISITA */}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-medium">
                    Ult. Visita:
                  </span>
                  <span
                    className={`font-semibold ${
                      isLoadingVisits
                        ? 'text-gray-900'
                        : visitsData?.ultimaVisitaAbsoluta
                          ? 'text-stone-900'
                          : 'text-red-600'
                    }`}
                  >
                    {isLoadingVisits
                      ? 'Cargando...'
                      : formatLastVisitSummary(
                          visitsData?.ultimaVisitaAbsoluta ?? null
                        )}
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

      {/* BARRA DE ESTADÍSTICAS */}
      {!isIdle && !isLoading && !errorMessage && clients.length > 0 && (
        <MapStatisticsBar stats={stats} />
      )}
    </div>
  );
}
