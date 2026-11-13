-- Permite guardar varios servicios dentro de un mismo registro/grupo de Minuta diaria.
-- No elimina ni modifica los datos existentes.
ALTER TABLE public.minuta_diaria
ADD COLUMN IF NOT EXISTS servicios_adicionales JSONB NOT NULL DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
