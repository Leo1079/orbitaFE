import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCashRegister,
  getActiveCash,
  openCashRegister,
  closeCashRegister,
} from "../store/slices/cashSlice";
import { Button, Form, Modal, Badge, Alert, InputGroup } from "react-bootstrap";
import {
  FaCashRegister,
  FaLock,
  FaLockOpen,
  FaDollarSign,
  FaChartLine,
  FaWallet,
  FaClock,
  FaInfoCircle,
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
  const [notas, setNotas] = useState("");

  // Lógica de Balance Global
  const stats = useMemo(() => {
    const initial = Number(cajaData?.monto_inicial) || 0;
    const totalSales = Number(cajaData?.total_ventas) || 0; // Suma de todos los métodos
    const totalExpenses = Number(cajaData?.total_gastos) || 0;
    
    // Balance Global = Lo que había + Todo lo que entró - Todo lo que salió
    const globalBalance = initial + totalSales - totalExpenses;
    
    const finalInput = Number(montoFinal) || 0;
    const balanceDiff = finalInput - globalBalance;

    return {
      initial,
      globalBalance,
      totalSales,
      totalExpenses,
      balanceDiff,
      totalTransacciones: cajaData?.total_transacciones || 0
    };
  }, [cajaData, montoFinal]);

  useEffect(() => {
    dispatch(getActiveCash());
  }, [dispatch]);

  const handleCloseModals = () => {
    setShowOpenModal(false);
    setShowCloseModal(false);
    setMontoInicial("");
    setMontoFinal("");
    setNotas("");
  };

  const handleOpenCaja = async (e) => {
    e.preventDefault();
    try {
      const resultAction = await dispatch(
        openCashRegister({ monto_inicial: parseFloat(montoInicial) })
      ).unwrap();
      Swal.fire("¡Éxito!", "Operación de caja iniciada", "success");
      handleCloseModals();
      dispatch(getCashRegister(resultAction.id || resultAction));
    } catch (err) {
      Swal.fire("Error", "No se pudo abrir la caja", "error");
    }
  };

  const handleCloseCaja = async (e) => {
    e.preventDefault();
    if (!currentCajaId) return;

    try {
      await dispatch(
        closeCashRegister({
          id_caja: currentCajaId,
          monto_final: parseFloat(montoFinal),
          notas: notas
        })
      ).unwrap();
      
      Swal.fire("Caja Cerrada", "El balance global ha sido registrado", "success");
      handleCloseModals();
      dispatch(getActiveCash());
    } catch (err) {
      Swal.fire("Error", "Hubo un problema al cerrar el balance", "error");
    }
  };

  return (
    <div className="caja-page p-4 bg-light min-vh-100">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 bg-primary text-white rounded-3 shadow-sm">
            <FaCashRegister size={24} />
          </div>
          <div>
            <h2 className="fw-bold mb-0">Balance de Caja</h2>
            <p className="text-muted mb-0">Seguimiento global de ingresos y egresos</p>
          </div>
        </div>
        
        <div className="text-end">
           <Badge bg={cajaStatus === "open" ? "success" : "secondary"} className="px-3 py-2 rounded-pill">
             {cajaStatus === "open" ? "TURNO ACTIVO" : "CAJA CERRADA"}
           </Badge>
           <div className="text-muted small mt-1">
             <FaClock className="me-1"/> 
             {cajaData?.fecha_apertura ? new Date(cajaData.fecha_apertura).toLocaleTimeString() : "--:--"}
           </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mb-4">
        {cajaStatus === "closed" ? (
          <Button onClick={() => setShowOpenModal(true)} className="w-100 py-3 fw-bold" variant="primary">
            INICIAR NUEVA JORNADA
          </Button>
        ) : (
          <Button onClick={() => setShowCloseModal(true)} className="w-100 py-3 fw-bold" variant="dark">
            REGISTRAR BALANCE FINAL Y CERRAR
          </Button>
        )}
      </div>

      {/* Grid de Stats Globales */}
      <div className="row g-3 mb-4">
        <StatCard label="Fondo Inicial" value={stats.initial} icon={<FaWallet/>} color="primary" />
        <StatCard label="Ingresos Totales" value={stats.totalSales} icon={<FaChartLine/>} color="success" />
        <StatCard label="Egresos Totales" value={stats.totalExpenses} icon={<FaDollarSign/>} color="danger" isNegative />
        <StatCard label="Balance Global" value={stats.globalBalance} icon={<FaCashRegister/>} color="warning" />
      </div>

      {/* Resumen */}
      {cajaStatus === "open" && (
        <div className="bg-white p-4 rounded-4 shadow-sm border-0">
          <h5 className="fw-bold mb-3"><FaInfoCircle className="me-2 text-primary"/> Detalles del Turno</h5>
          <div className="row text-center">
            <div className="col-6 border-end">
              <div className="text-muted small">Rendimiento (Ventas - Gastos)</div>
              <h4 className="fw-bold text-dark">
                ${(stats.totalSales - stats.totalExpenses).toFixed(2)}
              </h4>
            </div>
            <div className="col-6">
              <div className="text-muted small">Operaciones Realizadas</div>
              <h4 className="fw-bold">{stats.totalTransacciones}</h4>
            </div>
          </div>
        </div>
      )}

      {/* Modales actualizados con lenguaje de "Balance Global" */}
      <Modal show={showOpenModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Apertura de Caja</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleOpenCaja}>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="small fw-bold">SALDO INICIAL DISPONIBLE</Form.Label>
              <InputGroup size="lg">
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  step="0.01"
                  required
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                />
              </InputGroup>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="success" type="submit" className="w-100 py-2">Confirmar Apertura</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showCloseModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Cierre de Balance</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCloseCaja}>
          <Modal.Body>
            <div className="p-3 bg-light rounded-3 mb-4 text-center">
              <div className="text-muted small">Balance del Sistema (Esperado)</div>
              <h3 className="fw-bold text-primary">${stats.globalBalance.toFixed(2)}</h3>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">MONTO DE CIERRE REGISTRADO</Form.Label>
              <InputGroup size="lg">
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ingrese el monto final"
                  value={montoFinal}
                  onChange={(e) => setMontoFinal(e.target.value)}
                />
              </InputGroup>
            </Form.Group>

            {montoFinal && (
              <Alert variant={Math.abs(stats.balanceDiff) < 0.01 ? "success" : "warning"}>
                Diferencia contra sistema: <strong>${stats.balanceDiff.toFixed(2)}</strong>
              </Alert>
            )}

            <Form.Group>
              <Form.Label className="fw-bold small">NOTAS / OBSERVACIONES</Form.Label>
              <Form.Control as="textarea" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="primary" type="submit" className="w-100 py-2">Finalizar y Guardar Balance</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, isNegative, highlight }) => (
  <div className="col-md-3">
    <div className={`card border-0 shadow-sm rounded-4 ${highlight ? `bg-primary text-white` : 'bg-white'}`}>
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className={`p-2 rounded-2 ${highlight ? 'bg-white bg-opacity-25' : `bg-${color} bg-opacity-10 text-${color}`}`}>
            {icon}
          </div>
        </div>
        <div className={highlight ? "text-white-50 small" : "text-muted small"}>{label}</div>
        <h4 className="fw-bold mb-0">
          {isNegative ? "-" : ""}${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </h4>
      </div>
    </div>
  </div>
);

export default CajaPage;