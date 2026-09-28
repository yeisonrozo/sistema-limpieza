import "./FacturaView.css";

interface Cliente {
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

interface DetalleFactura {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
}

interface FacturaViewProps {
  numero: number;
  fecha: string;
  cliente: Cliente;
  detalles: DetalleFactura[];
  subtotal: number;
  impuesto: number;
  descuento: number;
  total: number;
  onClose: () => void;
}

function FacturaView({
  numero,
  fecha,
  cliente,
  detalles,
  subtotal,
  impuesto,
  descuento,
  total,
  onClose,
}: FacturaViewProps) {
  const dinero = (valor: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(valor) || 0);
  };

  const formatearFecha = (valor: string) => {
    const partes = valor.split("-");

    if (partes.length !== 3) {
      return valor;
    }

    return `${partes[1]}/${partes[2]}/${partes[0]}`;
  };

  const numeroFactura = String(numero).padStart(
    4,
    "0"
  );

  return (
    <div className="invoice-view-overlay">
      <div className="invoice-view-toolbar">
        <button
          type="button"
          className="invoice-back-button"
          onClick={onClose}
        >
          ← Volver
        </button>

        <button
          type="button"
          className="invoice-print-button"
          onClick={() => window.print()}
        >
          🖨️ Imprimir / PDF
        </button>
      </div>

      <div className="invoice-page">
        <div className="invoice-header">
          <div className="invoice-logo-area">
            <img
              src="/aim-high-logo.png"
              alt="Aim High Cleaners LLC"
            />
          </div>

          <div className="invoice-title">
            INVOICE
          </div>
        </div>

        <div className="invoice-number-section">
          <div className="invoice-number-info">
            <div className="invoice-info-row">
              <strong>INVOICE :</strong>
              <span>{numeroFactura}</span>
            </div>

            <div className="invoice-info-row">
              <strong>DATE :</strong>
              <span>
                {formatearFecha(fecha)}
              </span>
            </div>
          </div>

          <div className="invoice-blue-decoration">
            <span></span>
            <span></span>
          </div>
        </div>

        <div className="invoice-parties">
          <div className="party-column">
            <h3>PAYMENT TO:</h3>

            <strong>
              Aim High Cleaners LLC
            </strong>

            <p>801-835-1301</p>
            <p>221 N Washington Blvd</p>
            <p>PO BOX 12084</p>
            <p>Ogden, UT 84412</p>
          </div>

          <div className="party-column">
            <h3>BILLED TO:</h3>

            <strong>
              {cliente.nombre}
            </strong>

            {cliente.telefono && (
              <p>{cliente.telefono}</p>
            )}

            {cliente.direccion && (
              <p>{cliente.direccion}</p>
            )}

            {cliente.email && (
              <p>{cliente.email}</p>
            )}
          </div>
        </div>

        <table className="invoice-items">
          <thead>
            <tr>
              <th>Description</th>
              <th>Unit</th>
              <th>Date</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {detalles.map(
              (detalle, index) => (
                <tr key={index}>
                  <td>
                    {detalle.descripcion}
                  </td>

                  <td>
                    {detalle.cantidad}
                  </td>

                  <td>
                    {formatearFecha(fecha)}
                  </td>

                  <td>
                    {dinero(
                      detalle.precio_unitario
                    )}
                  </td>

                  <td>
                    {dinero(
                      detalle.total
                    )}
                  </td>
                </tr>
              )
            )}

            {detalles.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="invoice-empty-row"
                >
                  No hay servicios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="invoice-summary">
          <div className="summary-row">
            <span>SUBTOTAL</span>

            <strong>
              {dinero(subtotal)}
            </strong>
          </div>

          <div className="summary-row">
            <span>TAX</span>

            <strong>
              {dinero(impuesto)}
            </strong>
          </div>

          {descuento > 0 && (
            <div className="summary-row">
              <span>DISCOUNT</span>

              <strong>
                -{dinero(descuento)}
              </strong>
            </div>
          )}
        </div>

        <div className="invoice-total-area">
          <div className="invoice-total-box">
            <span>TOTAL</span>

            <strong>
              {dinero(total)}
            </strong>
          </div>
        </div>

        <div className="payment-info">
          <h3>PAYMENT INFO:</h3>

          <p>
            American First Credit Union
          </p>

          <p>Aim High Cleaners</p>

          <p>746048977839</p>

          <p>Or by Check</p>
        </div>

        <div className="invoice-bottom-decoration">
          <div className="decoration-line line-one">
            <span></span>
            <span></span>
          </div>

          <div className="decoration-line line-two">
            <span></span>
            <span></span>
          </div>
        </div>

        <div className="invoice-footer">
          <span>
            Aim High Cleaners LLC
          </span>

          <span>Page 1/1</span>
        </div>
      </div>
    </div>
  );
}

export default FacturaView;