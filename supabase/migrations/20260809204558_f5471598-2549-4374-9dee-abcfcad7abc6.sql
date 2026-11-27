create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users manage their own profile" on public.profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  groom_first_name text not null default 'Mbuyi',
  bride_first_name text not null default 'Patience',
  family_name text not null default '',
  wedding_date date not null default '2026-08-15',
  wedding_time time not null default '09:00',
  welcome_message text not null default 'Nous avons le plaisir de vous inviter à célébrer notre mariage.',
  couple_photo_url text,
  template text not null default 'lavender',
  design jsonb not null default '{}'::jsonb,
  drink_limit int not null default 2,
  created_at timestamptz not null default now(),
  unique (owner_id)
);
grant select, insert, update, delete on public.invitations to authenticated;
grant all on public.invitations to service_role;
alter table public.invitations enable row level security;
create policy "Owners manage their invitation" on public.invitations for all to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table public.program_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  event_time text not null,
  title text not null,
  venue text,
  address text,
  sort_order int not null default 0
);
grant select, insert, update, delete on public.program_events to authenticated;
grant all on public.program_events to service_role;
alter table public.program_events enable row level security;
create policy "Owners manage program events" on public.program_events for all to authenticated
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));

create table public.dress_codes (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order int not null default 0
);
grant select, insert, update, delete on public.dress_codes to authenticated;
grant all on public.dress_codes to service_role;
alter table public.dress_codes enable row level security;
create policy "Owners manage dress codes" on public.dress_codes for all to authenticated
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));

create table public.drink_options (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  active boolean not null default true
);
grant select, insert, update, delete on public.drink_options to authenticated;
grant all on public.drink_options to service_role;
alter table public.drink_options enable row level security;
create policy "Owners manage drink options" on public.drink_options for all to authenticated
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  party_size int not null default 1,
  category text not null default 'Famille',
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending','attending','declined')),
  rsvp_at timestamptz,
  token text not null unique,
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.guests to authenticated;
grant all on public.guests to service_role;
alter table public.guests enable row level security;
create policy "Owners manage guests" on public.guests for all to authenticated
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));
create index guests_token_idx on public.guests (token);
create index guests_invitation_idx on public.guests (invitation_id);

create table public.drink_selections (
  guest_id uuid not null references public.guests(id) on delete cascade,
  option_id uuid not null references public.drink_options(id) on delete cascade,
  primary key (guest_id, option_id)
);
grant select, insert, update, delete on public.drink_selections to authenticated;
grant all on public.drink_selections to service_role;
alter table public.drink_selections enable row level security;
create policy "Owners manage drink selections" on public.drink_selections for all to authenticated
  using (exists (select 1 from public.guests g join public.invitations i on i.id = g.invitation_id where g.id = guest_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from public.guests g join public.invitations i on i.id = g.invitation_id where g.id = guest_id and i.owner_id = auth.uid()));

create table public.guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  message text not null check (char_length(message) <= 300),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.guestbook_messages to authenticated;
grant all on public.guestbook_messages to service_role;
alter table public.guestbook_messages enable row level security;
create policy "Owners manage guestbook" on public.guestbook_messages for all to authenticated
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from public.invitations i where i.id = invitation_id and i.owner_id = auth.uid()));

-- ===== Données de démonstration =====
insert into public.invitations (id, owner_id, groom_first_name, bride_first_name, family_name, wedding_date, wedding_time, welcome_message, template, drink_limit)
values ('d0000000-0000-4000-8000-000000000001', null, 'Mbuyi', 'Patience', 'Kasongo', '2026-08-15', '09:00', 'Nous avons le plaisir de vous inviter à célébrer notre mariage.', 'lavender', 2);

insert into public.program_events (invitation_id, event_time, title, venue, address, sort_order) values
  ('d0000000-0000-4000-8000-000000000001', '09:00', 'Mariage civil', 'Mairie de Lubumbashi', 'Avenue de la Révolution, Lubumbashi', 1),
  ('d0000000-0000-4000-8000-000000000001', '14:00', 'Cérémonie', 'Église Saint-Pierre', 'Quartier Katuba, Lubumbashi', 2),
  ('d0000000-0000-4000-8000-000000000001', '18:00', 'Discours', 'Salle des fêtes', 'Quartier Katuba, Lubumbashi', 3),
  ('d0000000-0000-4000-8000-000000000001', '20:00', 'Soirée dansante', 'Salle des fêtes', 'Quartier Katuba, Lubumbashi', 4);

insert into public.dress_codes (invitation_id, title, description, sort_order) values
  ('d0000000-0000-4000-8000-000000000001', 'Hommes', 'Tenue élégante ou costume', 1),
  ('d0000000-0000-4000-8000-000000000001', 'Dames', 'Tenue chic et élégante', 2),
  ('d0000000-0000-4000-8000-000000000001', 'Mariage civil', 'Tenue formelle', 3);

insert into public.drink_options (id, invitation_id, label, sort_order) values
  ('dd000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Dopel', 1),
  ('dd000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'N''tay', 2),
  ('dd000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', 'Chui', 3),
  ('dd000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001', 'Sucré', 4);

insert into public.guests (id, invitation_id, full_name, category, party_size, rsvp_status, rsvp_at, token) values
  ('de000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Jean Dupont', 'Famille', 2, 'attending', now(), 'demo-jean'),
  ('de000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'Marie Kabeya', 'Amis', 1, 'pending', null, 'demo-marie'),
  ('de000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', 'Paul Ilunga', 'Collègues', 1, 'declined', now(), 'demo-paul');

insert into public.drink_selections (guest_id, option_id) values
  ('de000000-0000-4000-8000-000000000001', 'dd000000-0000-4000-8000-000000000001'),
  ('de000000-0000-4000-8000-000000000001', 'dd000000-0000-4000-8000-000000000004');

insert into public.guestbook_messages (invitation_id, guest_id, message) values
  ('d0000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000001', 'Tous mes vœux de bonheur pour cette belle union !');