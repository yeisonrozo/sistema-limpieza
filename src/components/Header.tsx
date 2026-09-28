interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  onLogout: () => void;
}

function Header({
  title,
  onMenuClick,
  onLogout,
}: HeaderProps) {

  return (
    <header className="header">

      <button
        className="mobile-menu-button"
        onClick={onMenuClick}
      >
        ☰
      </button>

      <div className="header-title">
        <h1>{title}</h1>
      </div>

      <div className="header-actions">

        <div className="user-info">

          <div className="user-avatar">
            A
          </div>

          <div className="user-details">
            <strong>
              Administrador
            </strong>

            <span>
              Aim High Cleaners
            </span>
          </div>

        </div>

        <button
          className="logout-button"
          onClick={onLogout}
          title="Cerrar sesión"
        >
          ↪
        </button>

      </div>

    </header>
  );
}

export default Header;