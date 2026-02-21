import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCashRegister,
  getActiveCash,
  openCashRegister,
  closeCashRegister,
} from "../store/slices/cashSlice";
import { Button, Form, Modal, Badge, Alert } from "react-bootstrap";
import {
  FaCashRegister,
  FaLock,
  FaLockOpen,
  FaDollarSign,
  FaChartLine,
  FaWallet,
  FaClock,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "./CajaPage.css";

const CajaPage = () => {
  const dispatch = useDispatch();
  const {
    data: cajaData,
    status: cajaStatus,
    loading,
    currentCajaId,
  } = useSelector((state) => state.cash);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [montoInicial, setMontoInicial] = useState("");
  const [montoFinal, setMontoFinal] = useState("");

  // Memoized stats
  const stats = useMemo(() => {
    if (!cajaData) {
      return {
        initial: 0,
        current: 0,
        sales: 0,
        expenses: 0,
        difference: 0,
      };
    }
    const initial = Number(cajaData.monto_inicial) || 0;
    const sales = Number(cajaData.total_ventas) || 0;
    const expenses = Number(cajaData.total_gastos) || 0;

    // --- AQUÍ ESTÁ TU FÓRMULA ---
    // Balance Actual = Inicial + Ventas - Gastos
    const current = initial + sales - expenses;

    return {
      initial,
      current,
      sales,
      expenses,
      difference: current - initial, // Esto te dirá cuánto dinero neto entró/salió
    };
  }, [cajaData]);

  useEffect(() => {
    dispatch(getActiveCash());
  }, [dispatch]);

  const handleOpenCaja = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        const resultAction = await dispatch(
          openCashRegister({ monto_inicial: parseFloat(montoInicial) }),
        );
        if (openCashRegister.fulfilled.match(resultAction)) {
          Swal.fire(
            "Caja Abierta",
            "La caja se ha abierto correctamente",
            "success",
          );
          setShowOpenModal(false);
          const newId = resultAction.payload;
          dispatch(getCashRegister(newId));
          setMontoInicial("");
        } else {
          throw new Error(resultAction.error.message);
        }
      } catch (err) {
        Swal.fire("Error", "No se pudo abrir la caja", "error");
      }
    },
    [montoInicial, dispatch],
  );

  const handleCloseCaja = useCallback(
    async (e) => {
      e.preventDefault();
      if (!currentCajaId)
        return Swal.fire("Error", "No se identifica la caja a cerrar", "error");
      try {
        await dispatch(
          closeCashRegister({
            id_caja: currentCajaId,
            monto_final: parseFloat(montoFinal),
          }),
        ).unwrap();
        Swal.fire(
          "Caja Cerrada",
          "La caja se ha cerrado correctamente",
          "success",
        );
        setShowCloseModal(false);
        dispatch(getCashRegister(currentCajaId));
        setMontoFinal("");
      } catch (err) {
        Swal.fire("Error", "No se pudo cerrar la caja", "error");
      }
    },
    [currentCajaId, montoFinal, dispatch],
  );

  return (
    <div className="caja-page">
      {/* Header */}
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <div className="icon-wrapper">
            <FaCashRegister className="header-icon" />
          </div>
          <div>
            <h1 className="page-title">Control de Caja</h1>
            <p className="page-subtitle">
              Gestiona el flujo de dinero de tu negocio
            </p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="status-section">
        <div className="status-card">
          <div className="status-header">
            <div className="status-info">
              <h3 className="status-title">Estado Actual</h3>
              <div className="status-badge-wrapper">
                {cajaStatus === "open" ? (
                  <Badge bg="success" className="status-badge open">
                    <FaLockOpen /> ABIERTA
                  </Badge>
                ) : (
                  <Badge bg="danger" className="status-badge closed">
                    <FaLock /> CERRADA
                  </Badge>
                )}
              </div>
            </div>
            <div className="status-time">
              <FaClock className="time-icon" />
              <span className="time-text">
                {cajaData?.fecha_apertura
                  ? new Date(cajaData.fecha_apertura).toLocaleTimeString()
                  : "--:--"}
              </span>
            </div>
          </div>

          <div className="status-actions">
            {cajaStatus === "closed" ? (
              <Button
                onClick={() => setShowOpenModal(true)}
                className="action-btn open-btn"
                disabled={loading}
              >
                <FaLockOpen /> Abrir Caja
              </Button>
            ) : (
              <Button
                onClick={() => setShowCloseModal(true)}
                className="action-btn close-btn"
                disabled={loading}
              >
                <FaLock /> Cerrar Caja
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card initial">
          <div className="stat-icon">
            <FaWallet />
          </div>
          <div className="stat-content">
            <div className="stat-label">Monto Inicial</div>
            <div className="stat-value">${stats.initial.toFixed(2)}</div>
          </div>
        </div>

        <div className="stat-card sales">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <div className="stat-label">Ventas</div>
            <div className="stat-value">${stats.sales.toFixed(2)}</div>
          </div>
        </div>

        <div className="stat-card expenses">
          <div className="stat-icon">
            <FaCashRegister />
          </div>
          <div className="stat-content">
            <div className="stat-label">Gastos</div>
            <div className="stat-value negative">
              -${stats.expenses.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="stat-card balance">
          <div className="stat-icon">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <div className="stat-label">Balance Actual</div>
            <div
              className={`stat-value ${stats.current >= stats.initial ? "positive" : "negative"}`}
            >
              ${stats.current.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {cajaStatus === "open" && (
        <div className="summary-card">
          <h4 className="summary-title">Resumen del Día</h4>
          <div className="summary-content">
            <div className="summary-item">
              <span className="summary-label">Diferencia:</span>
              <span
                className={`summary-value ${stats.difference >= 0 ? "positive" : "negative"}`}
              >
                {stats.difference >= 0 ? "+" : ""}${stats.difference.toFixed(2)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Transacciones:</span>
              <span className="summary-value">
                {cajaData?.total_transacciones || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Apertura */}
      <Modal
        show={showOpenModal}
        onHide={() => setShowOpenModal(false)}
        centered
        contentClassName="modern-modal"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="modal-title">
            <FaLockOpen className="me-2" />
            Abrir Caja
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleOpenCaja}>
            <Form.Group className="mb-4">
              <Form.Label className="form-label">
                Monto Inicial en Efectivo
              </Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                required
                className="form-control-modern"
                placeholder="0.00"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
              />
              <Form.Text className="text-muted">
                Ingresa el dinero físico que tienes al iniciar la jornada
              </Form.Text>
            </Form.Group>
            <div className="d-flex gap-2">
              <Button
                variant="outline-light"
                onClick={() => setShowOpenModal(false)}
                className="cancel-btn flex-fill"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="success"
                className="submit-btn flex-fill"
                disabled={loading}
              >
                {loading ? "Abriendo..." : "Abrir Ahora"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Cierre */}
      <Modal
        show={showCloseModal}
        onHide={() => setShowCloseModal(false)}
        centered
        contentClassName="modern-modal"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="modal-title">
            <FaLock className="me-2" />
            Cerrar Caja
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="modern-alert">
            <FaCashRegister className="me-2" />
            Verifica el dinero físico antes de cerrar la caja.
          </Alert>

          <div className="balance-summary">
            <div className="summary-row">
              <span>Monto Inicial:</span>
              <span className="summary-amount">
                ${stats.initial.toFixed(2)}
              </span>
            </div>
            <div className="summary-row">
              <span>Ventas del día:</span>
              <span className="summary-amount positive">
                +${stats.sales.toFixed(2)}
              </span>
            </div>
            <div className="summary-row">
              <span>Gastos del día:</span>
              <span className="summary-amount negative">
                -${stats.expenses.toFixed(2)}
              </span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Balance esperado:</span>
              <span className="summary-amount">
                ${stats.current.toFixed(2)}
              </span>
            </div>
          </div>

          <Form onSubmit={handleCloseCaja}>
            <Form.Group className="mb-3">
              <Form.Label className="form-label">
                Monto Final Real (Arqueo)
              </Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                required
                className="form-control-modern"
                placeholder="0.00"
                value={montoFinal}
                onChange={(e) => setMontoFinal(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="form-label">Notas (opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className="form-control-modern"
                placeholder="Observaciones sobre el cierre de caja..."
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button
                variant="outline-light"
                onClick={() => setShowCloseModal(false)}
                className="cancel-btn flex-fill"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
                className="submit-btn flex-fill"
                disabled={loading}
              >
                {loading ? "Cerrando..." : "Cerrar Caja"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CajaPage;
