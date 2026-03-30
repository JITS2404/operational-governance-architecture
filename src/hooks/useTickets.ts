import { useEffect, useState } from 'react';
import { getAllTickets, getTicketsByReporter } from '@/services/ticketService';

export default function useTickets(userId?: string, myOnly = false) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = myOnly && userId ? await getTicketsByReporter(userId) : await getAllTickets();
        if (mounted) setData(rows);
      } catch (err) {
        setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId, myOnly]);

  return { data, loading, error };
}
