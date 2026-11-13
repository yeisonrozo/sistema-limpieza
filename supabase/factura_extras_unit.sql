-- Aim High Cleaners LLC
-- Ejecutar una sola vez en Supabase SQL Editor.
-- Agrega Unit y el indicador de extra a los detalles de factura.
-- No elimina ni modifica los registros existentes.

ALTER TABLE public.factura_detalle
  ADD COLUMN IF NOT EXISTS unit VARCHAR(100);

ALTER TABLE public.factura_detalle
  ADD COLUMN IF NOT EXISTS es_extra BOOLEAN NOT NULL DEFAULT FALSE;

-- Los detalles antiguos quedan como servicios normales (es_extra = false).
NOTIFY pgrst, 'reload schema';
