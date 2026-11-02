import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../services/supabase";
import "./ServiciosPorCliente.css";

interface Cliente { id: string; nombre: string; }
interface ServicioCliente {
  id: string;
  cliente_id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  activo: boolean;
  clientes?: { nombre: string } | null;
}
const dinero = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v) || 0);

export default function ServiciosPorCliente() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<ServicioCliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    const [c, s] = await Promise.all([
      supabase.from("clientes").select("id,nombre").order("nombre"),
      supabase.from("servicios_cliente").select("*, clientes(nombre)").order("nombre"),
    ]);
    if (c.error) setMensaje(`Error cargando clientes: ${c.error.message}`);
    if (s.error) setMensaje(`Error cargando catálogo: ${s.error.message}`);
    setClientes(c.data ?? []);
    setServicios((s.data ?? []) as ServicioCliente[]);
    setCargando(false);
  }, []);
  useEffect(() => { void Promise.resolve().then(() => cargar()); }, [cargar]);

  const limpiar = () => { setEditando(null); setClienteId(""); setNombre(""); setDescripcion(""); setPrecio(""); };
  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true); setMensaje("");
    const payload = { cliente_id: clienteId, nombre: nombre.trim(), descripcion: descripcion.trim() || null, precio: Number(precio), activo: true };
    const result = editando
      ? await supabase.from("servicios_cliente").update(payload).eq("id", editando)
      : await supabase.from("servicios_cliente").insert(payload);
    setGuardando(false);
    if (result.error) { setMensaje(`No se pudo guardar: ${result.error.message}`); return; }
    setMensaje(editando ? "Servicio actualizado." : "Servicio agregado al catálogo.");
    limpiar(); await cargar();
  };
  const editar = (s: ServicioCliente) => {
    setEditando(s.id); setClienteId(s.cliente_id); setNombre(s.nombre);
    setDescripcion(s.descripcion ?? ""); setPrecio(String(s.precio));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cambiarEstado = async (s: ServicioCliente) => {
    const { error } = await supabase.from("servicios_cliente").update({ activo: !s.activo }).eq("id", s.id);
    if (error) setMensaje(`No se pudo cambiar el estado: ${error.message}`);
    else { setMensaje(s.activo ? "Servicio desactivado. Se conserva en el historial." : "Servicio activado."); await cargar(); }
  };
  const visibles = useMemo(() => servicios.filter(s =>
    (!filtroCliente || s.cliente_id === filtroCliente) && (mostrarInactivos || s.activo)
  ), [servicios, filtroCliente, mostrarInactivos]);

  return <main className="catalogo-page">
    <header className="catalogo-heading"><div><span className="catalogo-eyebrow">CONFIGURACIÓN OPERATIVA</span><h2>Servicios por cliente</h2><p>Administra tarifas independientes para cada cliente.</p></div><div className="catalogo-counter"><strong>{servicios.filter(s => s.activo).length}</strong><span>Servicios activos</span></div></header>
    <section className="catalogo-card">
      <h3>{editando ? "Editar servicio" : "Agregar servicio al cliente"}</h3>
      <p>El servicio y su precio aparecerán automáticamente al registrar una minuta para ese cliente.</p>
      <form className="catalogo-form" onSubmit={guardar}>
        <label>Cliente<select value={clienteId} onChange={e => setClienteId(e.target.value)} required><option value="">Seleccionar cliente</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
        <label>Nombre del servicio<input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Deep Cleaning" required /></label>
        <label>Precio (USD)<input type="number" min="0" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" required /></label>
        <label className="catalogo-wide">Descripción (opcional)<textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} placeholder="Detalle o alcance del servicio" /></label>
        <div className="catalogo-actions"><button className="catalogo-primary" disabled={guardando}>{guardando ? "Guardando..." : editando ? "Guardar cambios" : "Agregar al catálogo"}</button>{editando && <button type="button" className="catalogo-secondary" onClick={limpiar}>Cancelar</button>}</div>
      </form>
      {mensaje && <p className="catalogo-message" role="status">{mensaje}</p>}
    </section>
    <section className="catalogo-card">
      <div className="catalogo-list-heading"><div><h3>Catálogo de tarifas</h3><p>Cada cliente conserva sus propios servicios y precios.</p></div><strong>{visibles.length} servicios</strong></div>
      <div className="catalogo-filters"><label>Filtrar por cliente<select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}><option value="">Todos los clientes</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label><label className="catalogo-check"><input type="checkbox" checked={mostrarInactivos} onChange={e => setMostrarInactivos(e.target.checked)} /> Mostrar servicios inactivos</label></div>
      {cargando ? <p className="catalogo-empty">Cargando catálogo...</p> : visibles.length === 0 ? <p className="catalogo-empty">No hay servicios registrados para este filtro.</p> :
        <div className="catalogo-table-wrap"><table className="catalogo-table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Descripción</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{visibles.map(s => <tr key={s.id}><td>{s.clientes?.nombre ?? clientes.find(c => c.id === s.cliente_id)?.nombre ?? "Cliente"}</td><td>{s.nombre}</td><td>{s.descripcion || "—"}</td><td>{dinero(Number(s.precio))}</td><td><span className={`catalogo-status ${s.activo ? "active" : "inactive"}`}>{s.activo ? "Activo" : "Inactivo"}</span></td><td><div className="catalogo-row-actions"><button onClick={() => editar(s)}>Editar</button><button className={s.activo ? "danger" : ""} onClick={() => void cambiarEstado(s)}>{s.activo ? "Desactivar" : "Activar"}</button></div></td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
