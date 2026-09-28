import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "./Clientes.css";

interface Cliente {
  id: string;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}

function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nombre", { ascending: true });

      if (!activo) return;

      if (error) {
        console.error("Error cargando clientes:", error);
        setCargando(false);
        return;
      }

      setClientes(data ?? []);
      setCargando(false);
    };

    void cargar();

    return () => {
      activo = false;
    };
  }, []);

  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error cargando clientes:", error);
      return;
    }

    setClientes(data ?? []);
  };

  const limpiarFormulario = () => {
    setNombre("");
    setDocumento("");
    setTelefono("");
    setEmail("");
    setDireccion("");
    setEditandoId(null);
  };

  const abrirNuevoCliente = () => {
    limpiarFormulario();
    setMostrarModal(true);
  };

  const abrirEditarCliente = (cliente: Cliente) => {
    setEditandoId(cliente.id);
    setNombre(cliente.nombre || "");
    setDocumento(cliente.documento || "");
    setTelefono(cliente.telefono || "");
    setEmail(cliente.email || "");
    setDireccion(cliente.direccion || "");
    setMostrarModal(true);
  };

  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      alert("El nombre del cliente es obligatorio.");
      return;
    }

    if (editandoId) {
      const { error } = await supabase
        .from("clientes")
        .update({
          nombre: nombre.trim(),
          documento: documento.trim() || null,
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          direccion: direccion.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editandoId);

      if (error) {
        console.error("Error actualizando cliente:", error);
        alert("No fue posible actualizar el cliente.");
        return;
      }
    } else {
      const { error } = await supabase
        .from("clientes")
        .insert({
          nombre: nombre.trim(),
          documento: documento.trim() || null,
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          direccion: direccion.trim() || null,
        });

      if (error) {
        console.error("Error creando cliente:", error);
        alert("No fue posible crear el cliente.");
        return;
      }
    }

    limpiarFormulario();
    setMostrarModal(false);
    await cargarClientes();
  };

  const eliminarCliente = async (id: string) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este cliente?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error eliminando cliente:", error);
      alert("No fue posible eliminar el cliente.");
      return;
    }

    await cargarClientes();
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase();

    return (
      cliente.nombre?.toLowerCase().includes(texto) ||
      cliente.documento?.toLowerCase().includes(texto) ||
      cliente.email?.toLowerCase().includes(texto) ||
      cliente.telefono?.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Clientes</h2>
          <p>Administra los clientes de Aim High Cleaners.</p>
        </div>

        <button
          className="primary-button"
          onClick={abrirNuevoCliente}
        >
          + Nuevo cliente
        </button>
      </div>

      <div className="content-panel">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <span className="results-count">
            {clientesFiltrados.length} clientes
          </span>
        </div>

        {cargando ? (
          <div className="loading-state">
            Cargando clientes...
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h4>No hay clientes</h4>
            <p>Crea tu primer cliente para comenzar.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <strong>{cliente.nombre}</strong>
                    </td>

                    <td>
                      {cliente.documento || "-"}
                    </td>

                    <td>
                      {cliente.telefono || "-"}
                    </td>

                    <td>
                      {cliente.email || "-"}
                    </td>

                    <td>
                      {cliente.direccion || "-"}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() =>
                            abrirEditarCliente(cliente)
                          }
                        >
                          Editar
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            eliminarCliente(cliente.id)
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
                    ? "Editar cliente"
                    : "Nuevo cliente"}
                </h3>

                <p>
                  {editandoId
                    ? "Actualiza la información del cliente."
                    : "Registra la información del cliente."}
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
              onSubmit={guardarCliente}
            >
              <div className="form-group">
                <label>Nombre *</label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value)
                  }
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Documento</label>

                  <input
                    type="text"
                    value={documento}
                    onChange={(e) =>
                      setDocumento(e.target.value)
                    }
                    placeholder="ID / Tax ID"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>

                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) =>
                      setTelefono(e.target.value)
                    }
                    placeholder="Phone"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="customer@email.com"
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>

                <input
                  type="text"
                  value={direccion}
                  onChange={(e) =>
                    setDireccion(e.target.value)
                  }
                  placeholder="Address"
                />
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
                    ? "Actualizar cliente"
                    : "Guardar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;