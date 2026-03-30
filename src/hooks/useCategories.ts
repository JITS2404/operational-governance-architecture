// src/hooks/useCategories.ts
import { useEffect, useState } from 'react';
import { getCategories } from '@/services/ticketService';
import type { CategoryRow } from '@/types/db';

export default function useCategories() {
  const [data, setData] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await getCategories();
        if (mounted) setData(rows || []);
      } catch (err: any) {
        if (mounted) setError(err);
        // keep console for debugging
        console.error('useCategories fetch error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { data, loading, error };
}
