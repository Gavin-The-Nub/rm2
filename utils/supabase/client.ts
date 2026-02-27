import { localDb } from '@/lib/localDb';

// Mock Supabase client to work locally without a real backend
// This mimics the structure of @supabase/supabase-js client
export const supabase = {
  from(table: string) {
    let filters: any = {};
    let orderBy: { column: string; ascending: boolean } | null = null;
    let isSingle = false;

    return {
      select(query: string = '*') {
        // In this mock, we don't parse the select query deeply, 
        // we just fetch and rejoin for attendance/renewals in specific components
        return this;
      },
      eq(column: string, value: any) {
        filters[column] = value;
        return this;
      },
      order(column: string, { ascending = true } = {}) {
        orderBy = { column, ascending };
        return this;
      },
      limit(count: number) {
        limitCount = count;
        return this;
      },
      single() {
        isSingle = true;
        return this;
      },
      async then(resolve: any) {
        let { data, error } = localDb.select(table, filters);
        
        // Handle sorting
        if (data && orderBy) {
          data.sort((a, b) => {
            const valA = a[orderBy!.column];
            const valB = b[orderBy!.column];
            if (valA < valB) return orderBy!.ascending ? -1 : 1;
            if (valA > valB) return orderBy!.ascending ? 1 : -1;
            return 0;
          });
        }

        // Handle limit
        if (data && limitCount !== null) {
          data = data.slice(0, limitCount);
        }

        // Specific mock behavior for MembersTable complex query
        if (table === 'members' && data) {
           data = data.map(member => ({
             ...member,
             attendance: localDb.select('attendance', { member_id: member.id }).data,
             renewals: localDb.select('renewals', { member_id: member.id }).data,
           }));
        }

        // Handle single
        if (isSingle && data) {
          data = data.length > 0 ? data[0] : null;
        }

        return resolve({ data, error });
      },
      async insert(item: any) {
        const { data, error } = localDb.insert(table, item);
        return { data: data ? data[0] : null, error };
      },
      async update(updates: any) {
        // Find ID from filters
        const id = filters.id;
        if (!id) return { data: null, error: { message: 'ID filter required for update' } };
        const { data, error } = localDb.update(table, id, updates);
        return { data: data ? data[0] : null, error };
      }
    };
  }
} as any;
