export const initialMembers = [
  {
    id: '1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    membership_type: 'monthly',
    status: 'active',
    start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    qr_code: 'QR-ALICE-001',
    payment_amount: 50.00,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Bob Jones',
    email: 'bob@example.com',
    membership_type: 'weekly',
    status: 'active',
    start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    qr_code: 'QR-BOB-002',
    payment_amount: 15.00,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    membership_type: '1_day',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    qr_code: 'QR-CHARLIE-003',
    payment_amount: 5.00,
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Diana Prince',
    email: 'diana@example.com',
    membership_type: 'monthly',
    status: 'active',
    start_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    qr_code: 'QR-DIANA-004',
    payment_amount: 50.00,
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const initialAttendance = [
  { id: '1', member_id: '1', check_in_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '2', member_id: '1', check_in_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '3', member_id: '2', check_in_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '4', member_id: '2', check_in_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
];

export const initialRenewals = [
  {
    id: '1',
    member_id: '4',
    membership_type: 'monthly',
    previous_end_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new_end_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_amount: 45.00,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];
