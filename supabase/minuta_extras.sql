-- Permite guardar varios extras vinculados al registro principal de Minuta diaria.
ALTER TABLE public.minuta_diaria
ADD COLUMN IF NOT EXISTS extras jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Los extras se facturan como renglones independientes y necesitan Unit y es_extra.
ALTER TABLE public.factura_detalle
ADD COLUMN IF NOT EXISTS unit text,
ADD COLUMN IF NOT EXISTS es_extra boolean NOT NULL DEFAULT false;
