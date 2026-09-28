import "./ComprobantePago.css";

interface Cliente {
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

interface ComprobantePagoProps {
  numeroFactura: number;
  fechaFactura: string;
  fechaPago: string;
  cliente: Cliente;
  totalFactura: number;
  totalPagado: number;
  pagoActual: number;
  saldoPendiente: number;
  metodoPago: string | null;
  observacion: string | null;
  onClose: () => void;
}

function ComprobantePago({
  numeroFactura,
  fechaFactura,
  fechaPago,
  cliente,
  totalFactura,
  totalPagado,
  pagoActual,
  saldoPendiente,
  metodoPago,
  observacion,
  onClose,
}: ComprobantePagoProps) {
  const dinero = (valor: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(valor) || 0);
  };

  const formatearFecha = (fecha: string) => {
    const partes = fecha.split("-");

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[1]}/${partes[2]}/${partes[0]}`;
  };

  const numero = String(numeroFactura).padStart(4, "0");

  return (
    <div className="payment-receipt-overlay">
      <div className="payment-receipt-toolbar">
        <button
          type="button"
          className="receipt-back-button"
          onClick={onClose}
        >
          ← Volver
        </button>

        <button
          type="button"
          className="receipt-print-button"
          onClick={() => window.print()}
        >
          🖨️ Imprimir / PDF
        </button>
      </div>

      <div className="payment-receipt-page">
        {/* ENCABEZADO */}

        <div className="payment-receipt-header">
          <div className="payment-receipt-logo">
            <img
              src="/aim-high-logo.png"
              alt="Aim High Cleaners LLC"
            />
          </div>

          <div className="payment-receipt-title">
            <h1>PAYMENT RECEIPT</h1>
            <p>COMPROBANTE DE PAGO</p>
          </div>
        </div>

        {/* INFORMACIÓN */}

        <div className="payment-receipt-info">
          <div>
            <span>RECEIPT FOR INVOICE</span>
            <strong>#{numero}</strong>
          </div>

          <div>
            <span>PAYMENT DATE</span>
            <strong>
              {formatearFecha(fechaPago)}
            </strong>
          </div>
        </div>

        {/* CLIENTE */}

        <div className="payment-receipt-client">
          <div className="receipt-company">
            <h3>PAYMENT TO:</h3>

            <strong>Aim High Cleaners LLC</strong>

            <p>801-835-1301</p>
            <p>221 N Washington Blvd</p>
            <p>PO BOX 12084</p>
            <p>Ogden, UT 84412</p>
          </div>

          <div className="receipt-customer">
            <h3>RECEIVED FROM:</h3>

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

        {/* RESUMEN */}

        <div className="payment-summary">
          <div className="payment-summary-row">
            <span>INVOICE TOTAL</span>

            <strong>
              {dinero(totalFactura)}
            </strong>
          </div>

          <div className="payment-summary-row">
            <span>PREVIOUS PAYMENTS</span>

            <strong>
              {dinero(
                Math.max(
                  totalPagado - pagoActual,
                  0
                )
              )}
            </strong>
          </div>

          <div className="payment-summary-row payment-current">
            <span>CURRENT PAYMENT</span>

            <strong>
              {dinero(pagoActual)}
            </strong>
          </div>

          <div className="payment-summary-total">
            <span>REMAINING BALANCE</span>

            <strong>
              {dinero(saldoPendiente)}
            </strong>
          </div>
        </div>

        {/* ESTADO */}

        <div
          className={`payment-status-box ${
            saldoPendiente <= 0
              ? "receipt-paid"
              : "receipt-pending"
          }`}
        >
          {saldoPendiente <= 0 ? (
            <>
              <span className="status-icon">
                ✓
              </span>

              <div>
                <strong>PAID IN FULL</strong>

                <p>
                  This invoice has been paid
                  in full.
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="status-icon">
                $
              </span>

              <div>
                <strong>
                  BALANCE DUE
                </strong>

                <p>
                  Remaining balance:{" "}
                  {dinero(
                    saldoPendiente
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        {/* DATOS DEL PAGO */}

        <div className="payment-details">
          <h3>PAYMENT DETAILS</h3>

          <div className="payment-detail-grid">
            <div>
              <span>Payment Date</span>

              <strong>
                {formatearFecha(
                  fechaPago
                )}
              </strong>
            </div>

            <div>
              <span>Payment Method</span>

              <strong>
                {metodoPago || "-"}
              </strong>
            </div>

            <div>
              <span>Invoice Date</span>

              <strong>
                {formatearFecha(
                  fechaFactura
                )}
              </strong>
            </div>

            <div>
              <span>Payment Amount</span>

              <strong>
                {dinero(pagoActual)}
              </strong>
            </div>
          </div>

          {observacion && (
            <div className="payment-observation">
              <span>NOTE</span>

              <p>{observacion}</p>
            </div>
          )}
        </div>

        {/* FIRMA */}

        <div className="receipt-thanks">
          <h2>Thank you!</h2>

          <p>
            Thank you for your payment and
            for choosing Aim High Cleaners
            LLC.
          </p>
        </div>

        {/* PIE */}

        <div className="payment-receipt-footer">
          <span>
            Aim High Cleaners LLC
          </span>

          <span>
            Payment Receipt
          </span>
        </div>
      </div>
    </div>
  );
}

export default ComprobantePago;