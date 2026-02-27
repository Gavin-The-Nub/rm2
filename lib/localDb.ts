import { initialMembers, initialAttendance, initialRenewals } from './initialData';

const STORAGE_KEYS = {
  MEMBERS: 'rmgym_members',
  ATTENDANCE: 'rmgym_attendance',
  RENEWALS: 'rmgym_renewals',
};

class LocalDb {
  private isInitialized = false;

  private init() {
    if (this.isInitialized) return;
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(initialMembers));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(initialAttendance));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RENEWALS)) {
      localStorage.setItem(STORAGE_KEYS.RENEWALS, JSON.stringify(initialRenewals));
    }
    this.isInitialized = true;
  }

  private getTable(key: string): any[] {
    this.init();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveTable(key: string, data: any[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  select(table: string, filters: any = {}) {
    let data = this.getTable(STORAGE_KEYS[table.toUpperCase() as keyof typeof STORAGE_KEYS]);
    
    // Simple filter support (eq only for now)
    Object.keys(filters).forEach(key => {
      data = data.filter(item => item[key] === filters[key]);
    });

    return { data, error: null };
  }

  insert(table: string, item: any) {
    const tableKey = STORAGE_KEYS[table.toUpperCase() as keyof typeof STORAGE_KEYS];
    const data = this.getTable(tableKey);
    const newItem = { 
      ...item, 
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    data.push(newItem);
    this.saveTable(tableKey, data);
    return { data: [newItem], error: null };
  }

  update(table: string, id: string, updates: any) {
    const tableKey = STORAGE_KEYS[table.toUpperCase() as keyof typeof STORAGE_KEYS];
    const data = this.getTable(tableKey);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates };
      this.saveTable(tableKey, data);
      return { data: [data[index]], error: null };
    }
    return { data: null, error: { message: 'Item not found' } };
  }
}

export const localDb = new LocalDb();
