// src/hooks/useLocations.ts
import { useEffect, useState } from 'react';
import { getLocations } from '@/services/ticketService';
import type { LocationRow } from '@/types/db';

export default function useLocations() {
  const [data, setData] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await getLocations();
        if (mounted) setData(rows || []);
      } catch (err: any) {
        if (mounted) setError(err);
        console.error('useLocations fetch error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { data, loading, error };
}
