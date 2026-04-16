// src/hooks/useProveedorFavorites.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const FIRESTORE_DOC = (uid: string) =>
  doc(db, 'usuarios', uid, 'preferencias', 'proveedores');

const LOCAL_KEY = (uid: string) => `favs_proveedores_${uid}`;
const SERVER_CHECK_TTL_MS = 1000 * 60 * 10;

interface LocalFavoritesState {
  favoritos: string[];
  updatedAt: number;
  lastSyncedAt: number;
  lastServerCheckAt: number;
}

function parseLocalState(raw: string | null): LocalFavoritesState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return {
        favoritos: parsed,
        updatedAt: 0,
        lastSyncedAt: 0,
        lastServerCheckAt: 0,
      };
    }

    if (parsed && Array.isArray(parsed.favoritos)) {
      return {
        favoritos: parsed.favoritos,
        updatedAt: Number(parsed.updatedAt || 0),
        lastSyncedAt: Number(parsed.lastSyncedAt || 0),
        lastServerCheckAt: Number(parsed.lastServerCheckAt || 0),
      };
    }
  } catch (e) {
    console.error('Error leyendo localStorage', e);
  }

  return null;
}

export function useProveedorFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const isDirtyRef = useRef(false);
  const favoritesRef = useRef<Set<string>>(new Set());
  const updatedAtRef = useRef(0);
  const lastSyncedAtRef = useRef(0);
  const lastServerCheckAtRef = useRef(0);
  const syncTimerRef = useRef<number | null>(null);

  const persistLocalState = useCallback(
    (
      nextFavorites: Set<string>,
      updatedAt: number,
      lastSyncedAt: number,
      lastServerCheckAt: number
    ) => {
      if (!user) return;

      const localState: LocalFavoritesState = {
        favoritos: Array.from(nextFavorites),
        updatedAt,
        lastSyncedAt,
        lastServerCheckAt,
      };

      localStorage.setItem(LOCAL_KEY(user.uid), JSON.stringify(localState));
    },
    [user]
  );

  const syncToFirestore = useCallback(async () => {
    if (!user || !isDirtyRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    try {
      const favsArray = Array.from(favoritesRef.current);
      const updatedAt = updatedAtRef.current || Date.now();

      await setDoc(
        FIRESTORE_DOC(user.uid),
        { favoritos: favsArray, updatedAt },
        { merge: true }
      );

      isDirtyRef.current = false;
      lastSyncedAtRef.current = updatedAt;
      persistLocalState(
        favoritesRef.current,
        updatedAtRef.current,
        lastSyncedAtRef.current,
        lastServerCheckAtRef.current
      );
    } catch (err) {
      console.error('Error guardando favoritos en Firestore:', err);
    }
  }, [user, persistLocalState]);

  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(() => {
      syncToFirestore();
    }, 1000);
  }, [syncToFirestore]);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      favoritesRef.current = new Set();
      updatedAtRef.current = 0;
      lastSyncedAtRef.current = 0;
      lastServerCheckAtRef.current = 0;
      isDirtyRef.current = false;
      setIsLoading(false);
      return;
    }

    const localKey = LOCAL_KEY(user.uid);
    const localState = parseLocalState(localStorage.getItem(localKey));
    const localSet = new Set<string>(localState?.favoritos || []);

    setFavorites(localSet);
    favoritesRef.current = localSet;
    updatedAtRef.current = localState?.updatedAt || 0;
    lastSyncedAtRef.current = localState?.lastSyncedAt || 0;
    lastServerCheckAtRef.current = localState?.lastServerCheckAt || 0;
    isDirtyRef.current = updatedAtRef.current > lastSyncedAtRef.current;
    setIsLoading(false);

    let isMounted = true;

    const shouldCheckServer =
      !localState ||
      Date.now() - lastServerCheckAtRef.current > SERVER_CHECK_TTL_MS;

    if (shouldCheckServer) {
      getDoc(FIRESTORE_DOC(user.uid))
        .then((snap) => {
          if (!isMounted) return;

          lastServerCheckAtRef.current = Date.now();

          if (!snap.exists()) {
            if (isDirtyRef.current) {
              scheduleSync();
            }

            persistLocalState(
              favoritesRef.current,
              updatedAtRef.current,
              lastSyncedAtRef.current,
              lastServerCheckAtRef.current
            );
            return;
          }

          const data = snap.data() || {};
          const firestoreFavs = Array.isArray(data.favoritos)
            ? data.favoritos
            : [];
          const remoteUpdatedAt = Number(data.updatedAt || 0);

          if (remoteUpdatedAt > updatedAtRef.current) {
            const remoteSet = new Set<string>(firestoreFavs);
            setFavorites(remoteSet);
            favoritesRef.current = remoteSet;
            updatedAtRef.current = remoteUpdatedAt;
            lastSyncedAtRef.current = remoteUpdatedAt;
            isDirtyRef.current = false;
          } else if (isDirtyRef.current) {
            scheduleSync();
          } else {
            lastSyncedAtRef.current = Math.max(
              lastSyncedAtRef.current,
              remoteUpdatedAt
            );
          }

          persistLocalState(
            favoritesRef.current,
            updatedAtRef.current,
            lastSyncedAtRef.current,
            lastServerCheckAtRef.current
          );
        })
        .catch((err) =>
          console.error('Error cargando favoritos de Firestore:', err)
        );
    } else if (isDirtyRef.current) {
      scheduleSync();
    }

    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        syncToFirestore();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isDirtyRef.current) {
        syncToFirestore();
      }
    };

    const handleOnline = () => {
      if (isDirtyRef.current) {
        syncToFirestore();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      isMounted = false;
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
      if (isDirtyRef.current) {
        syncToFirestore();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [user, persistLocalState, scheduleSync, syncToFirestore]);

  const toggleFavorite = useCallback(
    (provId: string) => {
      if (!user) return;

      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(provId)) {
          next.delete(provId);
        } else {
          next.add(provId);
        }

        const updatedAt = Date.now();
        favoritesRef.current = next;
        updatedAtRef.current = updatedAt;
        isDirtyRef.current = true;

        persistLocalState(
          next,
          updatedAtRef.current,
          lastSyncedAtRef.current,
          lastServerCheckAtRef.current
        );
        scheduleSync();

        return next;
      });
    },
    [user, persistLocalState, scheduleSync]
  );

  return { favorites, toggleFavorite, isLoading };
}
