-- Fecha individual para cada servicio de una factura.
-- Los registros existentes conservan sus datos; la aplicación usa la fecha de factura como respaldo.
ALTER TABLE public.factura_detalle
ADD COLUMN IF NOT EXISTS fecha_servicio DATE;

NOTIFY pgrst, 'reload schema';
