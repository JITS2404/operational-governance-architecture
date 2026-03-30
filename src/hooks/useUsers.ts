// src/hooks/useUsers.ts
import { useEffect, useState } from 'react';
import DatabaseService from '@/services/databaseService';

export type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  name?: string; // computed field
  email?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
};

export default function useUsers() {
  const [data, setData] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchUsers() {
      setLoading(true);
      try {
        const users = await DatabaseService.getUsers();
        if (mounted) {
          // Add computed name field for backward compatibility
          const usersWithName = users.map((user: any) => ({
            ...user,
            name: `${user.first_name} ${user.last_name}`
          }));
          setData(usersWithName);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err);
          console.warn('Failed to fetch users:', err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchUsers();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}