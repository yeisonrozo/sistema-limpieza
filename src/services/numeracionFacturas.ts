import { supabase } from "./supabase";

/** Devuelve el siguiente consecutivo sin renumerar facturas existentes. */
export async function obtenerSiguienteNumeroFactura(): Promise<number> {
  const [{ data: configuracion, error: errorConfiguracion }, { data: ultima, error: errorUltima }] = await Promise.all([
    supabase.from("configuracion_facturacion").select("consecutivo_inicial").eq("id", 1).maybeSingle(),
    supabase.from("facturas").select("numero").order("numero", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (errorConfiguracion) throw new Error(`No se pudo leer la configuración de numeración: ${errorConfiguracion.message}`);
  if (errorUltima) throw new Error(`No se pudo consultar la última factura: ${errorUltima.message}`);

  const inicial = Math.max(1, Number(configuracion?.consecutivo_inicial ?? 1));
  const siguientePorHistorial = Number(ultima?.numero ?? 0) + 1;
  return Math.max(inicial, siguientePorHistorial);
}
