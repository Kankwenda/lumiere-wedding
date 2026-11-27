ALTER TABLE public.program_events ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE public.program_events ADD COLUMN IF NOT EXISTS details text NOT NULL DEFAULT '';
ALTER TABLE public.drink_options ADD COLUMN IF NOT EXISTS alcoholic boolean NOT NULL DEFAULT false;
ALTER TABLE public.invitations ALTER COLUMN template SET DEFAULT 'elegance';
UPDATE public.invitations SET template = 'elegance' WHERE template = 'lavender';
UPDATE public.drink_options SET alcoholic = true WHERE lower(label) IN ('dopel', 'n''tay', 'chui');