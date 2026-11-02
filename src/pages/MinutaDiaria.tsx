import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../services/supabase";
import "./MinutaDiaria.css";

interface Cliente { id: string; nombre: string; }
interface ServicioCliente { id: string; cliente_id: string; nombre: string; descripcion: string | null; precio: number; activo: boolean; }
interface Registro {
  id: string; cliente_id: string; servicio_cliente_id?: string | null; fecha: string;
  apartamento: string; descripcion: string; precio: number;
  observaciones: string | null; factura_id: string | null;
  clientes?: { nombre: string } | null;
}
const fechaLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const fechaFormato = (valor: string) => { const [y, m, d] = valor.split("-"); return y && m && d ? `${m}/${d}/${y}` : valor; };
const fechaDesdeFormato = (valor: string) => {
  const coincidencia = valor.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!coincidencia) return "";
  const [, mes, dia, anio] = coincidencia;
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
  if (fecha.getFullYear() !== Number(anio) || fecha.getMonth() !== Number(mes) - 1 || fecha.getDate() !== Number(dia)) return "";
  return `${anio}-${mes}-${dia}`;
};
const dinero = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v) || 0);

export default function MinutaDiaria() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [serviciosCliente, setServiciosCliente] = useState<ServicioCliente[]>([]);
  const [servicioId, setServicioId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [fecha, setFecha] = useState(fechaFormato(fechaLocal()));
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [estado, setEstado] = useState("pendientes");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    const [c, r, sc] = await Promise.all([
      supabase.from("clientes").select("id,nombre").order("nombre"),
      supabase.from("minuta_diaria").select("*, clientes(nombre)").order("fecha", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("servicios_cliente").select("id,cliente_id,nombre,descripcion,precio,activo").order("nombre"),
    ]);
    if (c.error) setMensaje(`Error cargando clientes: ${c.error.message}`);
    if (r.error) setMensaje(`Error cargando minuta: ${r.error.message}`);
    if (sc.error) setMensaje(`Error cargando servicios por cliente: ${sc.error.message}. Ejecuta la migración SQL incluida.`);
    setClientes(c.data ?? []);
    setServiciosCliente((sc.data ?? []) as ServicioCliente[]);
    setRegistros((r.data ?? []) as Registro[]);
    setCargando(false);
  }, []);
  useEffect(() => { void Promise.resolve().then(() => cargar()); }, [cargar]);

  const limpiar = () => {
    setEditando(null); setClienteId(""); setServicioId(""); setFecha(fechaFormato(fechaLocal()));
    setApartamento(""); setDescripcion(""); setPrecio(""); setObservaciones("");
  };
  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setGuardando(true); setMensaje("");
    const fechaISO = fechaDesdeFormato(fecha);
    if (!fechaISO) { setGuardando(false); setMensaje("La fecha de ingreso debe tener el formato MM/DD/YYYY y ser válida."); return; }
    const payload = { cliente_id: clienteId, servicio_cliente_id: servicioId || null, fecha: fechaISO, apartamento: apartamento.trim(), descripcion: descripcion.trim(), precio: Number(precio), observaciones: observaciones.trim() || null };
    const result = editando
      ? await supabase.from("minuta_diaria").update(payload).eq("id", editando).is("factura_id", null)
      : await supabase.from("minuta_diaria").insert(payload);
    setGuardando(false);
    if (result.error) { setMensaje(`No se pudo guardar: ${result.error.message}`); return; }
    setMensaje(editando ? "Registro actualizado." : "Servicio agregado a la minuta."); limpiar(); await cargar();
  };
  const editar = (r: Registro) => {
    if (r.factura_id) return;
    setEditando(r.id); setClienteId(r.cliente_id); setServicioId(r.servicio_cliente_id ?? ""); setFecha(fechaFormato(r.fecha));
    setApartamento(r.apartamento); setDescripcion(r.descripcion); setPrecio(String(r.precio)); setObservaciones(r.observaciones ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const seleccionarCliente = (id: string) => {
    setClienteId(id);
    setServicioId("");
    setDescripcion("");
    setPrecio("");
  };
  const seleccionarServicio = (id: string) => {
    setServicioId(id);
    const servicio = serviciosCliente.find(s => s.id === id);
    if (servicio) {
      setDescripcion(servicio.nombre);
      setPrecio(String(servicio.precio));
    } else {
      setDescripcion("");
      setPrecio("");
    }
  };
  const eliminar = async (r: Registro) => {
    if (r.factura_id || !window.confirm("¿Eliminar este registro de la minuta?")) return;
    const { error } = await supabase.from("minuta_diaria").delete().eq("id", r.id).is("factura_id", null);
    if (error) setMensaje(`No se pudo eliminar: ${error.message}`); else { setMensaje("Registro eliminado."); await cargar(); }
  };
  const filtrados = useMemo(() => registros.filter(r =>
    (!filtroFecha || r.fecha === fechaDesdeFormato(filtroFecha)) && (!filtroCliente || r.cliente_id === filtroCliente) &&
    (estado === "todos" || (estado === "pendientes" ? !r.factura_id : !!r.factura_id))), [registros, filtroFecha, filtroCliente, estado]);
  const pendientesSeleccionables = filtrados.filter(r => !r.factura_id);
  const totalPendiente = pendientesSeleccionables.reduce((s,r) => s + Number(r.precio), 0);
  const toggle = (id: string) => setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev,id]);

  const generarFactura = async () => {
    const elegidos = registros.filter(r => seleccionados.includes(r.id) && !r.factura_id);
    if (!elegidos.length) { setMensaje("Selecciona al menos un servicio pendiente."); return; }
    const clientesUnicos = [...new Set(elegidos.map(r => r.cliente_id))];
    if (clientesUnicos.length !== 1) { setMensaje("Para generar una factura, selecciona registros de un solo cliente."); return; }
    if (!window.confirm(`Se generará una factura por ${dinero(elegidos.reduce((s,r)=>s+Number(r.precio),0))}. ¿Continuar?`)) return;
    setGuardando(true); setMensaje("");
    const cliente = clientesUnicos[0];
    const { data: ultimo, error: errorUltimo } = await supabase.from("facturas").select("numero").order("numero", { ascending: false }).limit(1).maybeSingle();
    if (errorUltimo) { setGuardando(false); setMensaje(`No se pudo consultar numeración: ${errorUltimo.message}`); return; }
    const subtotal = elegidos.reduce((s,r)=>s+Number(r.precio),0);
    const { data: factura, error: errorFactura } = await supabase.from("facturas").insert({ numero: Number(ultimo?.numero ?? 0) + 1, cliente_id: cliente, fecha: fechaLocal(), subtotal, impuesto: 0, descuento: 0, total: subtotal, estado: "PENDIENTE", observaciones: `Generada desde minuta diaria (${elegidos.length} servicios).` }).select("id").single();
    if (errorFactura || !factura) { setGuardando(false); setMensaje(`No se pudo crear la factura: ${errorFactura?.message ?? "Error desconocido"}`); return; }
    const detalles = elegidos.map(r => ({ factura_id: factura.id, servicio_id: null, descripcion: `Apto ${r.apartamento}: ${r.descripcion}`, cantidad: 1, precio_unitario: Number(r.precio), impuesto: 0, subtotal: Number(r.precio), total: Number(r.precio) }));
    const { error: errorDetalles } = await supabase.from("factura_detalle").insert(detalles);
    if (errorDetalles) {
      await supabase.from("facturas").delete().eq("id", factura.id);
      setGuardando(false); setMensaje(`No se guardaron los detalles. Se intentó revertir la factura: ${errorDetalles.message}`); return;
    }
    const { error: errorMinuta } = await supabase.from("minuta_diaria").update({ factura_id: factura.id }).in("id", elegidos.map(r=>r.id)).is("factura_id", null);
    setGuardando(false);
    if (errorMinuta) { setMensaje(`La factura se creó, pero no se pudieron marcar los registros como facturados: ${errorMinuta.message}. No vuelvas a facturarlos; revisa la factura creada.`); await cargar(); return; }
    setSeleccionados([]); setEstado("facturados"); setMensaje("Factura creada y registros marcados como facturados."); await cargar();
  };

  return <main className="minuta-page">
    <header className="minuta-heading"><div><span className="minuta-eyebrow">OPERACIONES</span><h2>Minuta diaria</h2><p>Registra los trabajos realizados para facturarlos después.</p></div><div className="minuta-counter"><strong>{registros.filter(r=>!r.factura_id).length}</strong><span>Pendientes de facturar</span></div></header>
    <section className="minuta-card"><div className="minuta-card-title"><div><h3>{editando ? "Editar servicio" : "Registrar servicio"}</h3><p>Un registro por cada trabajo realizado.</p></div></div>
      <form className="minuta-form" onSubmit={guardar}>
        <label>Fecha de ingreso (MM/DD/YYYY)<input type="text" inputMode="numeric" placeholder="MM/DD/YYYY" value={fecha} onChange={e=>setFecha(e.target.value)} pattern="(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])/\d{4}" maxLength={10} required /></label>
        <label>Cliente<select value={clienteId} onChange={e=>seleccionarCliente(e.target.value)} required><option value="">Seleccionar cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
        <label>Apartamento<input value={apartamento} onChange={e=>setApartamento(e.target.value)} placeholder="Ej. 204" required /></label>
        <label>Servicio<select value={servicioId} onChange={e=>seleccionarServicio(e.target.value)} required disabled={!clienteId}><option value="">Seleccionar servicio</option>{serviciosCliente.filter(s=>s.cliente_id===clienteId && (s.activo || s.id===servicioId)).map(s=><option key={s.id} value={s.id}>{s.nombre} — {dinero(Number(s.precio))}</option>)}</select>{clienteId && serviciosCliente.every(s=>s.cliente_id!==clienteId || !s.activo) && <small>Este cliente aún no tiene servicios activos. Agrégalos en “Servicios por cliente”.</small>}</label>
        <label>Precio (USD)<input type="number" min="0" step="0.01" value={precio} placeholder="Se carga al elegir servicio" readOnly required /></label>
        <label className="minuta-wide">Descripción<textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} placeholder="Se completa al seleccionar el servicio" rows={2} required /></label>
        <label className="minuta-wide">Observaciones<textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Observaciones adicionales (opcional)" rows={2} /></label>
        <div className="minuta-form-actions"><button className="minuta-primary" disabled={guardando}>{guardando ? "Guardando..." : editando ? "Guardar cambios" : "Agregar a la minuta"}</button>{editando && <button type="button" className="minuta-secondary" onClick={limpiar}>Cancelar edición</button>}</div>
      </form>
      {mensaje && <p className="minuta-message" role="status">{mensaje}</p>}
    </section>
    <section className="minuta-card"><div className="minuta-list-heading"><div><h3>Cuaderno de servicios</h3><p>Consulta registros y prepara facturas por cliente.</p></div><strong>{filtrados.length} registros</strong></div>
      <div className="minuta-filters"><label>Fecha (MM/DD/YYYY)<input type="text" inputMode="numeric" placeholder="MM/DD/YYYY" value={filtroFecha} onChange={e=>setFiltroFecha(e.target.value)} maxLength={10} /></label><label>Cliente<select value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}><option value="">Todos los clientes</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label><label>Estado<select value={estado} onChange={e=>{setEstado(e.target.value);setSeleccionados([]);}}><option value="pendientes">Pendientes</option><option value="facturados">Facturados</option><option value="todos">Todos</option></select></label></div>
      <div className="minuta-selection"><div><strong>{seleccionados.length} seleccionados</strong><span> · Total pendiente: {dinero(totalPendiente)}</span></div><button className="minuta-primary" onClick={generarFactura} disabled={guardando || seleccionados.length===0}>Generar factura</button></div>
      {cargando ? <p className="minuta-empty">Cargando minuta...</p> : filtrados.length===0 ? <p className="minuta-empty">No hay registros para estos filtros.</p> : <div className="minuta-table-wrap"><table className="minuta-table"><thead><tr><th></th><th>Fecha (MM/DD/YYYY)</th><th>Cliente</th><th>Apartamento</th><th>Descripción</th><th>Precio</th><th>Observaciones</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filtrados.map(r=><tr key={r.id}><td>{!r.factura_id && <input aria-label="Seleccionar registro" type="checkbox" checked={seleccionados.includes(r.id)} onChange={()=>toggle(r.id)} />}</td><td>{fechaFormato(r.fecha)}</td><td>{r.clientes?.nombre ?? clientes.find(c=>c.id===r.cliente_id)?.nombre ?? "Cliente"}</td><td>{r.apartamento}</td><td>{r.descripcion}</td><td>{dinero(Number(r.precio))}</td><td>{r.observaciones || "—"}</td><td><span className={`minuta-status ${r.factura_id ? "done" : "pending"}`}>{r.factura_id ? `Facturado` : "Pendiente"}</span></td><td>{!r.factura_id && <div className="minuta-actions"><button onClick={()=>editar(r)}>Editar</button><button className="danger" onClick={()=>void eliminar(r)}>Eliminar</button></div>}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
