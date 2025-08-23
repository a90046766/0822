-- Enable pgcrypto if not exists
create extension if not exists pgcrypto;

-- Products
create table if not exists products (
  id text primary key,
  name text not null,
  unit_price numeric not null,
  group_price numeric,
  group_min_qty int default 0,
  description text,
  image_urls jsonb default '[]'::jsonb,
  safe_stock int,
  updated_at timestamptz default now()
);

-- Inventory
create table if not exists inventory (
  id text primary key,
  name text not null,
  product_id text references products(id) on delete set null,
  quantity int not null default 0,
  description text,
  image_urls jsonb default '[]'::jsonb,
  safe_stock int,
  updated_at timestamptz default now()
);

-- Members
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  email text,
  phone text,
  addresses jsonb default '[]'::jsonb,
  referrer_type text check (referrer_type in ('member','technician','sales')),
  referrer_code text,
  points int default 0,
  updated_at timestamptz default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_phone text,
  customer_address text,
  preferred_date date,
  preferred_time_start text,
  preferred_time_end text,
  platform text default '日',
  referrer_code text,
  member_id uuid references members(id) on delete set null,
  service_items jsonb not null default '[]'::jsonb,
  assigned_technicians jsonb not null default '[]'::jsonb,
  signature_technician text,
  signatures jsonb not null default '{}'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  photos_before jsonb not null default '[]'::jsonb,
  photos_after jsonb not null default '[]'::jsonb,
  payment_method text,
  payment_status text,
  points_used int default 0,
  points_deduct_amount numeric default 0,
  work_started_at timestamptz,
  work_completed_at timestamptz,
  service_finished_at timestamptz,
  canceled_reason text,
  status text not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Support shifts
create table if not exists support_shifts (
  id text primary key,
  support_email text not null,
  date date not null,
  slot text not null check (slot in ('am','pm','full')),
  reason text,
  color text,
  updated_at timestamptz default now()
);

-- Technician leaves
create table if not exists technician_leaves (
  id text primary key,
  technician_email text not null,
  date date not null,
  full_day boolean not null default true,
  start_time text,
  end_time text,
  reason text,
  color text,
  updated_at timestamptz default now()
);

-- Technician work (assignments)
create table if not exists technician_work (
  id text primary key,
  technician_email text not null,
  date date not null,
  start_time text not null,
  end_time text not null,
  order_id uuid references orders(id) on delete cascade,
  quantity_label text,
  color text,
  updated_at timestamptz default now()
);

-- RLS minimal
alter table products enable row level security;
alter table inventory enable row level security;
alter table members enable row level security;
alter table orders enable row level security;
alter table support_shifts enable row level security;
alter table technician_leaves enable row level security;
alter table technician_work enable row level security;

create policy if not exists products_select on products for select using (true);
create policy if not exists products_insert on products for insert with check (true);
create policy if not exists products_update on products for update using (true) with check (true);

create policy if not exists inventory_select on inventory for select using (true);
create policy if not exists inventory_insert on inventory for insert with check (true);
create policy if not exists inventory_update on inventory for update using (true) with check (true);

create policy if not exists members_select on members for select using (true);
create policy if not exists members_insert on members for insert with check (true);
create policy if not exists members_update on members for update using (true) with check (true);

create policy if not exists orders_select on orders for select using (true);
create policy if not exists orders_insert on orders for insert with check (true);
create policy if not exists orders_update on orders for update using (true) with check (true);

create policy if not exists support_shifts_select on support_shifts for select using (true);
create policy if not exists support_shifts_insert on support_shifts for insert with check (true);
create policy if not exists support_shifts_update on support_shifts for update using (true) with check (true);

create policy if not exists technician_leaves_select on technician_leaves for select using (true);
create policy if not exists technician_leaves_insert on technician_leaves for insert with check (true);
create policy if not exists technician_leaves_update on technician_leaves for update using (true) with check (true);


