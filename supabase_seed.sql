-- Seed members
INSERT INTO public.members (name, email, membership_type, start_date, end_date, qr_code, payment_amount)
VALUES 
('Alice Smith', 'alice@example.com', 'monthly', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 'QR-ALICE-001', 50.00),
('Bob Jones', 'bob@example.com', 'weekly', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 'QR-BOB-002', 15.00),
('Charlie Brown', 'charlie@example.com', '1_day', CURRENT_DATE, CURRENT_DATE, 'QR-CHARLIE-003', 5.00),
('Diana Prince', 'diana@example.com', 'monthly', CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '10 days', 'QR-DIANA-004', 50.00);

-- Note: Diana is expired currently.

-- Seed attendance (simulate last 7 days)
INSERT INTO public.attendance (member_id, check_in_date, created_at)
SELECT id, CURRENT_DATE, NOW() FROM public.members WHERE name = 'Alice Smith';

INSERT INTO public.attendance (member_id, check_in_date, created_at)
SELECT id, CURRENT_DATE - INTERVAL '1 day', NOW() - INTERVAL '1 day' FROM public.members WHERE name = 'Alice Smith';

INSERT INTO public.attendance (member_id, check_in_date, created_at)
SELECT id, CURRENT_DATE, NOW() FROM public.members WHERE name = 'Bob Jones';

INSERT INTO public.attendance (member_id, check_in_date, created_at)
SELECT id, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days' FROM public.members WHERE name = 'Bob Jones';

-- Revenue / Renewal simulation
INSERT INTO public.renewals (member_id, membership_type, previous_end_date, new_end_date, payment_amount)
SELECT id, 'monthly', CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '10 days', 45.00 
FROM public.members WHERE name = 'Diana Prince';
