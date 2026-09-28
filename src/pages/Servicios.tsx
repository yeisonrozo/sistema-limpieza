import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "./Servicios.css";

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  impuesto: number;
  activo: boolean;
}

function Servicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [impuesto, setImpuesto] = useState("0");

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      const { data, error } = await supabase
        .from("servicios")
        .select("*")
        .order("nombre", { ascending: true });

      if (!activo) return;

      if (error) {
        console.error("Error cargando servicios:", error);
        setCargando(false);
        return;
      }

      setServicios(data ?? []);
      setCargando(false);
    };

    void cargar();

    return () => {
      activo = false;
    };
  }, []);

  const cargarServicios = async () => {
    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error cargando servicios:", error);
      return;
    }

    setServicios(data ?? []);
  };

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setImpuesto("0");
    setEditandoId(null);
  };

  const abrirNuevoServicio = () => {
    limpiarFormulario();
    setMostrarModal(true);
  };

  const abrirEditarServicio = (servicio: Servicio) => {
    setEditandoId(servicio.id);
    setNombre(servicio.nombre || "");
    setDescripcion(servicio.descripcion || "");
    setPrecio(String(servicio.precio ?? ""));
    setImpuesto(String(servicio.impuesto ?? 0));
    setMostrarModal(true);
  };

  const guardarServicio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      alert("El nombre del servicio es obligatorio.");
      return;
    }

    const precioNumero = Number(precio);
    const impuestoNumero = Number(impuesto);

    if (isNaN(precioNumero) || precioNumero < 0) {
      alert("Ingresa un precio válido.");
      return;
    }

    if (isNaN(impuestoNumero) || impuestoNumero < 0) {
      alert("Ingresa un impuesto válido.");
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: precioNumero,
      impuesto: impuestoNumero,
      activo: true,
      updated_at: new Date().toISOString(),
    };

    if (editandoId) {
      const { error } = await supabase
        .from("servicios")
        .update(datos)
        .eq("id", editandoId);

      if (error) {
        console.error("Error actualizando servicio:", error);
        alert("No fue posible actualizar el servicio.");
        return;
      }
    } else {
      const { error } = await supabase
        .from("servicios")
        .insert(datos);

      if (error) {
        console.error("Error creando servicio:", error);
        alert("No fue posible crear el servicio.");
        return;
      }
    }

    limpiarFormulario();
    setMostrarModal(false);
    await cargarServicios();
  };

  const cambiarEstado = async (
    id: string,
    estadoActual: boolean
  ) => {
    const { error } = await supabase
      .from("servicios")
      .update({
        activo: !estadoActual,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error cambiando estado:", error);
      alert("No fue posible cambiar el estado.");
      return;
    }

    await cargarServicios();
  };

  const eliminarServicio = async (id: string) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este servicio?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("servicios")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error eliminando servicio:", error);
      alert(
        "No fue posible eliminar el servicio. Puede que esté utilizado en una factura."
      );
      return;
    }

    await cargarServicios();
  };

  const formatearPrecio = (valor: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(valor);
  };

  const serviciosFiltrados = servicios.filter((servicio) => {
    const texto = busqueda.toLowerCase();

    return (
      servicio.nombre?.toLowerCase().includes(texto) ||
      servicio.descripcion?.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Servicios</h2>
          <p>
            Administra los servicios ofrecidos por Aim High Cleaners.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={abrirNuevoServicio}
        >
          + Nuevo servicio
        </button>
      </div>

      <div className="content-panel">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar servicio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <span className="results-count">
            {serviciosFiltrados.length} servicios
          </span>
        </div>

        {cargando ? (
          <div className="loading-state">
            Cargando servicios...
          </div>
        ) : serviciosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧹</div>

            <h4>No hay servicios</h4>

            <p>
              Crea tu primer servicio para comenzar.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Impuesto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {serviciosFiltrados.map((servicio) => (
                  <tr key={servicio.id}>
                    <td>
                      <strong>{servicio.nombre}</strong>
                    </td>

                    <td>
                      {servicio.descripcion || "-"}
                    </td>

                    <td>
                      <strong>
                        {formatearPrecio(
                          Number(servicio.precio)
                        )}
                      </strong>
                    </td>

                    <td>
                      {Number(servicio.impuesto).toFixed(2)}%
                    </td>

                    <td>
                      <button
                        className={`status-button ${
                          servicio.activo
                            ? "status-active"
                            : "status-inactive"
                        }`}
                        onClick={() =>
                          cambiarEstado(
                            servicio.id,
                            servicio.activo
                          )
                        }
                      >
                        {servicio.activo
                          ? "Activo"
                          : "Inactivo"}
                      </button>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() =>
                            abrirEditarServicio(servicio)
                          }
                        >
                          Editar
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            eliminarServicio(servicio.id)
                          }
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            limpiarFormulario();
            setMostrarModal(false);
          }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>
                  {editandoId
                    ? "Editar servicio"
                    : "Nuevo servicio"}
                </h3>

                <p>
                  {editandoId
                    ? "Actualiza la información del servicio."
                    : "Registra un nuevo servicio."}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => {
                  limpiarFormulario();
                  setMostrarModal(false);
                }}
              >
                ×
              </button>
            </div>

            <form
              className="client-form"
              onSubmit={guardarServicio}
            >
              <div className="form-group">
                <label>Nombre del servicio *</label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value)
                  }
                  placeholder="Ej: House Cleaning"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>

                <textarea
                  value={descripcion}
                  onChange={(e) =>
                    setDescripcion(e.target.value)
                  }
                  placeholder="Descripción del servicio"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio (USD) *</label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precio}
                    onChange={(e) =>
                      setPrecio(e.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Impuesto (%)</label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={impuesto}
                    onChange={(e) =>
                      setImpuesto(e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    limpiarFormulario();
                    setMostrarModal(false);
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editandoId
                    ? "Actualizar servicio"
                    : "Guardar servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Servicios;