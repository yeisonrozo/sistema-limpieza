import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import ComprobantePago from "./ComprobantePago";
import "./Pagos.css";

interface Factura {
  id: string;
  numero: number;
  cliente_id: string | null;
  fecha: string;
  subtotal: number;
  impuesto: number;
  descuento: number;
  total: number;
  estado: string;
  observaciones: string | null;
}

interface Cliente {
  id: string;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}

interface Pago {
  id: string;
  factura_id: string;
  fecha: string;
  valor: number;
  metodo_pago: string | null;
  observacion: string | null;
  created_at?: string;
}

interface FacturaConPago extends Factura {
  cliente?: Cliente | null;
  totalPagado: number;
  pendiente: number;
}

function Pagos() {
  const [facturas, setFacturas] = useState<FacturaConPago[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [cargando, setCargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [pagoEditando, setPagoEditando] = useState<Pago | null>(null);

  const [facturaSeleccionada, setFacturaSeleccionada] =
    useState<FacturaConPago | null>(null);

  const [valorPago, setValorPago] = useState("");

  const [fechaPago, setFechaPago] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [metodoPago, setMetodoPago] = useState("Check");

  const [observacion, setObservacion] = useState("");

  const [busqueda, setBusqueda] = useState("");

  const [comprobanteAbierto, setComprobanteAbierto] =
    useState(false);

  const [pagoComprobante, setPagoComprobante] =
    useState<Pago | null>(null);

  /*
   * =========================================================
   * CARGAR DATOS
   * =========================================================
   */

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);

      const [
        facturasResponse,
        pagosResponse,
        clientesResponse,
      ] = await Promise.all([
        supabase
          .from("facturas")
          .select("*")
          .order("numero", { ascending: false }),

        supabase
          .from("pagos")
          .select("*")
          .order("fecha", { ascending: false })
          .order("created_at", { ascending: false }),

        supabase
          .from("clientes")
          .select("*")
          .order("nombre", { ascending: true }),
      ]);

      if (facturasResponse.error) {
        console.error(
          "Error cargando facturas:",
          facturasResponse.error
        );
      }

      if (pagosResponse.error) {
        console.error(
          "Error cargando pagos:",
          pagosResponse.error
        );
      }

      if (clientesResponse.error) {
        console.error(
          "Error cargando clientes:",
          clientesResponse.error
        );
      }

      const facturasData =
        (facturasResponse.data as Factura[]) || [];

      const pagosData =
        (pagosResponse.data as Pago[]) || [];

      const clientesData =
        (clientesResponse.data as Cliente[]) || [];

      const facturasConPago: FacturaConPago[] =
        facturasData.map((factura) => {
          const cliente =
            clientesData.find(
              (item) =>
                item.id === factura.cliente_id
            ) || null;

          const totalPagado = pagosData
            .filter(
              (pago) =>
                pago.factura_id === factura.id
            )
            .reduce(
              (total, pago) =>
                total + Number(pago.valor || 0),
              0
            );

          const pendiente = Math.max(
            Number(factura.total || 0) -
              totalPagado,
            0
          );

          return {
            ...factura,
            cliente,
            totalPagado,
            pendiente,
          };
        });

      setFacturas(facturasConPago);
      setPagos(pagosData);
      setClientes(clientesData);
    } catch (error) {
      console.error(
        "Error cargando datos:",
        error
      );
    } finally {
      setCargando(false);
    }
  }, []);

  /*
   * =========================================================
   * CARGA INICIAL
   * =========================================================
   */

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, [cargarDatos]);

  /*
   * =========================================================
   * FORMATO DINERO
   * =========================================================
   */

  const dinero = (valor: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(valor) || 0);
  };

  /*
   * =========================================================
   * FORMATO FECHA
   * =========================================================
   */

  const formatearFecha = (fecha: string) => {
    if (!fecha) {
      return "-";
    }

    const partes = fecha.split("-");

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[1]}/${partes[2]}/${partes[0]}`;
  };

  /*
   * =========================================================
   * BUSCAR FACTURA
   * =========================================================
   */

  const facturaCoincide = (
    factura: FacturaConPago,
    texto: string
  ) => {
    const cliente = factura.cliente;

    const numero = String(factura.numero);

    const nombre =
      cliente?.nombre?.toLowerCase() || "";

    const documento =
      cliente?.documento?.toLowerCase() || "";

    const telefono =
      cliente?.telefono?.toLowerCase() || "";

    const email =
      cliente?.email?.toLowerCase() || "";

    const busquedaNormalizada =
      texto.toLowerCase().trim();

    return (
      numero.includes(busquedaNormalizada) ||
      nombre.includes(busquedaNormalizada) ||
      documento.includes(busquedaNormalizada) ||
      telefono.includes(busquedaNormalizada) ||
      email.includes(busquedaNormalizada)
    );
  };

  /*
   * =========================================================
   * ABRIR NUEVO PAGO
   * =========================================================
   */

  const abrirNuevoPago = (
    factura: FacturaConPago
  ) => {
    if (factura.pendiente <= 0) {
      alert(
        "Esta factura ya está pagada en su totalidad."
      );

      return;
    }

    setModoEdicion(false);
    setPagoEditando(null);

    setFacturaSeleccionada(factura);

    setValorPago("");

    setFechaPago(
      new Date().toISOString().split("T")[0]
    );

    setMetodoPago("Check");

    setObservacion("");

    setModalAbierto(true);
  };

  /*
   * =========================================================
   * EDITAR PAGO
   * =========================================================
   */

  const abrirEditarPago = (pago: Pago) => {
    const factura = facturas.find(
      (item) =>
        item.id === pago.factura_id
    );

    if (!factura) {
      alert(
        "No se encontró la factura asociada al pago."
      );

      return;
    }

    const totalOtrosPagos = pagos
      .filter(
        (item) =>
          item.factura_id === pago.factura_id &&
          item.id !== pago.id
      )
      .reduce(
        (total, item) =>
          total + Number(item.valor || 0),
        0
      );

    const saldoDisponible = Math.max(
      Number(factura.total || 0) -
        totalOtrosPagos,
      0
    );

    setModoEdicion(true);

    setPagoEditando(pago);

    setFacturaSeleccionada({
      ...factura,
      totalPagado: totalOtrosPagos,
      pendiente: saldoDisponible,
    });

    setValorPago(
      String(pago.valor)
    );

    setFechaPago(
      pago.fecha
    );

    setMetodoPago(
      pago.metodo_pago || "Check"
    );

    setObservacion(
      pago.observacion || ""
    );

    setModalAbierto(true);
  };

  /*
   * =========================================================
   * CERRAR MODAL
   * =========================================================
   */

  const cerrarModal = () => {
    setModalAbierto(false);

    setModoEdicion(false);

    setPagoEditando(null);

    setFacturaSeleccionada(null);

    setValorPago("");

    setObservacion("");
  };

  /*
   * =========================================================
   * GUARDAR PAGO
   * =========================================================
   */

  const guardarPago = async () => {
    if (!facturaSeleccionada) {
      alert("Selecciona una factura.");
      return;
    }

    const valor = Number(valorPago);

    if (!valor || valor <= 0) {
      alert(
        "Ingresa un valor de pago válido."
      );

      return;
    }

    const saldoDisponible =
      Number(
        facturaSeleccionada.pendiente || 0
      );

    if (
      valor >
      saldoDisponible + 0.01
    ) {
      alert(
        `El pago no puede ser mayor al saldo disponible de ${dinero(
          saldoDisponible
        )}.`
      );

      return;
    }

    try {
      /*
       * =====================================================
       * EDITAR PAGO
       * =====================================================
       */

      if (
        modoEdicion &&
        pagoEditando
      ) {
        const { error } =
          await supabase
            .from("pagos")
            .update({
              fecha: fechaPago,
              valor,
              metodo_pago: metodoPago,
              observacion:
                observacion.trim() ||
                null,
            })
            .eq(
              "id",
              pagoEditando.id
            );

        if (error) {
          console.error(
            "Error actualizando pago:",
            error
          );

          alert(
            "No fue posible actualizar el pago."
          );

          return;
        }

        const otrosPagos = pagos
          .filter(
            (item) =>
              item.factura_id ===
                pagoEditando.factura_id &&
              item.id !==
                pagoEditando.id
          )
          .reduce(
            (total, item) =>
              total +
              Number(item.valor || 0),
            0
          );

        const nuevoTotalPagado =
          otrosPagos + valor;

        let nuevoEstado = "PENDIENTE";

        if (
          nuevoTotalPagado >=
          Number(
            facturaSeleccionada.total
          ) - 0.01
        ) {
          nuevoEstado = "PAID IN FULL";
        } else if (
          nuevoTotalPagado > 0
        ) {
          nuevoEstado = "PARTIAL";
        }

        const { error: facturaError } =
          await supabase
            .from("facturas")
            .update({
              estado: nuevoEstado,
            })
            .eq(
              "id",
              facturaSeleccionada.id
            );

        if (facturaError) {
          console.error(
            "Error actualizando estado de factura:",
            facturaError
          );
        }

        alert(
          "Pago actualizado correctamente."
        );

        cerrarModal();

        await cargarDatos();

        return;
      }

      /*
       * =====================================================
       * NUEVO PAGO
       * =====================================================
       */

      const { error: pagoError } =
        await supabase
          .from("pagos")
          .insert({
            factura_id:
              facturaSeleccionada.id,
            fecha: fechaPago,
            valor,
            metodo_pago: metodoPago,
            observacion:
              observacion.trim() ||
              null,
          });

      if (pagoError) {
        console.error(
          "Error registrando pago:",
          pagoError
        );

        alert(
          "No fue posible registrar el pago."
        );

        return;
      }

      const nuevoTotalPagado =
        Number(
          facturaSeleccionada.totalPagado ||
            0
        ) + valor;

      let nuevoEstado = "PENDIENTE";

      if (
        nuevoTotalPagado >=
        Number(
          facturaSeleccionada.total
        ) - 0.01
      ) {
        nuevoEstado = "PAID IN FULL";
      } else if (
        nuevoTotalPagado > 0
      ) {
        nuevoEstado = "PARTIAL";
      }

      const { error: facturaError } =
        await supabase
          .from("facturas")
          .update({
            estado: nuevoEstado,
          })
          .eq(
            "id",
            facturaSeleccionada.id
          );

      if (facturaError) {
        console.error(
          "Error actualizando estado de factura:",
          facturaError
        );
      }

      alert(
        "Pago registrado correctamente."
      );

      cerrarModal();

      await cargarDatos();
    } catch (error) {
      console.error(
        "Error guardando pago:",
        error
      );

      alert(
        "Ocurrió un error al guardar el pago."
      );
    }
  };

  /*
   * =========================================================
   * ELIMINAR PAGO
   * =========================================================
   */

  const eliminarPago = async (
    pago: Pago
  ) => {
    const confirmar = window.confirm(
      "¿Estás seguro de eliminar este pago?"
    );

    if (!confirmar) {
      return;
    }

    try {
      const factura = facturas.find(
        (item) =>
          item.id === pago.factura_id
      );

      const { error } =
        await supabase
          .from("pagos")
          .delete()
          .eq("id", pago.id);

      if (error) {
        console.error(
          "Error eliminando pago:",
          error
        );

        alert(
          "No fue posible eliminar el pago."
        );

        return;
      }

      if (factura) {
        const totalPagadoRestante =
          pagos
            .filter(
              (item) =>
                item.factura_id ===
                  pago.factura_id &&
                item.id !== pago.id
            )
            .reduce(
              (total, item) =>
                total +
                Number(item.valor || 0),
              0
            );

        let nuevoEstado = "PENDIENTE";

        if (
          totalPagadoRestante >=
          Number(factura.total) - 0.01
        ) {
          nuevoEstado = "PAID IN FULL";
        } else if (
          totalPagadoRestante > 0
        ) {
          nuevoEstado = "PARTIAL";
        }

        const { error: facturaError } =
          await supabase
            .from("facturas")
            .update({
              estado: nuevoEstado,
            })
            .eq(
              "id",
              factura.id
            );

        if (facturaError) {
          console.error(
            "Error actualizando estado de factura:",
            facturaError
          );
        }
      }

      alert(
        "Pago eliminado correctamente."
      );

      await cargarDatos();
    } catch (error) {
      console.error(
        "Error eliminando pago:",
        error
      );

      alert(
        "Ocurrió un error al eliminar el pago."
      );
    }
  };

  /*
   * =========================================================
   * VER COMPROBANTE
   * =========================================================
   */

  const verComprobante = (
    pago: Pago
  ) => {
    setPagoComprobante(pago);

    setComprobanteAbierto(true);
  };

  /*
   * =========================================================
   * CERRAR COMPROBANTE
   * =========================================================
   */

  const cerrarComprobante = () => {
    setComprobanteAbierto(false);

    setPagoComprobante(null);
  };

  /*
   * =========================================================
   * INFORMACIÓN DEL COMPROBANTE
   * =========================================================
   */

  let comprobanteFactura:
    | FacturaConPago
    | null = null;

  let comprobanteCliente:
    | Cliente
    | null = null;

  let comprobanteTotalPagado = 0;

  let comprobanteSaldo = 0;

  if (pagoComprobante) {
    comprobanteFactura =
      facturas.find(
        (factura) =>
          factura.id ===
          pagoComprobante.factura_id
      ) || null;

    if (comprobanteFactura) {
      comprobanteCliente =
        comprobanteFactura.cliente ||
        clientes.find(
          (cliente) =>
            cliente.id ===
            comprobanteFactura?.cliente_id
        ) ||
        null;

      const pagosAnteriores =
        pagos
          .filter(
            (pago) =>
              pago.factura_id ===
                comprobanteFactura?.id &&
              pago.id !==
                pagoComprobante.id
          )
          .reduce(
            (total, pago) =>
              total +
              Number(pago.valor || 0),
            0
          );

      comprobanteTotalPagado =
        pagosAnteriores +
        Number(
          pagoComprobante.valor || 0
        );

      comprobanteSaldo = Math.max(
        Number(
          comprobanteFactura.total || 0
        ) -
          comprobanteTotalPagado,
        0
      );
    }
  }

  /*
   * =========================================================
   * FACTURAS FILTRADAS
   * =========================================================
   */

  const facturasFiltradas =
    facturas.filter(
      (factura) =>
        facturaCoincide(
          factura,
          busqueda
        )
    );

  /*
   * =========================================================
   * ESTADÍSTICAS
   * =========================================================
   */

  const totalFacturado =
    facturas.reduce(
      (total, factura) =>
        total +
        Number(
          factura.total || 0
        ),
      0
    );

  const totalCobrado =
    pagos.reduce(
      (total, pago) =>
        total +
        Number(
          pago.valor || 0
        ),
      0
    );

  const totalPendiente =
    Math.max(
      totalFacturado -
        totalCobrado,
      0
    );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="pagos-page">

      {/* ===================================================
          ENCABEZADO
      =================================================== */}

      <div className="pagos-header">

        <div>
          <h2>Pagos</h2>

          <p>
            Administra los pagos y saldos de
            tus facturas.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            const facturaPendiente =
              facturas.find(
                (factura) =>
                  factura.pendiente > 0
              );

            if (!facturaPendiente) {
              alert(
                "No hay facturas con saldo pendiente."
              );

              return;
            }

            abrirNuevoPago(
              facturaPendiente
            );
          }}
        >
          + Registrar pago
        </button>

      </div>

      {/* ===================================================
          ESTADÍSTICAS
      =================================================== */}

      <div className="pagos-stats">

        <div className="pago-stat-card">

          <div>
            <span>
              Total facturado
            </span>

            <strong>
              {dinero(
                totalFacturado
              )}
            </strong>
          </div>

          <div className="pago-stat-icon">
            🧾
          </div>

        </div>

        <div className="pago-stat-card">

          <div>
            <span>
              Total cobrado
            </span>

            <strong>
              {dinero(
                totalCobrado
              )}
            </strong>
          </div>

          <div className="pago-stat-icon">
            💵
          </div>

        </div>

        <div className="pago-stat-card">

          <div>
            <span>
              Saldo pendiente
            </span>

            <strong>
              {dinero(
                totalPendiente
              )}
            </strong>
          </div>

          <div className="pago-stat-icon">
            ⏳
          </div>

        </div>

        <div className="pago-stat-card">

          <div>
            <span>
              Pagos registrados
            </span>

            <strong>
              {pagos.length}
            </strong>
          </div>

          <div className="pago-stat-icon">
            💳
          </div>

        </div>

      </div>

      {/* ===================================================
          BUSCADOR
      =================================================== */}

      <div className="pagos-toolbar">

        <div className="pagos-search">

          <span>
            🔎
          </span>

          <input
            type="text"
            placeholder="Buscar por factura, cliente, teléfono..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
          />

        </div>

      </div>

      {/* ===================================================
          FACTURAS
      =================================================== */}

      <div className="pagos-section">

        <div className="section-title">

          <div>

            <h3>
              Facturas
            </h3>

            <p>
              Registra pagos sobre las
              facturas pendientes.
            </p>

          </div>

        </div>

        {cargando ? (
          <div className="pagos-loading">
            Cargando información...
          </div>
        ) : facturasFiltradas.length === 0 ? (
          <div className="pagos-empty">
            No se encontraron facturas.
          </div>
        ) : (
          <div className="pagos-table-wrapper">

            <table className="pagos-table">

              <thead>

                <tr>
                  <th>Factura</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Pagado</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>

              </thead>

              <tbody>

                {facturasFiltradas.map(
                  (factura) => (
                    <tr key={factura.id}>

                      <td>

                        <strong>
                          #
                          {String(
                            factura.numero
                          ).padStart(
                            4,
                            "0"
                          )}
                        </strong>

                      </td>

                      <td>

                        <div className="cliente-table">

                          <strong>
                            {factura
                              .cliente
                              ?.nombre ||
                              "Sin cliente"}
                          </strong>

                          {factura
                            .cliente
                            ?.telefono && (
                            <span>
                              {
                                factura
                                  .cliente
                                  .telefono
                              }
                            </span>
                          )}

                        </div>

                      </td>

                      <td>
                        {formatearFecha(
                          factura.fecha
                        )}
                      </td>

                      <td>

                        <strong>
                          {dinero(
                            Number(
                              factura.total
                            )
                          )}
                        </strong>

                      </td>

                      <td>

                        <span className="text-success">
                          {dinero(
                            factura.totalPagado
                          )}
                        </span>

                      </td>

                      <td>

                        <span
                          className={
                            factura.pendiente >
                            0
                              ? "text-warning"
                              : "text-success"
                          }
                        >
                          {dinero(
                            factura.pendiente
                          )}
                        </span>

                      </td>

                      <td>

                        <span
                          className={`estado-badge ${
                            factura.pendiente <=
                            0
                              ? "estado-paid"
                              : factura.totalPagado >
                                0
                              ? "estado-partial"
                              : "estado-pending"
                          }`}
                        >
                          {factura.pendiente <=
                          0
                            ? "PAID IN FULL"
                            : factura.totalPagado >
                              0
                            ? "PARTIAL"
                            : "PENDING"}
                        </span>

                      </td>

                      <td>

                        {factura.pendiente >
                        0 ? (
                          <button
                            type="button"
                            className="btn-table-payment"
                            onClick={() =>
                              abrirNuevoPago(
                                factura
                              )
                            }
                          >
                            💵 Pagar
                          </button>
                        ) : (
                          <span className="paid-label">
                            ✓ Pagada
                          </span>
                        )}

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ===================================================
          HISTORIAL DE PAGOS
      =================================================== */}

      <div className="pagos-section">

        <div className="section-title">

          <div>

            <h3>
              Historial de pagos
            </h3>

            <p>
              Consulta, edita o elimina
              pagos registrados.
            </p>

          </div>

        </div>

        {pagos.length === 0 ? (
          <div className="pagos-empty">
            Todavía no hay pagos registrados.
          </div>
        ) : (
          <div className="pagos-table-wrapper">

            <table className="pagos-table">

              <thead>

                <tr>
                  <th>Fecha</th>
                  <th>Factura</th>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Método</th>
                  <th>Observación</th>
                  <th>Acciones</th>
                </tr>

              </thead>

              <tbody>

                {pagos.map(
                  (pago) => {

                    const factura =
                      facturas.find(
                        (item) =>
                          item.id ===
                          pago.factura_id
                      );

                    const cliente =
                      factura?.cliente ||
                      clientes.find(
                        (item) =>
                          item.id ===
                          factura?.cliente_id
                      );

                    return (
                      <tr key={pago.id}>

                        <td>
                          {formatearFecha(
                            pago.fecha
                          )}
                        </td>

                        <td>

                          <strong>
                            #
                            {String(
                              factura?.numero ||
                                0
                            ).padStart(
                              4,
                              "0"
                            )}
                          </strong>

                        </td>

                        <td>
                          {cliente?.nombre ||
                            "Sin cliente"}
                        </td>

                        <td>

                          <strong className="text-success">
                            {dinero(
                              Number(
                                pago.valor
                              )
                            )}
                          </strong>

                        </td>

                        <td>
                          {pago.metodo_pago ||
                            "-"}
                        </td>

                        <td>
                          {pago.observacion ||
                            "-"}
                        </td>

                        <td>

                          <div className="payment-actions">

                            <button
                              type="button"
                              className="action-btn receipt"
                              title="Ver comprobante"
                              onClick={() =>
                                verComprobante(
                                  pago
                                )
                              }
                            >
                              🧾
                            </button>

                            <button
                              type="button"
                              className="action-btn edit"
                              title="Editar pago"
                              onClick={() =>
                                abrirEditarPago(
                                  pago
                                )
                              }
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="action-btn delete"
                              title="Eliminar pago"
                              onClick={() =>
                                eliminarPago(
                                  pago
                                )
                              }
                            >
                              🗑️
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

      {/* ===================================================
          MODAL REGISTRAR / EDITAR PAGO
      =================================================== */}

      {modalAbierto &&
        facturaSeleccionada && (

          <div className="modal-overlay">

            <div className="modal-content payment-modal">

              <div className="modal-header">

                <div>

                  <h3>
                    {modoEdicion
                      ? "Editar pago"
                      : "Registrar pago"}
                  </h3>

                  <p>
                    Factura #
                    {String(
                      facturaSeleccionada.numero
                    ).padStart(
                      4,
                      "0"
                    )}
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={cerrarModal}
                >
                  ×
                </button>

              </div>

              <div className="payment-invoice-summary">

                <div>

                  <span>
                    Cliente
                  </span>

                  <strong>
                    {facturaSeleccionada
                      .cliente
                      ?.nombre ||
                      "Sin cliente"}
                  </strong>

                </div>

                <div>

                  <span>
                    Total factura
                  </span>

                  <strong>
                    {dinero(
                      Number(
                        facturaSeleccionada.total
                      )
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    {modoEdicion
                      ? "Saldo disponible"
                      : "Saldo pendiente"}
                  </span>

                  <strong className="text-warning">
                    {dinero(
                      facturaSeleccionada.pendiente
                    )}
                  </strong>

                </div>

              </div>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Valor del pago *
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={
                      facturaSeleccionada.pendiente
                    }
                    value={valorPago}
                    onChange={(e) =>
                      setValorPago(
                        e.target.value
                      )
                    }
                    placeholder="0.00"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Fecha del pago *
                  </label>

                  <input
                    type="date"
                    value={fechaPago}
                    onChange={(e) =>
                      setFechaPago(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Método de pago
                  </label>

                  <select
                    value={metodoPago}
                    onChange={(e) =>
                      setMetodoPago(
                        e.target.value
                      )
                    }
                  >

                    <option value="Check">
                      Check
                    </option>

                    <option value="ACH">
                      ACH
                    </option>

                    <option value="Card">
                      Card
                    </option>

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="Zelle">
                      Zelle
                    </option>

                    <option value="Venmo">
                      Venmo
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Observación
                  </label>

                  <input
                    type="text"
                    value={observacion}
                    onChange={(e) =>
                      setObservacion(
                        e.target.value
                      )
                    }
                    placeholder="Ej: Abono inicial"
                  />

                </div>

              </div>

              <div className="payment-modal-info">

                <span>
                  Saldo después del pago
                </span>

                <strong>
                  {dinero(
                    Math.max(
                      Number(
                        facturaSeleccionada.pendiente
                      ) -
                        (Number(
                          valorPago
                        ) || 0),
                      0
                    )
                  )}
                </strong>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={guardarPago}
                >
                  {modoEdicion
                    ? "Guardar cambios"
                    : "Registrar pago"}
                </button>

              </div>

            </div>

          </div>
        )}

      {/* ===================================================
          COMPROBANTE DE PAGO
      =================================================== */}

      {comprobanteAbierto &&
        pagoComprobante &&
        comprobanteFactura &&
        comprobanteCliente && (

          <ComprobantePago
            numeroFactura={
              comprobanteFactura.numero
            }

            fechaFactura={
              comprobanteFactura.fecha
            }

            fechaPago={
              pagoComprobante.fecha
            }

            cliente={
              comprobanteCliente
            }

            totalFactura={
              Number(
                comprobanteFactura.total
              )
            }

            totalPagado={
              comprobanteTotalPagado
            }

            pagoActual={
              Number(
                pagoComprobante.valor
              )
            }

            saldoPendiente={
              comprobanteSaldo
            }

            metodoPago={
              pagoComprobante.metodo_pago
            }

            observacion={
              pagoComprobante.observacion
            }

            onClose={
              cerrarComprobante
            }
          />

        )}

    </div>
  );
}

export default Pagos;