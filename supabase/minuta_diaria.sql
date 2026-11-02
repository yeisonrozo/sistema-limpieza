-- AIM HIGH CLEANERS LLC
-- Ejecutar una sola vez (o volver a ejecutar: usa IF NOT EXISTS) en Supabase SQL Editor.

-- Catálogo independiente de servicios y tarifas para cada cliente.
CREATE TABLE IF NOT EXISTS public.servicios_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicios_cliente_cliente
  ON public.servicios_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_servicios_cliente_activo
  ON public.servicios_cliente(cliente_id, activo);

ALTER TABLE public.servicios_cliente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios autenticados gestionan servicios por cliente"
  ON public.servicios_cliente;
CREATE POLICY "Usuarios autenticados gestionan servicios por cliente"
  ON public.servicios_cliente FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Asegurar la tabla de minuta (si ya existe, no altera los registros).
CREATE TABLE IF NOT EXISTS public.minuta_diaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  apartamento VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  precio NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  observaciones TEXT,
  factura_id UUID REFERENCES public.facturas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quitar el campo Unidad de instalaciones anteriores sin borrar los registros.
ALTER TABLE public.minuta_diaria DROP COLUMN IF EXISTS unidad;

-- Guarda qué servicio del catálogo se eligió, pero conserva descripción y precio
-- como una fotografía histórica del trabajo realizado.
ALTER TABLE public.minuta_diaria
  ADD COLUMN IF NOT EXISTS servicio_cliente_id UUID
  REFERENCES public.servicios_cliente(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_minuta_fecha
  ON public.minuta_diaria(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_minuta_cliente
  ON public.minuta_diaria(cliente_id);
CREATE INDEX IF NOT EXISTS idx_minuta_factura
  ON public.minuta_diaria(factura_id);
CREATE INDEX IF NOT EXISTS idx_minuta_servicio_cliente
  ON public.minuta_diaria(servicio_cliente_id);

ALTER TABLE public.minuta_diaria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios autenticados gestionan minuta"
  ON public.minuta_diaria;
CREATE POLICY "Usuarios autenticados gestionan minuta"
  ON public.minuta_diaria FOR ALL TO authenticated
  USING (true) WITH CHECK (true);


-- Configuración del consecutivo inicial de facturación.
CREATE TABLE IF NOT EXISTS public.configuracion_facturacion (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  consecutivo_inicial BIGINT NOT NULL DEFAULT 1 CHECK (consecutivo_inicial >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.configuracion_facturacion (id, consecutivo_inicial)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.configuracion_facturacion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios autenticados gestionan numeracion"
  ON public.configuracion_facturacion;
CREATE POLICY "Usuarios autenticados gestionan numeracion"
ON public.configuracion_facturacion FOR ALL TO authenticated
USING (true) WITH CHECK (true);
