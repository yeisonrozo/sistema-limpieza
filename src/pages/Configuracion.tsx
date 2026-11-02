import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { obtenerSiguienteNumeroFactura } from "../services/numeracionFacturas";
import "./Configuracion.css";

export default function Configuracion() {
  const [consecutivo, setConsecutivo] = useState("1");
  const [siguiente, setSiguiente] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("configuracion_facturacion")
      .select("consecutivo_inicial")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      setMensaje(`No se pudo cargar la configuración: ${error.message}. Ejecuta el SQL de numeración.`);
      setCargando(false);
      return;
    }

    const valor = Number(data?.consecutivo_inicial ?? 1);
    setConsecutivo(String(valor));
    try {
      setSiguiente(await obtenerSiguienteNumeroFactura());
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo calcular el siguiente consecutivo.");
    }
    setCargando(false);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const guardar = async () => {
    const valor = Number(consecutivo);
    if (!Number.isSafeInteger(valor) || valor < 1) {
      setMensaje("Ingresa un número entero mayor que cero.");
      return;
    }
    setGuardando(true);
    setMensaje("");
    const { error } = await supabase
      .from("configuracion_facturacion")
      .upsert({ id: 1, consecutivo_inicial: valor }, { onConflict: "id" });
    setGuardando(false);
    if (error) {
      setMensaje(`No se pudo guardar: ${error.message}`);
      return;
    }
    try {
      const nuevoSiguiente = await obtenerSiguienteNumeroFactura();
      setSiguiente(nuevoSiguiente);
      setMensaje(`Configuración guardada. La próxima factura utilizará el número ${nuevoSiguiente}.`);
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "Configuración guardada, pero no se pudo consultar el siguiente número.");
    }
  };

  return (
    <main className="configuracion-page">
      <header className="configuracion-heading">
        <span className="configuracion-eyebrow">AJUSTES DEL SISTEMA</span>
        <h2>Configuración</h2>
        <p>Define desde qué número consecutivo comenzarán las facturas.</p>
      </header>
      <section className="configuracion-card">
        <h3>Numeración de facturas</h3>
        <p className="configuracion-help">Configura el número inicial. El sistema continuará automáticamente con el siguiente número disponible.</p>
        <label htmlFor="consecutivo-inicial">Iniciar facturación desde el número</label>
        <input
          id="consecutivo-inicial"
          type="number"
          min="1"
          step="1"
          value={consecutivo}
          onChange={e => setConsecutivo(e.target.value)}
          disabled={cargando || guardando}
        />
        <div className="configuracion-preview">
          <span>Próximo número que se asignará</span>
          <strong>{cargando ? "Consultando..." : siguiente}</strong>
        </div>
        <button type="button" onClick={() => void guardar()} disabled={cargando || guardando}>
          {guardando ? "Guardando..." : "Guardar numeración"}
        </button>
        {mensaje && <p className="configuracion-message" role="status">{mensaje}</p>}
        <small>Las facturas ya creadas no se modifican. Si ya existen facturas con números mayores, el sistema continuará desde el siguiente consecutivo para evitar duplicados.</small>
      </section>
    </main>
  );
}
