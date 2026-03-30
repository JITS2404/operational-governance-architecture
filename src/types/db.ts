// src/types/db.ts
export interface CategoryRow {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LocationRow {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TicketRow {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  category_id?: string | null;
  location_id?: string | null;
  reporter_id?: string | null;
  assigned_technician_id?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  closed_at?: string | null;
}
