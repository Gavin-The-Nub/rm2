-- Enum Types
CREATE TYPE membership_type AS ENUM ('1_day', 'weekly', 'monthly');
CREATE TYPE member_status AS ENUM ('active', 'suspended', 'cancelled', 'expired');

-- Members Table
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR,
    photo_url VARCHAR,
    membership_type membership_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status member_status NOT NULL DEFAULT 'active',
    qr_code VARCHAR UNIQUE NOT NULL,
    payment_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, check_in_date)
);

-- Renewals Table
CREATE TABLE public.renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    membership_type membership_type NOT NULL,
    previous_end_date DATE NOT NULL,
    new_end_date DATE NOT NULL,
    payment_amount DECIMAL(10, 2) NOT NULL,
    renewed_by VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_attendance_date ON public.attendance(check_in_date);
CREATE INDEX idx_attendance_member ON public.attendance(member_id);
CREATE INDEX idx_members_status ON public.members(status);
CREATE INDEX idx_members_end_date ON public.members(end_date);
CREATE INDEX idx_renewals_member ON public.renewals(member_id);
CREATE INDEX idx_renewals_created ON public.renewals(created_at);

-- RLS (Row Level Security) - allow anon access for MVP since there's no auth setup
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write access to members" ON public.members FOR ALL USING (true);
CREATE POLICY "Allow anon read/write access to attendance" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Allow anon read/write access to renewals" ON public.renewals FOR ALL USING (true);

-- Staff portal roles (linked to Supabase Auth)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- New auth users default to staff; promote admins in SQL Editor:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.id, 'staff');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();
