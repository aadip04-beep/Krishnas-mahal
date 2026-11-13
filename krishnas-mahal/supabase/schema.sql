-- =====================================================================
--  Krishna's Mahal — Supabase schema
--  Run this whole file once in: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES (one row per app user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  role text not null default 'member' check (role in ('admin','member')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Auto-create profile when a user signs up. First ever user becomes admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_username text;
  v_display  text;
  v_role     text;
begin
  v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1));
  v_display  := coalesce(new.raw_user_meta_data->>'display_name', v_username);
  select case when count(*) = 0 then 'admin' else 'member' end into v_role from public.profiles;
  insert into public.profiles (id, username, display_name, role)
  values (new.id, lower(v_username), v_display, v_role);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active);
$$;

-- Public check used by the login screen to show "first-time setup" when no user exists yet
create or replace function public.has_any_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles);
$$;
grant execute on function public.has_any_user() to anon, authenticated;

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_hi text not null,
  icon text not null default 'tag',
  color text not null default '#0FA3A3',
  sort int not null default 100,
  is_default boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

insert into public.categories (name_en, name_hi, icon, color, sort, is_default) values
  ('Plot Purchase', 'प्लॉट खरीद',      'map',        '#F2B33D', 1,  true),
  ('Cement',        'सीमेंट',          'package',    '#8D99AE', 2,  true),
  ('Steel',         'सरिया / स्टील',   'anchor',     '#5C7CFA', 3,  true),
  ('Sand',          'रेत',             'mountain',   '#D4A373', 4,  true),
  ('Bricks',        'ईंट',             'brick-wall', '#C1572A', 5,  true),
  ('Aggregate',     'गिट्टी',          'layers',     '#7D8597', 6,  true),
  ('Other Material','अन्य सामग्री',    'boxes',      '#9C6644', 7,  true),
  ('Labour',        'मज़दूरी',         'hard-hat',   '#0FA3A3', 8,  true),
  ('Electrical',    'बिजली',           'zap',        '#FFD166', 9,  true),
  ('Plumbing',      'प्लंबिंग',        'droplets',   '#4CC9F0', 10, true),
  ('Tiles & Flooring','टाइल्स / फर्श', 'grid-3x3',   '#B5838D', 11, true),
  ('Doors & Windows','दरवाज़े / खिड़की','door-open',  '#A3B18A', 12, true),
  ('Paint',         'पेंट',            'paintbrush', '#EF476F', 13, true),
  ('Architect / Engineer','आर्किटेक्ट / इंजीनियर','ruler','#06D6A0',14, true),
  ('Govt. Fees & Approvals','सरकारी शुल्क','file-badge','#8338EC',15, true),
  ('Miscellaneous', 'विविध खर्च',      'more-horizontal','#ADB5BD',99, true)
on conflict do nothing;

-- ---------- EXPENSES ----------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  amount numeric(14,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  floor text not null default 'common' check (floor in ('plot','ground','first','common')),
  description text,
  vendor text,
  payment_mode text not null default 'cash' check (payment_mode in ('cash','upi','bank','cheque','credit')),
  is_paid boolean not null default true,
  due_date date,
  quantity numeric(12,2),
  unit text,
  bill_url text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists expenses_date_idx on public.expenses(expense_date desc);
create index if not exists expenses_cat_idx on public.expenses(category_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists expenses_touch on public.expenses;
create trigger expenses_touch before update on public.expenses
  for each row execute procedure public.touch_updated_at();

-- ---------- BUDGETS (per category) ----------
create table if not exists public.budgets (
  category_id uuid primary key references public.categories(id) on delete cascade,
  amount numeric(14,2) not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- MILESTONES (construction stages) ----------
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_hi text not null,
  floor text not null default 'common' check (floor in ('plot','ground','first','common')),
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  target_date date,
  completed_on date,
  note text,
  sort int not null default 100,
  created_at timestamptz not null default now()
);

insert into public.milestones (title_en, title_hi, floor, sort) values
  ('Plot registry & mutation',     'प्लॉट रजिस्ट्री व नामांतरण',  'plot',   1),
  ('Boundary & site clearing',     'सीमा व साइट सफाई',            'plot',   2),
  ('Bhoomi Pujan',                 'भूमि पूजन',                    'plot',   3),
  ('Approved plan / sanction',     'नक्शा स्वीकृति',               'common', 4),
  ('Excavation & foundation',      'खुदाई व नींव',                 'ground', 5),
  ('Plinth beam & DPC',            'प्लिंथ बीम व DPC',             'ground', 6),
  ('Ground floor columns & walls', 'भूतल कॉलम व दीवारें',          'ground', 7),
  ('Ground floor slab',            'भूतल छत (स्लैब)',              'ground', 8),
  ('First floor columns & walls',  'प्रथम तल कॉलम व दीवारें',      'first',  9),
  ('First floor slab',             'प्रथम तल छत (स्लैब)',          'first',  10),
  ('Electrical conduit & plumbing','बिजली पाइप व प्लंबिंग',        'common', 11),
  ('Plastering',                   'प्लास्टर',                     'common', 12),
  ('Flooring & tiles',             'फर्श व टाइल्स',                'common', 13),
  ('Doors, windows & grills',      'दरवाज़े, खिड़कियाँ व ग्रिल',   'common', 14),
  ('Painting',                     'पेंटिंग',                      'common', 15),
  ('Water tank, borewell & sump',  'पानी की टंकी, बोरवेल व संप',   'common', 16),
  ('Griha Pravesh',                'गृह प्रवेश',                   'common', 17)
on conflict do nothing;

-- ---------- SETTINGS (key/value) ----------
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
insert into public.settings (key, value) values
  ('project_name', 'Krishna''s Mahal'),
  ('total_budget', '0'),
  ('start_date', ''),
  ('plot_area', '')
on conflict do nothing;

-- ---------- ACTIVITY LOG (audit trail) ----------
create table if not exists public.activity_log (
  id bigserial primary key,
  actor uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  summary text,
  created_at timestamptz not null default now()
);

create or replace function public.log_expense_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into activity_log(actor, action, entity, entity_id, summary)
    values (auth.uid(), 'insert', 'expense', new.id::text, '₹' || new.amount || ' ' || coalesce(new.description,''));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into activity_log(actor, action, entity, entity_id, summary)
    values (auth.uid(), 'update', 'expense', new.id::text, '₹' || old.amount || ' → ₹' || new.amount);
    return new;
  else
    insert into activity_log(actor, action, entity, entity_id, summary)
    values (auth.uid(), 'delete', 'expense', old.id::text, '₹' || old.amount || ' ' || coalesce(old.description,''));
    return old;
  end if;
end $$;
drop trigger if exists expenses_audit on public.expenses;
create trigger expenses_audit after insert or update or delete on public.expenses
  for each row execute procedure public.log_expense_change();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.expenses     enable row level security;
alter table public.budgets      enable row level security;
alter table public.milestones   enable row level security;
alter table public.settings     enable row level security;
alter table public.activity_log enable row level security;

-- profiles: everyone logged in can read; admin can update anyone; user can update own display name
create policy "profiles read"   on public.profiles for select to authenticated using (true);
create policy "profiles update" on public.profiles for update to authenticated
  using (public.is_admin() or id = auth.uid()) with check (public.is_admin() or id = auth.uid());

-- categories: all can read & add; only admin can edit/delete
create policy "cat read"   on public.categories for select to authenticated using (true);
create policy "cat insert" on public.categories for insert to authenticated with check (true);
create policy "cat update" on public.categories for update to authenticated using (public.is_admin());
create policy "cat delete" on public.categories for delete to authenticated using (public.is_admin() and not is_default);

-- expenses: all can read & add; edit/delete own, admin anything
create policy "exp read"   on public.expenses for select to authenticated using (true);
create policy "exp insert" on public.expenses for insert to authenticated with check (created_by = auth.uid());
create policy "exp update" on public.expenses for update to authenticated using (created_by = auth.uid() or public.is_admin());
create policy "exp delete" on public.expenses for delete to authenticated using (created_by = auth.uid() or public.is_admin());

-- budgets & settings: all read, admin write
create policy "budget read"  on public.budgets for select to authenticated using (true);
create policy "budget write" on public.budgets for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings read"  on public.settings for select to authenticated using (true);
create policy "settings write" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- milestones: all read/update status; admin insert/delete
create policy "ms read"   on public.milestones for select to authenticated using (true);
create policy "ms update" on public.milestones for update to authenticated using (true);
create policy "ms insert" on public.milestones for insert to authenticated with check (true);
create policy "ms delete" on public.milestones for delete to authenticated using (public.is_admin());

-- activity log: read only
create policy "log read" on public.activity_log for select to authenticated using (true);

-- ---------- REALTIME ----------
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.milestones;
alter publication supabase_realtime add table public.budgets;

-- ---------- STORAGE (bill photos) ----------
insert into storage.buckets (id, name, public) values ('bills', 'bills', true)
on conflict do nothing;
create policy "bills read"   on storage.objects for select to public using (bucket_id = 'bills');
create policy "bills upload" on storage.objects for insert to authenticated with check (bucket_id = 'bills');
create policy "bills delete" on storage.objects for delete to authenticated using (bucket_id = 'bills');
