import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import "./Facturas.css";
import FacturaView from "./FacturaView";

interface Cliente {
  id: string;
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

interface Servicio {
  id: string;
  nombre: string;
  precio: number;
  impuesto: number;
  activo: boolean;
}

interface Factura {
  id: string;
  numero: number;
  fecha: string;
  subtotal: number;
  impuesto: number;
  descuento: number;
  total: number;
  estado: string;
  observaciones?: string | null;
  cliente_id: string | null;
}

interface Detalle {
  id?: string;
  servicio_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  impuesto: number;
  subtotal: number;
  total: number;
}

interface DetalleFactura {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modoEdicion, setModoEdicion] =
    useState(false);

  const [facturaEditandoId, setFacturaEditandoId] =
    useState<string | null>(null);

  const [clienteId, setClienteId] =
    useState("");

  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [descuento, setDescuento] =
    useState("0");

  const [observaciones, setObservaciones] =
    useState("");

  const [detalles, setDetalles] =
    useState<Detalle[]>([]);

  const [facturaSeleccionada, setFacturaSeleccionada] =
    useState<Factura | null>(null);

  const [detalleFactura, setDetalleFactura] =
    useState<DetalleFactura[]>([]);

  const [clienteFactura, setClienteFactura] =
    useState<Cliente | null>(null);

  /*
   * ==========================================
   * CARGAR DATOS
   * ==========================================
   */

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      const [
        facturasResponse,
        clientesResponse,
        serviciosResponse,
      ] = await Promise.all([
        supabase
          .from("facturas")
          .select(
            "id, numero, fecha, subtotal, impuesto, descuento, total, estado, observaciones, cliente_id"
          )
          .order("numero", {
            ascending: false,
          }),

        supabase
          .from("clientes")
          .select(
            "id, nombre, documento, telefono, email, direccion"
          )
          .order("nombre", {
            ascending: true,
          }),

        supabase
          .from("servicios")
          .select(
            "id, nombre, precio, impuesto, activo"
          )
          .eq("activo", true)
          .order("nombre", {
            ascending: true,
          }),
      ]);

      if (!activo) return;

      if (facturasResponse.error) {
        console.error(
          "Error cargando facturas:",
          facturasResponse.error
        );
      } else {
        setFacturas(
          facturasResponse.data ?? []
        );
      }

      if (clientesResponse.error) {
        console.error(
          "Error cargando clientes:",
          clientesResponse.error
        );
      } else {
        setClientes(
          clientesResponse.data ?? []
        );
      }

      if (serviciosResponse.error) {
        console.error(
          "Error cargando servicios:",
          serviciosResponse.error
        );
      } else {
        setServicios(
          serviciosResponse.data ?? []
        );
      }

      setCargando(false);
    };

    void cargarDatos();

    return () => {
      activo = false;
    };
  }, []);

  /*
   * ==========================================
   * RECARGAR FACTURAS
   * ==========================================
   */

  const cargarFacturas = async () => {
    const { data, error } = await supabase
      .from("facturas")
      .select(
        "id, numero, fecha, subtotal, impuesto, descuento, total, estado, observaciones, cliente_id"
      )
      .order("numero", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error cargando facturas:",
        error
      );
      return;
    }

    setFacturas(data ?? []);
  };

  /*
   * ==========================================
   * LIMPIAR FORMULARIO
   * ==========================================
   */

  const limpiarFormulario = () => {
    setClienteId("");

    setFecha(
      new Date()
        .toISOString()
        .split("T")[0]
    );

    setDescuento("0");
    setObservaciones("");
    setDetalles([]);

    setModoEdicion(false);
    setFacturaEditandoId(null);
  };

  /*
   * ==========================================
   * NUEVA FACTURA
   * ==========================================
   */

  const abrirNuevaFactura = () => {
    limpiarFormulario();
    setMostrarModal(true);
  };

  /*
   * ==========================================
   * AGREGAR DETALLE
   * ==========================================
   */

  const agregarDetalle = () => {
    setDetalles([
      ...detalles,
      {
        servicio_id: "",
        descripcion: "",
        cantidad: 1,
        precio_unitario: 0,
        impuesto: 0,
        subtotal: 0,
        total: 0,
      },
    ]);
  };

  /*
   * ==========================================
   * CAMBIAR SERVICIO
   * ==========================================
   */

  const cambiarServicio = (
    index: number,
    servicioId: string
  ) => {
    const servicio = servicios.find(
      (item) => item.id === servicioId
    );

    if (!servicio) return;

    const nuevosDetalles = [
      ...detalles,
    ];

    const cantidad =
      nuevosDetalles[index].cantidad || 1;

    /*
     * Cuando seleccionamos un servicio,
     * tomamos su precio base.
     *
     * Después el usuario puede
     * modificarlo manualmente.
     */

    const precio =
      Number(servicio.precio);

    const subtotal =
      cantidad * precio;

    const impuesto =
      subtotal *
      (Number(servicio.impuesto) / 100);

    nuevosDetalles[index] = {
      ...nuevosDetalles[index],

      servicio_id: servicio.id,

      descripcion:
        servicio.nombre,

      precio_unitario:
        precio,

      impuesto,

      subtotal,

      total:
        subtotal + impuesto,
    };

    setDetalles(nuevosDetalles);
  };

  /*
   * ==========================================
   * CAMBIAR CANTIDAD
   * ==========================================
   */

  const cambiarCantidad = (
    index: number,
    cantidad: number
  ) => {
    const nuevosDetalles = [
      ...detalles,
    ];

    const detalle =
      nuevosDetalles[index];

    const nuevaCantidad =
      cantidad > 0 ? cantidad : 1;

    const subtotal =
      nuevaCantidad *
      Number(
        detalle.precio_unitario
      );

    const impuestoPorcentaje =
      servicios.find(
        (servicio) =>
          servicio.id ===
          detalle.servicio_id
      )?.impuesto ?? 0;

    const impuesto =
      subtotal *
      (Number(impuestoPorcentaje) /
        100);

    nuevosDetalles[index] = {
      ...detalle,

      cantidad:
        nuevaCantidad,

      subtotal,

      impuesto,

      total:
        subtotal + impuesto,
    };

    setDetalles(nuevosDetalles);
  };

  /*
   * ==========================================
   * CAMBIAR PRECIO PERSONALIZADO
   * ==========================================
   */

  const cambiarPrecio = (
    index: number,
    precio: number
  ) => {
    const nuevosDetalles = [
      ...detalles,
    ];

    const detalle =
      nuevosDetalles[index];

    const nuevoPrecio =
      precio >= 0 ? precio : 0;

    const subtotal =
      Number(detalle.cantidad) *
      nuevoPrecio;

    const impuestoPorcentaje =
      servicios.find(
        (servicio) =>
          servicio.id ===
          detalle.servicio_id
      )?.impuesto ?? 0;

    const impuesto =
      subtotal *
      (Number(impuestoPorcentaje) /
        100);

    nuevosDetalles[index] = {
      ...detalle,

      precio_unitario:
        nuevoPrecio,

      subtotal,

      impuesto,

      total:
        subtotal + impuesto,
    };

    setDetalles(nuevosDetalles);
  };

  /*
   * ==========================================
   * ELIMINAR DETALLE
   * ==========================================
   */

  const eliminarDetalle = (
    index: number
  ) => {
    setDetalles(
      detalles.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  /*
   * ==========================================
   * TOTALES
   * ==========================================
   */

  const subtotalFactura =
    detalles.reduce(
      (total, detalle) =>
        total +
        Number(detalle.subtotal),
      0
    );

  const impuestoFactura =
    detalles.reduce(
      (total, detalle) =>
        total +
        Number(detalle.impuesto),
      0
    );

  const descuentoNumero =
    Number(descuento) || 0;

  const totalFactura = Math.max(
    subtotalFactura +
      impuestoFactura -
      descuentoNumero,
    0
  );

  /*
   * ==========================================
   * EDITAR FACTURA
   * ==========================================
   */

  const editarFactura = async (
    factura: Factura
  ) => {
    const {
      data: detallesFactura,
      error,
    } = await supabase
      .from("factura_detalle")
      .select(
        "id, servicio_id, descripcion, cantidad, precio_unitario, impuesto, subtotal, total"
      )
      .eq(
        "factura_id",
        factura.id
      )
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error cargando detalles:",
        error
      );

      alert(
        "No fue posible cargar los detalles de la factura."
      );

      return;
    }

    setModoEdicion(true);

    setFacturaEditandoId(
      factura.id
    );

    setClienteId(
      factura.cliente_id || ""
    );

    setFecha(factura.fecha);

    setDescuento(
      String(
        Number(
          factura.descuento
        )
      )
    );

    setObservaciones(
      factura.observaciones || ""
    );

    setDetalles(
      (detallesFactura ?? []).map(
        (detalle) => ({
          id: detalle.id,

          servicio_id:
            detalle.servicio_id,

          descripcion:
            detalle.descripcion,

          cantidad:
            Number(
              detalle.cantidad
            ),

          precio_unitario:
            Number(
              detalle.precio_unitario
            ),

          impuesto:
            Number(
              detalle.impuesto
            ),

          subtotal:
            Number(
              detalle.subtotal
            ),

          total:
            Number(
              detalle.total
            ),
        })
      )
    );

    setMostrarModal(true);
  };

  /*
   * ==========================================
   * GUARDAR / ACTUALIZAR FACTURA
   * ==========================================
   */

  const guardarFactura = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (guardando) return;

    if (!clienteId) {
      alert(
        "Selecciona un cliente."
      );
      return;
    }

    if (detalles.length === 0) {
      alert(
        "Agrega al menos un servicio."
      );
      return;
    }

    const detallesInvalidos =
      detalles.some(
        (detalle) =>
          !detalle.servicio_id ||
          detalle.cantidad <= 0 ||
          detalle.precio_unitario < 0
      );

    if (detallesInvalidos) {
      alert(
        "Revisa los servicios, cantidades y precios de la factura."
      );
      return;
    }

    setGuardando(true);

    try {
      /*
       * ======================================
       * EDITAR FACTURA
       * ======================================
       */

      if (
        modoEdicion &&
        facturaEditandoId
      ) {
        const {
          data: pagos,
          error: errorPagos,
        } = await supabase
          .from("pagos")
          .select("valor")
          .eq(
            "factura_id",
            facturaEditandoId
          );

        if (errorPagos) {
          console.error(
            "Error consultando pagos:",
            errorPagos
          );

          alert(
            "No fue posible verificar los pagos de la factura."
          );

          return;
        }

        const totalPagado =
          (pagos ?? []).reduce(
            (sum, pago) =>
              sum +
              Number(
                pago.valor
              ),
            0
          );

        if (
          totalFactura <
          totalPagado
        ) {
          alert(
            `El nuevo total (${formatearDinero(
              totalFactura
            )}) no puede ser menor que lo ya pagado (${formatearDinero(
              totalPagado
            )}).`
          );

          return;
        }

        const nuevoEstado =
          totalPagado >=
          totalFactura
            ? "PAGADA"
            : "PENDIENTE";

        const {
          error: errorFactura,
        } = await supabase
          .from("facturas")
          .update({
            cliente_id:
              clienteId,

            fecha,

            subtotal:
              subtotalFactura,

            impuesto:
              impuestoFactura,

            descuento:
              descuentoNumero,

            total:
              totalFactura,

            estado:
              nuevoEstado,

            observaciones:
              observaciones.trim() ||
              null,
          })
          .eq(
            "id",
            facturaEditandoId
          );

        if (errorFactura) {
          console.error(
            "Error actualizando factura:",
            errorFactura
          );

          alert(
            "No fue posible actualizar la factura."
          );

          return;
        }

        /*
         * Eliminamos los detalles
         * anteriores.
         */

        const {
          error: errorEliminarDetalles,
        } = await supabase
          .from("factura_detalle")
          .delete()
          .eq(
            "factura_id",
            facturaEditandoId
          );

        if (
          errorEliminarDetalles
        ) {
          console.error(
            "Error eliminando detalles:",
            errorEliminarDetalles
          );

          alert(
            "La factura se actualizó, pero no fue posible reemplazar sus detalles."
          );

          return;
        }

        /*
         * Guardamos los nuevos
         * detalles con el precio
         * personalizado.
         */

        const detallesParaGuardar =
          detalles.map(
            (detalle) => ({
              factura_id:
                facturaEditandoId,

              servicio_id:
                detalle.servicio_id,

              descripcion:
                detalle.descripcion,

              cantidad:
                detalle.cantidad,

              precio_unitario:
                detalle.precio_unitario,

              impuesto:
                detalle.impuesto,

              subtotal:
                detalle.subtotal,

              total:
                detalle.total,
            })
          );

        const {
          error: errorNuevosDetalles,
        } = await supabase
          .from("factura_detalle")
          .insert(
            detallesParaGuardar
          );

        if (
          errorNuevosDetalles
        ) {
          console.error(
            "Error guardando nuevos detalles:",
            errorNuevosDetalles
          );

          alert(
            "La factura fue actualizada, pero hubo un problema guardando los detalles."
          );

          return;
        }

        alert(
          "Factura actualizada correctamente."
        );
      } else {
        /*
         * ======================================
         * CREAR NUEVA FACTURA
         * ======================================
         */

        const {
          data: ultimaFactura,
          error: errorUltima,
        } = await supabase
          .from("facturas")
          .select("numero")
          .order("numero", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (errorUltima) {
          console.error(
            "Error obteniendo número:",
            errorUltima
          );

          alert(
            "No fue posible obtener el número de factura."
          );

          return;
        }

        const siguienteNumero =
          (ultimaFactura?.numero ??
            0) + 1;

        const {
          data: factura,
          error: errorFactura,
        } = await supabase
          .from("facturas")
          .insert({
            numero:
              siguienteNumero,

            cliente_id:
              clienteId,

            fecha,

            subtotal:
              subtotalFactura,

            impuesto:
              impuestoFactura,

            descuento:
              descuentoNumero,

            total:
              totalFactura,

            estado:
              "PENDIENTE",

            observaciones:
              observaciones.trim() ||
              null,
          })
          .select()
          .single();

        if (
          errorFactura ||
          !factura
        ) {
          console.error(
            "Error creando factura:",
            errorFactura
          );

          alert(
            "No fue posible crear la factura."
          );

          return;
        }

        const detallesParaGuardar =
          detalles.map(
            (detalle) => ({
              factura_id:
                factura.id,

              servicio_id:
                detalle.servicio_id,

              descripcion:
                detalle.descripcion,

              cantidad:
                detalle.cantidad,

              precio_unitario:
                detalle.precio_unitario,

              impuesto:
                detalle.impuesto,

              subtotal:
                detalle.subtotal,

              total:
                detalle.total,
            })
          );

        const {
          error: errorDetalles,
        } = await supabase
          .from("factura_detalle")
          .insert(
            detallesParaGuardar
          );

        if (errorDetalles) {
          console.error(
            "Error creando detalles:",
            errorDetalles
          );

          await supabase
            .from("facturas")
            .delete()
            .eq(
              "id",
              factura.id
            );

          alert(
            "No fue posible guardar los detalles de la factura."
          );

          return;
        }

        alert(
          "Factura creada correctamente."
        );
      }

      limpiarFormulario();
      setMostrarModal(false);

      await cargarFacturas();
    } finally {
      setGuardando(false);
    }
  };

  /*
   * ==========================================
   * ELIMINAR FACTURA
   * ==========================================
   */

  const eliminarFactura = async (
    factura: Factura
  ) => {
    const confirmar =
      window.confirm(
        `¿Seguro que deseas eliminar la factura #${factura.numero}?\n\nTambién se eliminarán sus detalles y pagos asociados.`
      );

    if (!confirmar) return;

    const {
      error: errorPagos,
    } = await supabase
      .from("pagos")
      .delete()
      .eq(
        "factura_id",
        factura.id
      );

    if (errorPagos) {
      console.error(
        "Error eliminando pagos:",
        errorPagos
      );

      alert(
        "No fue posible eliminar los pagos asociados."
      );

      return;
    }

    const {
      error: errorDetalles,
    } = await supabase
      .from("factura_detalle")
      .delete()
      .eq(
        "factura_id",
        factura.id
      );

    if (errorDetalles) {
      console.error(
        "Error eliminando detalles:",
        errorDetalles
      );

      alert(
        "No fue posible eliminar los detalles de la factura."
      );

      return;
    }

    const {
      error: errorFactura,
    } = await supabase
      .from("facturas")
      .delete()
      .eq(
        "id",
        factura.id
      );

    if (errorFactura) {
      console.error(
        "Error eliminando factura:",
        errorFactura
      );

      alert(
        "No fue posible eliminar la factura."
      );

      return;
    }

    alert(
      "Factura eliminada correctamente."
    );

    await cargarFacturas();
  };

  /*
   * ==========================================
   * VER FACTURA
   * ==========================================
   */

  const verFactura = async (
    factura: Factura
  ) => {
    if (!factura.cliente_id) {
      alert(
        "Esta factura no tiene cliente."
      );
      return;
    }

    const {
      data: cliente,
      error: errorCliente,
    } = await supabase
      .from("clientes")
      .select(
        "id, nombre, documento, telefono, email, direccion"
      )
      .eq(
        "id",
        factura.cliente_id
      )
      .single();

    if (
      errorCliente ||
      !cliente
    ) {
      console.error(
        "Error cargando cliente:",
        errorCliente
      );

      alert(
        "No fue posible cargar el cliente."
      );

      return;
    }

    const {
      data: detalles,
      error: errorDetalles,
    } = await supabase
      .from("factura_detalle")
      .select(
        "descripcion, cantidad, precio_unitario, total"
      )
      .eq(
        "factura_id",
        factura.id
      )
      .order("created_at", {
        ascending: true,
      });

    if (errorDetalles) {
      console.error(
        "Error cargando detalles:",
        errorDetalles
      );

      alert(
        "No fue posible cargar los detalles de la factura."
      );

      return;
    }

    setClienteFactura(cliente);

    setDetalleFactura(
      detalles ?? []
    );

    setFacturaSeleccionada(
      factura
    );
  };

  /*
   * ==========================================
   * CERRAR VISTA
   * ==========================================
   */

  const cerrarFactura = () => {
    setFacturaSeleccionada(
      null
    );

    setClienteFactura(null);

    setDetalleFactura([]);
  };

  /*
   * ==========================================
   * FORMATO DINERO
   * ==========================================
   */

  const formatearDinero = (
    valor: number
  ) => {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
      }
    ).format(
      Number(valor) || 0
    );
  };

  /*
   * ==========================================
   * FORMATO FECHA
   * ==========================================
   */

  const formatearFecha = (
    fechaFactura: string
  ) => {
    const partes =
      fechaFactura.split("-");

    if (partes.length !== 3) {
      return fechaFactura;
    }

    return `${partes[1]}/${partes[2]}/${partes[0]}`;
  };

  /*
   * ==========================================
   * FILTRO
   * ==========================================
   */

  const facturasFiltradas =
    facturas.filter(
      (factura) => {
        const texto =
          busqueda.toLowerCase();

        const cliente =
          clientes.find(
            (item) =>
              item.id ===
              factura.cliente_id
          );

        return (
          String(
            factura.numero
          )
            .toLowerCase()
            .includes(texto) ||
          cliente?.nombre
            ?.toLowerCase()
            .includes(texto) ||
          factura.estado
            ?.toLowerCase()
            .includes(texto)
        );
      }
    );

  /*
   * ==========================================
   * VISTA DE FACTURA
   * ==========================================
   */

  if (
    facturaSeleccionada &&
    clienteFactura
  ) {
    return (
      <FacturaView
        numero={
          facturaSeleccionada.numero
        }
        fecha={
          facturaSeleccionada.fecha
        }
        cliente={
          clienteFactura
        }
        detalles={
          detalleFactura
        }
        subtotal={
          facturaSeleccionada.subtotal
        }
        impuesto={
          facturaSeleccionada.impuesto
        }
        descuento={
          facturaSeleccionada.descuento
        }
        total={
          facturaSeleccionada.total
        }
        onClose={
          cerrarFactura
        }
      />
    );
  }

  /*
   * ==========================================
   * INTERFAZ
   * ==========================================
   */

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>
            Facturas
          </h2>

          <p>
            Administra las facturas de
            Aim High Cleaners.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={
            abrirNuevaFactura
          }
        >
          + Nueva factura
        </button>
      </div>

      <div className="content-panel">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar factura..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
          />

          <span className="results-count">
            {
              facturasFiltradas.length
            }{" "}
            facturas
          </span>
        </div>

        {cargando ? (
          <div className="loading-state">
            Cargando facturas...
          </div>
        ) : facturasFiltradas.length ===
          0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              🧾
            </div>

            <h4>
              No hay facturas
            </h4>

            <p>
              Crea tu primera factura
              para comenzar.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Subtotal</th>
                  <th>Impuesto</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {facturasFiltradas.map(
                  (factura) => {
                    const cliente =
                      clientes.find(
                        (item) =>
                          item.id ===
                          factura.cliente_id
                      );

                    return (
                      <tr
                        key={
                          factura.id
                        }
                      >
                        <td>
                          <strong>
                            #
                            {
                              factura.numero
                            }
                          </strong>
                        </td>

                        <td>
                          {cliente?.nombre ||
                            "-"}
                        </td>

                        <td>
                          {formatearFecha(
                            factura.fecha
                          )}
                        </td>

                        <td>
                          {formatearDinero(
                            factura.subtotal
                          )}
                        </td>

                        <td>
                          {formatearDinero(
                            factura.impuesto
                          )}
                        </td>

                        <td>
                          <strong>
                            {formatearDinero(
                              factura.total
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`invoice-status ${
                              factura.estado ===
                              "PAGADA"
                                ? "status-paid"
                                : "status-pending"
                            }`}
                          >
                            {
                              factura.estado
                            }
                          </span>
                        </td>

                        <td>
                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "6px",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <button
                              type="button"
                              className="view-invoice-button"
                              onClick={() =>
                                verFactura(
                                  factura
                                )
                              }
                            >
                              👁 Ver
                            </button>

                            <button
                              type="button"
                              className="edit-button"
                              onClick={() =>
                                editarFactura(
                                  factura
                                )
                              }
                            >
                              ✏️ Editar
                            </button>

                            <button
                              type="button"
                              className="delete-button"
                              onClick={() =>
                                eliminarFactura(
                                  factura
                                )
                              }
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================
          MODAL CREAR / EDITAR
      ===================================== */}

      {mostrarModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            limpiarFormulario();
            setMostrarModal(
              false
            );
          }}
        >
          <div
            className="invoice-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h3>
                  {modoEdicion
                    ? "Editar factura"
                    : "Nueva factura"}
                </h3>

                <p>
                  {modoEdicion
                    ? "Modifica la información de la factura."
                    : "Crea una nueva factura para tu cliente."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  limpiarFormulario();
                  setMostrarModal(
                    false
                  );
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                guardarFactura
              }
            >
              <div className="invoice-form-grid">
                <div className="form-group">
                  <label>
                    Cliente *
                  </label>

                  <select
                    value={
                      clienteId
                    }
                    onChange={(e) =>
                      setClienteId(
                        e.target
                          .value
                      )
                    }
                    required
                  >
                    <option value="">
                      Selecciona un cliente
                    </option>

                    {clientes.map(
                      (
                        cliente
                      ) => (
                        <option
                          key={
                            cliente.id
                          }
                          value={
                            cliente.id
                          }
                        >
                          {
                            cliente.nombre
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Fecha *
                  </label>

                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) =>
                      setFecha(
                        e.target
                          .value
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="invoice-details-section">
                <div className="invoice-section-header">
                  <div>
                    <h4>
                      Servicios
                    </h4>

                    <p>
                      Puedes personalizar
                      el precio de cada
                      servicio para este
                      cliente.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="add-detail-button"
                    onClick={
                      agregarDetalle
                    }
                  >
                    + Agregar servicio
                  </button>
                </div>

                {detalles.length ===
                0 ? (
                  <div className="details-empty">
                    <span>
                      🧹
                    </span>

                    <p>
                      Todavía no has
                      agregado servicios.
                    </p>
                  </div>
                ) : (
                  <div className="invoice-details">
                    {detalles.map(
                      (
                        detalle,
                        index
                      ) => (
                        <div
                          className="invoice-detail-row"
                          key={
                            detalle.id ||
                            index
                          }
                        >
                          <div className="form-group service-field">
                            <label>
                              Servicio
                            </label>

                            <select
                              value={
                                detalle.servicio_id
                              }
                              onChange={(
                                e
                              ) =>
                                cambiarServicio(
                                  index,
                                  e
                                    .target
                                    .value
                                )
                              }
                              required
                            >
                              <option value="">
                                Selecciona
                              </option>

                              {servicios.map(
                                (
                                  servicio
                                ) => (
                                  <option
                                    key={
                                      servicio.id
                                    }
                                    value={
                                      servicio.id
                                    }
                                  >
                                    {
                                      servicio.nombre
                                    }{" "}
                                    -{" "}
                                    {formatearDinero(
                                      Number(
                                        servicio.precio
                                      )
                                    )}
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div className="form-group quantity-field">
                            <label>
                              Cantidad
                            </label>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={
                                detalle.cantidad
                              }
                              onChange={(
                                e
                              ) =>
                                cambiarCantidad(
                                  index,
                                  Number(
                                    e
                                      .target
                                      .value
                                  )
                                )
                              }
                            />
                          </div>

                          {/* PRECIO EDITABLE */}

                          <div
                            className="form-group"
                            style={{
                              width:
                                "150px",
                              minWidth:
                                "150px",
                            }}
                          >
                            <label>
                              Precio $
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                detalle.precio_unitario
                              }
                              onChange={(
                                e
                              ) =>
                                cambiarPrecio(
                                  index,
                                  Number(
                                    e
                                      .target
                                      .value
                                  )
                                )
                              }
                              title="Precio personalizado para este cliente"
                            />
                          </div>

                          <div className="detail-total">
                            <span>
                              Total
                            </span>

                            <strong>
                              {formatearDinero(
                                detalle.total
                              )}
                            </strong>
                          </div>

                          <button
                            type="button"
                            className="remove-detail-button"
                            onClick={() =>
                              eliminarDetalle(
                                index
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="invoice-bottom">
                <div className="form-group observations-field">
                  <label>
                    Observaciones
                  </label>

                  <textarea
                    value={
                      observaciones
                    }
                    onChange={(e) =>
                      setObservaciones(
                        e.target
                          .value
                      )
                    }
                    placeholder="Notas adicionales..."
                    rows={4}
                  />
                </div>

                <div className="invoice-summary">
                  <div>
                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {formatearDinero(
                        subtotalFactura
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Impuestos
                    </span>

                    <strong>
                      {formatearDinero(
                        impuestoFactura
                      )}
                    </strong>
                  </div>

                  <div className="discount-row">
                    <span>
                      Descuento
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        descuento
                      }
                      onChange={(e) =>
                        setDescuento(
                          e.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="invoice-grand-total">
                    <span>
                      Total
                    </span>

                    <strong>
                      {formatearDinero(
                        totalFactura
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    limpiarFormulario();
                    setMostrarModal(
                      false
                    );
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    guardando
                  }
                >
                  {guardando
                    ? "Guardando..."
                    : modoEdicion
                    ? "Actualizar factura"
                    : "Guardar factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Facturas;