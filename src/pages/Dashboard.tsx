import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

import Sidebar from "../components/sidebar";
import Header from "../components/Header";
import StatCard from "../components/Statcard";

import Clientes from "./Clientes";
import Facturas from "./Facturas";
import Pagos from "./Pagos";
import Servicios from "./Servicios";

interface Cliente {
  id: string;
  nombre: string;
}

interface Factura {
  id: string;
  numero: number;
  fecha: string;
  total: number;
  estado: string;
  cliente_id: string | null;
}

interface Pago {
  id: string;
  factura_id: string;
  valor: number;
  fecha: string;
}

interface Servicio {
  id: string;
  nombre: string;
  precio: number;
  impuesto: number;
  activo: boolean;
}

function Dashboard() {
  const [activePage, setActivePage] =
    useState("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [clientes, setClientes] =
    useState<Cliente[]>([]);

  const [facturas, setFacturas] =
    useState<Factura[]>([]);

  const [pagos, setPagos] =
    useState<Pago[]>([]);

  const [servicios, setServicios] =
    useState<Servicio[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const cambiarPagina = (
    page: string
  ) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  /*
   * ========================================
   * CARGAR DATOS DEL DASHBOARD
   * ========================================
   */

  const cargarDashboard = async () => {
    setCargando(true);

    const [
      clientesResponse,
      facturasResponse,
      pagosResponse,
      serviciosResponse,
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select("id, nombre"),

      supabase
        .from("facturas")
        .select(
          "id, numero, fecha, total, estado, cliente_id"
        )
        .order("numero", {
          ascending: false,
        }),

      supabase
        .from("pagos")
        .select(
          "id, factura_id, valor, fecha"
        )
        .order("fecha", {
          ascending: false,
        }),

      supabase
        .from("servicios")
        .select(
          "id, nombre, precio, impuesto, activo"
        )
        .eq("activo", true),
    ]);

    if (clientesResponse.error) {
      console.error(
        "Error cargando clientes:",
        clientesResponse.error
      );
    }

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

    if (serviciosResponse.error) {
      console.error(
        "Error cargando servicios:",
        serviciosResponse.error
      );
    }

    setClientes(
      clientesResponse.data ?? []
    );

    setFacturas(
      facturasResponse.data ?? []
    );

    setPagos(
      pagosResponse.data ?? []
    );

    setServicios(
      serviciosResponse.data ?? []
    );

    setCargando(false);
  };

  /*
   * ========================================
   * CARGA INICIAL
   * ========================================
   */

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      if (!activo) return;

      await cargarDashboard();
    };

    void cargar();

    return () => {
      activo = false;
    };
  }, []);

  /*
   * ========================================
   * CALCULOS
   * ========================================
   */

  const totalIngresos =
    pagos.reduce(
      (total, pago) =>
        total + Number(pago.valor),
      0
    );

  const totalFacturado =
    facturas.reduce(
      (total, factura) =>
        total + Number(factura.total),
      0
    );

  const totalPorCobrar =
    Math.max(
      totalFacturado -
        totalIngresos,
      0
    );

  const formatearDinero = (
    valor: number
  ) => {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
      }
    ).format(Number(valor) || 0);
  };

  const formatearFecha = (
    fecha: string
  ) => {
    const partes =
      fecha.split("-");

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[1]}/${partes[2]}/${partes[0]}`;
  };

  const obtenerCliente = (
    clienteId: string | null
  ) => {
    const cliente =
      clientes.find(
        (item) =>
          item.id === clienteId
      );

    return (
      cliente?.nombre ||
      "Sin cliente"
    );
  };

  /*
   * ========================================
   * CONTENIDO
   * ========================================
   */

  const renderContent = () => {
    switch (activePage) {
      case "clientes":
        return <Clientes />;

      case "servicios":
        return <Servicios />;

      case "facturas":
        return <Facturas />;

      case "pagos":
        return <Pagos />;

      case "configuracion":
        return (
          <div className="page-content">
            <div className="page-header">
              <div>
                <h2>
                  Configuración
                </h2>

                <p>
                  Configuración de
                  Aim High Cleaners.
                </p>
              </div>
            </div>

            <div className="content-panel">
              <div
                style={{
                  padding: "30px",
                }}
              >
                <h3>
                  Configuración
                  próximamente
                </h3>

                <p
                  style={{
                    marginTop:
                      "8px",
                    color:
                      "#6b7280",
                  }}
                >
                  Aquí configuraremos
                  los datos de la
                  empresa, logo,
                  información de pago
                  y demás opciones.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <main className="dashboard-content">
            <div className="welcome-section">
              <h2>
                Bienvenido de nuevo 👋
              </h2>

              <p>
                Aquí tienes un resumen
                actualizado de tu negocio.
              </p>
            </div>

            {/* =================================
                TARJETAS
            ================================= */}

            <div className="stats-grid">
              <StatCard
                title="Clientes"
                value={String(
                  clientes.length
                )}
                icon="👥"
                description="Clientes registrados"
              />

              <StatCard
                title="Facturas"
                value={String(
                  facturas.length
                )}
                icon="🧾"
                description="Facturas generadas"
              />

              <StatCard
                title="Por cobrar"
                value={formatearDinero(
                  totalPorCobrar
                )}
                icon="💰"
                description="Saldo pendiente"
              />

              <StatCard
                title="Ingresos"
                value={formatearDinero(
                  totalIngresos
                )}
                icon="📈"
                description="Pagos recibidos"
              />
            </div>

            {/* =================================
                INFORMACION ADICIONAL
            ================================= */}

            <div className="dashboard-grid">
              {/* FACTURAS RECIENTES */}

              <section className="dashboard-panel">
                <div className="panel-header">
                  <div>
                    <h3>
                      Facturas recientes
                    </h3>

                    <p>
                      Últimas facturas
                      generadas
                    </p>
                  </div>

                  <button
                    className="view-all-button"
                    onClick={() =>
                      cambiarPagina(
                        "facturas"
                      )
                    }
                  >
                    Ver todas
                  </button>
                </div>

                {cargando ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      ⏳
                    </div>

                    <h4>
                      Cargando...
                    </h4>
                  </div>
                ) : facturas.length ===
                  0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      🧾
                    </div>

                    <h4>
                      No hay facturas
                      todavía
                    </h4>

                    <p>
                      Cuando generes
                      facturas,
                      aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <div
                    className="recent-invoices"
                    style={{
                      padding:
                        "0 20px 20px",
                    }}
                  >
                    {facturas
                      .slice(0, 5)
                      .map(
                        (
                          factura
                        ) => (
                          <div
                            key={
                              factura.id
                            }
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              gap: "15px",
                              padding:
                                "13px 0",
                              borderBottom:
                                "1px solid #f0f0f0",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  color:
                                    "#111827",
                                  fontSize:
                                    "13px",
                                }}
                              >
                                #
                                {
                                  factura.numero
                                }
                              </strong>

                              <div
                                style={{
                                  color:
                                    "#6b7280",
                                  fontSize:
                                    "12px",
                                  marginTop:
                                    "3px",
                                }}
                              >
                                {
                                  obtenerCliente(
                                    factura.cliente_id
                                  )
                                }
                                {" · "}
                                {formatearFecha(
                                  factura.fecha
                                )}
                              </div>
                            </div>

                            <div
                              style={{
                                textAlign:
                                  "right",
                              }}
                            >
                              <strong
                                style={{
                                  display:
                                    "block",
                                  color:
                                    "#111827",
                                  fontSize:
                                    "13px",
                                }}
                              >
                                {formatearDinero(
                                  factura.total
                                )}
                              </strong>

                              <span
                                style={{
                                  display:
                                    "inline-block",
                                  marginTop:
                                    "4px",
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    700,
                                  color:
                                    factura.estado ===
                                    "PAGADA"
                                      ? "#059669"
                                      : "#c2410c",
                                }}
                              >
                                {
                                  factura.estado
                                }
                              </span>
                            </div>
                          </div>
                        )
                      )}
                  </div>
                )}
              </section>

              {/* RESUMEN DEL NEGOCIO */}

              <section className="dashboard-panel">
                <div className="panel-header">
                  <div>
                    <h3>
                      Resumen del negocio
                    </h3>

                    <p>
                      Información actual
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding:
                      "0 20px 20px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      padding:
                        "14px 0",
                      borderBottom:
                        "1px solid #f0f0f0",
                    }}
                  >
                    <span
                      style={{
                        color:
                          "#6b7280",
                        fontSize:
                          "13px",
                      }}
                    >
                      Total facturado
                    </span>

                    <strong>
                      {formatearDinero(
                        totalFacturado
                      )}
                    </strong>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      padding:
                        "14px 0",
                      borderBottom:
                        "1px solid #f0f0f0",
                    }}
                  >
                    <span
                      style={{
                        color:
                          "#6b7280",
                        fontSize:
                          "13px",
                      }}
                    >
                      Total recibido
                    </span>

                    <strong
                      style={{
                        color:
                          "#059669",
                      }}
                    >
                      {formatearDinero(
                        totalIngresos
                      )}
                    </strong>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      padding:
                        "14px 0",
                      borderBottom:
                        "1px solid #f0f0f0",
                    }}
                  >
                    <span
                      style={{
                        color:
                          "#6b7280",
                        fontSize:
                          "13px",
                      }}
                    >
                      Por cobrar
                    </span>

                    <strong
                      style={{
                        color:
                          "#dc2626",
                      }}
                    >
                      {formatearDinero(
                        totalPorCobrar
                      )}
                    </strong>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      padding:
                        "14px 0",
                    }}
                  >
                    <span
                      style={{
                        color:
                          "#6b7280",
                        fontSize:
                          "13px",
                      }}
                    >
                      Servicios activos
                    </span>

                    <strong>
                      {
                        servicios.length
                      }
                    </strong>
                  </div>
                </div>
              </section>
            </div>

            {/* =================================
                ACCIONES RAPIDAS
            ================================= */}

            <section
              className="dashboard-panel"
              style={{
                marginTop:
                  "25px",
              }}
            >
              <div className="panel-header">
                <div>
                  <h3>
                    Acciones rápidas
                  </h3>

                  <p>
                    Accede rápidamente a
                    las funciones principales.
                  </p>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  onClick={() =>
                    cambiarPagina(
                      "clientes"
                    )
                  }
                >
                  <span>👥</span>
                  Nuevo cliente
                </button>

                <button
                  onClick={() =>
                    cambiarPagina(
                      "servicios"
                    )
                  }
                >
                  <span>🧹</span>
                  Nuevo servicio
                </button>

                <button
                  onClick={() =>
                    cambiarPagina(
                      "facturas"
                    )
                  }
                >
                  <span>🧾</span>
                  Nueva factura
                </button>

                <button
                  onClick={() =>
                    cambiarPagina(
                      "pagos"
                    )
                  }
                >
                  <span>💵</span>
                  Registrar pago
                </button>
              </div>
            </section>
          </main>
        );
    }
  };

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <div
        className={`sidebar-container ${
          sidebarOpen
            ? "open"
            : ""
        }`}
      >
        <Sidebar
          activePage={activePage}
          setActivePage={
            cambiarPagina
          }
        />
      </div>

      <div className="main-content">
        <Header
          title={
            activePage ===
            "dashboard"
              ? "Dashboard"
              : activePage ===
                "configuracion"
              ? "Configuración"
              : activePage
                  .charAt(0)
                  .toUpperCase() +
                activePage.slice(1)
          }
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          onLogout={
            handleLogout
          }
        />

        {renderContent()}
      </div>
    </div>
  );
}

export default Dashboard;