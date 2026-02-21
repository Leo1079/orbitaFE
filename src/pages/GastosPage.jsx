import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExpenses, createExpense } from "../store/slices/expensesSlice";
import { getActiveCash } from "../store/slices/cashSlice";
import { Button, Form, Alert } from "react-bootstrap";
import { 
  FaMoneyBillWave, 
  FaLock, 
  FaLockOpen, 
  FaReceipt,
  FaCalendarAlt,
  FaChartLine,
  FaPlus
} from "react-icons/fa";
import Swal from "sweetalert2";
import "./GastosPage.css";

const GastosPage = () => {
  const dispatch = useDispatch();
  const { items: expenses, loading } = useSelector((state) => state.expenses);
  const { status: cajaStatus, currentCajaId } = useSelector(
    (state) => state.cash,
  );

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
  });

  // Memoized stats
  const stats = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        total: 0,
        today: 0,
        count: 0
      };
    }

    const today = new Date().toDateString();
    const total = expenses.reduce((sum, exp) => sum + Number(exp.monto), 0);
    const todayExpenses = expenses
      .filter(exp => new Date(exp.fecha).toDateString() === today)
      .reduce((sum, exp) => sum + Number(exp.monto), 0);

    return {
      total,
      today: todayExpenses,
      count: expenses.length
    };
  }, [expenses]);

  // Memoized recent expenses
  const recentExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses
      .slice()
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 10);
  }, [expenses]);

  useEffect(() => {
    dispatch(getActiveCash());
    dispatch(fetchExpenses());
  }, [dispatch]);

  const handleAddExpense = useCallback(async (e) => {
    e.preventDefault();

    if (cajaStatus !== "open")
      return Swal.fire(
        "Caja Cerrada",
        "La caja debe estar abierta para registrar gastos",
        "warning",
      );

    if (!currentCajaId)
      return Swal.fire("Error", "No se identifica la caja abierta", "error");

    try {
      await dispatch(
        createExpense({
          id_caja: currentCajaId,
          monto: parseFloat(expenseForm.amount),
          descripcion: expenseForm.description,
        }),
      ).unwrap();
      setExpenseForm({ description: "", amount: "" });
      Swal.fire(
        "Gasto Registrado",
        "Se ha registrado la salida de dinero correctamente",
        "success",
      );
    } catch (err) {
      Swal.fire("Error", "No se pudo registrar el gasto", "error");
    }
  }, [cajaStatus, currentCajaId, expenseForm, dispatch]);

  const handleInputChange = useCallback((field, value) => {
    setExpenseForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  return (
    <div className="gastos-page">
      {/* Header */}
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <div className="icon-wrapper">
            <FaReceipt className="header-icon" />
          </div>
          <div>
            <h1 className="page-title">Gestión de Gastos</h1>
            <p className="page-subtitle">Controla las salidas de dinero de tu negocio</p>
          </div>
        </div>
        <div className="caja-status-indicator">
          {cajaStatus === "open" ? (
            <div className="status-indicator open">
              <FaLockOpen className="me-2" />
              <span>Caja Abierta</span>
            </div>
          ) : (
            <div className="status-indicator closed">
              <FaLock className="me-2" />
              <span>Caja Cerrada</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert for closed cash */}
      {cajaStatus !== "open" && (
        <Alert variant="warning" className="modern-alert">
          <FaLock className="alert-icon me-2" />
          <div className="alert-content">
            <strong>Caja cerrada</strong> - No se pueden registrar nuevos gastos mientras la caja esté cerrada.
          </div>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaMoneyBillWave />
          </div>
          <div className="stat-content">
            <div className="stat-value">${stats.total.toFixed(2)}</div>
            <div className="stat-label">Total Gastos</div>
          </div>
        </div>
        
        <div className="stat-card today">
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <div className="stat-value">${stats.today.toFixed(2)}</div>
            <div className="stat-label">Gastos de Hoy</div>
          </div>
        </div>
        
        <div className="stat-card count">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.count}</div>
            <div className="stat-label">Transacciones</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Add Expense Form */}
        <div className="expense-form-card">
          <div className="form-header">
            <h3 className="form-title">
              <FaPlus className="me-2" />
              Registrar Nuevo Gasto
            </h3>
          </div>
          
          <Form onSubmit={handleAddExpense} className="expense-form">
            <Form.Group className="mb-4">
              <Form.Label className="form-label">Descripción del Gasto</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej. Compra de insumos de limpieza"
                required
                className="form-control-modern"
                value={expenseForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={cajaStatus !== "open"}
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label className="form-label">Monto</Form.Label>
              <div className="input-group-modern">
                <span className="input-prefix">$</span>
                <Form.Control
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  className="form-control-modern"
                  value={expenseForm.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  disabled={cajaStatus !== "open"}
                />
              </div>
            </Form.Group>
            
            <Button
              type="submit"
              variant="warning"
              className="submit-expense-btn"
              disabled={cajaStatus !== "open" || loading}
            >
              {loading ? (
                <span>Registrando...</span>
              ) : (
                <>
                  <FaMoneyBillWave className="me-2" />
                  Registrar Gasto
                </>
              )}
            </Button>
          </Form>
        </div>

        {/* Recent Expenses */}
        <div className="recent-expenses-card">
          <div className="expenses-header">
            <h3 className="expenses-title">
              <FaReceipt className="me-2" />
              Gastos Recientes
            </h3>
            <div className="expenses-count">
              {recentExpenses.length} transacciones
            </div>
          </div>
          
          <div className="expenses-list">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((exp, idx) => (
                <div key={idx} className="expense-item">
                  <div className="expense-info">
                    <div className="expense-description">{exp.descripcion}</div>
                    <div className="expense-date">
                      <FaCalendarAlt className="me-1" />
                      {new Date(exp.fecha).toLocaleString()}
                    </div>
                  </div>
                  <div className="expense-amount negative">
                    -${Number(exp.monto).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-expenses">
                <div className="empty-icon">
                  <FaReceipt />
                </div>
                <h4>No hay gastos registrados</h4>
                <p>Comienza a registrar tus gastos para verlos aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GastosPage;
