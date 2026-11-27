-- Retire les données de démonstration (invitation sans propriétaire + invités demo-*).
-- Les tables dépendantes sont supprimées en cascade.
delete from public.invitations
where id = 'd0000000-0000-4000-8000-000000000001' and owner_id is null;

-- Le bucket des photos de couple doit exister (privé, servi par /api/public/photos).
insert into storage.buckets (id, name, public)
values ('couple-photos', 'couple-photos', false)
on conflict (id) do nothing;

-- Valeurs par défaut neutres : plus de faux couple ni de date passée.
alter table public.invitations alter column groom_first_name set default '';
alter table public.invitations alter column bride_first_name set default '';
alter table public.invitations alter column wedding_date set default (current_date + 180);

-- Personnalisation du message de partage (WhatsApp / email) et de l'indicatif pays.
alter table public.invitations add column if not exists share_message text not null default '';
alter table public.invitations add column if not exists default_country_code text not null default '';
