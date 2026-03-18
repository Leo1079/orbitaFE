import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExpenses, createExpense } from "../store/slices/expensesSlice";
import { getActiveCash } from "../store/slices/cashSlice";
import { 
  Button, Form, Alert, Container, Row, Col, 
  Card, Badge, InputGroup, ListGroup, Spinner 
} from "react-bootstrap";
import { 
  FaMoneyBillWave, FaLock, FaLockOpen, FaReceipt,
  FaCalendarAlt, FaChartLine, FaPlus, FaHistory
} from "react-icons/fa";
import Swal from "sweetalert2";

const GastosPage = () => {
  const dispatch = useDispatch();
  const { items: expenses, loading } = useSelector((state) => state.expenses);
  const { status: cajaStatus, currentCajaId } = useSelector((state) => state.cash);

  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "" });

  // Memoized stats
  const stats = useMemo(() => {
    if (!expenses || expenses.length === 0) return { total: 0, today: 0, count: 0 };
    const today = new Date().toDateString();
    const total = expenses.reduce((sum, exp) => sum + Number(exp.monto), 0);
    const todayExpenses = expenses
      .filter(exp => new Date(exp.fecha).toDateString() === today)
      .reduce((sum, exp) => sum + Number(exp.monto), 0);
    return { total, today: todayExpenses, count: expenses.length };
  }, [expenses]);

  const recentExpenses = useMemo(() => {
    if (!expenses) return [];
    return [...expenses].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10);
  }, [expenses]);

  useEffect(() => {
    dispatch(getActiveCash());
    dispatch(fetchExpenses());
  }, [dispatch]);

  const handleAddExpense = useCallback(async (e) => {
    e.preventDefault();
    if (cajaStatus !== "open") return Swal.fire("Caja Cerrada", "Debe abrir caja primero", "warning");

    try {
      await dispatch(createExpense({
        id_caja: currentCajaId,
        monto: parseFloat(expenseForm.amount),
        descripcion: expenseForm.description,
      })).unwrap();
      setExpenseForm({ description: "", amount: "" });
      Swal.fire("Éxito", "Gasto registrado correctamente", "success");
    } catch (err) {
      Swal.fire("Error", "No se pudo registrar", "error");
    }
  }, [cajaStatus, currentCajaId, expenseForm, dispatch]);

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      {/* HEADER SECTION */}
      <div className="d-md-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <FaReceipt className="text-warning me-2" />
            Gestión de Gastos
          </h2>
          <p className="text-muted">Administra las salidas de efectivo</p>
        </div>
        <div>
          {cajaStatus === "open" ? (
            <Badge bg="success" className="p-2 px-3 rounded-pill shadow-sm">
              <FaLockOpen className="me-2" /> Caja Abierta
            </Badge>
          ) : (
            <Badge bg="danger" className="p-2 px-3 rounded-pill shadow-sm">
              <FaLock className="me-2" /> Caja Cerrada
            </Badge>
          )}
        </div>
      </div>

      {/* ALERTS */}
      {cajaStatus !== "open" && (
        <Alert variant="danger" className="border-0 shadow-sm mb-4">
          <FaLock className="me-2" />
          <strong>Atención:</strong> La caja está cerrada. No puedes registrar movimientos.
        </Alert>
      )}

      {/* STATS GRID */}
      <Row className="g-3 mb-4">
        {[
          { title: "Total Gastos", val: stats.total, icon: <FaMoneyBillWave />, color: "primary" },
          { title: "Gastos Hoy", val: stats.today, icon: <FaCalendarAlt />, color: "warning" },
          { title: "Transacciones", val: stats.count, icon: <FaChartLine />, color: "info", isQty: true }
        ].map((item, idx) => (
          <Col key={idx} xs={12} md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center">
                <div className={`bg-${item.color} bg-opacity-10 p-3 rounded-3 text-${item.color} me-3`}>
                  {item.icon}
                </div>
                <div>
                  <h6 className="text-muted mb-0">{item.title}</h6>
                  <h4 className="fw-bold mb-0">
                    {item.isQty ? item.val : `$${item.val.toFixed(2)}`}
                  </h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        {/* FORM COLUMN */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3 border-0">
              <h5 className="mb-0 fw-bold"><FaPlus className="me-2 text-warning" /> Nuevo Gasto</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddExpense}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Descripción</Form.Label>
                  <Form.Control
                    placeholder="Ej. Pago de flete"
                    required
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    disabled={cajaStatus !== "open"}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold">Monto</Form.Label>
                  <InputGroup>
                    <InputGroup.Text bg="light">$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      disabled={cajaStatus !== "open"}
                    />
                  </InputGroup>
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="warning" 
                  className="w-100 fw-bold py-2 shadow-sm"
                  disabled={cajaStatus !== "open" || loading}
                >
                  {loading ? <Spinner size="sm" /> : "Registrar Salida"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* LIST COLUMN */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3 border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold"><FaHistory className="me-2 text-warning" /> Últimos Movimientos</h5>
              <Badge bg="light" text="dark border">{recentExpenses.length} items</Badge>
            </Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentExpenses.length > 0 ? (
                recentExpenses.map((exp, idx) => (
                  <ListGroup.Item key={idx} className="py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{exp.descripcion}</div>
                        <small className="text-muted">
                          {new Date(exp.fecha).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
                        </small>
                      </div>
                      <div className="text-danger fw-bold fs-5">
                        -${Number(exp.monto).toFixed(2)}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))
              ) : (
                <div className="text-center py-5">
                  <FaReceipt size={40} className="text-light mb-3" />
                  <p className="text-muted">No hay registros aún</p>
                </div>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default GastosPage;