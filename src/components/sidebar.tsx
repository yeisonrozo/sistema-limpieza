interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

function Sidebar({
  activePage,
  setActivePage,
}: SidebarProps) {

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "▦",
    },
    {
      id: "clientes",
      label: "Clientes",
      icon: "👥",
    },
    {
      id: "servicios",
      label: "Servicios",
      icon: "🧹",
    },
    {
      id: "facturas",
      label: "Facturas",
      icon: "🧾",
    },
    {
      id: "pagos",
      label: "Pagos",
      icon: "💵",
    },
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">

        <div className="logo-box">
          AH
        </div>

        <div>
          <h2>Aim High</h2>
          <span>Cleaners LLC</span>
        </div>

      </div>

      <nav className="sidebar-menu">

        <p className="menu-title">
          MENÚ PRINCIPAL
        </p>

        {menuItems.map((item) => (

          <button
            key={item.id}
            className={`menu-item ${
              activePage === item.id
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage(item.id)
            }
          >

            <span className="menu-icon">
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>

          </button>

        ))}

      </nav>

      <div className="sidebar-footer">

        <button
          className={`menu-item ${
            activePage === "configuracion"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActivePage("configuracion")
          }
        >

          <span className="menu-icon">
            ⚙️
          </span>

          <span>
            Configuración
          </span>

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;