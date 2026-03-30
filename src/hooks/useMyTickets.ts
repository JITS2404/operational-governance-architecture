// src/hooks/useMyTickets.ts
import { useEffect, useState } from 'react';
import { getMyTickets } from '@/services/ticketService';
import type { TicketRow } from '@/types/db';

export default function useMyTickets(userId?: string, userRole?: string) {
  const [data, setData] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const rows = await getMyTickets(userId, userRole);
        if (mounted) setData(rows || []);
      } catch (err: any) {
        if (mounted) setError(err);
        console.error('useMyTickets fetch error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId, userRole]);

  return { data, loading, error };
}