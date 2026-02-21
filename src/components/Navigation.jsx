import { Navbar, Container, Nav, Badge } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaShoppingCart,
  FaBoxOpen,
  FaCashRegister,
  FaHistory,
  FaMoneyBillWave,
} from "react-icons/fa";

const Navigation = () => {
  const location = useLocation();
  const { status: cajaStatus } = useSelector((state) => state.cash);

  return (
    <Navbar expand="lg" variant="dark" className="glass-header sticky-top mb-4">
      <Container>
        <Navbar.Brand
          as={Link}
          to="/"
          className="fw-bold d-flex align-items-center gap-2"
        >
          <span className="text-primary">Ferre</span>Pinedo
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link
              as={Link}
              to="/ventas"
              active={
                location.pathname === "/ventas" || location.pathname === "/"
              }
              className="d-flex align-items-center gap-2"
            >
              <FaShoppingCart /> Punto de Venta
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/historial"
              active={location.pathname === "/historial"}
              className="d-flex align-items-center gap-2"
            >
              <FaHistory /> Historial
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/productos"
              active={location.pathname === "/productos"}
              className="d-flex align-items-center gap-2"
            >
              <FaBoxOpen /> Inventario
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/caja"
              active={location.pathname === "/caja"}
              className="d-flex align-items-center gap-2"
            >
              <FaCashRegister /> Caja
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/gastos"
              active={location.pathname === "/gastos"}
              className="d-flex align-items-center gap-2"
            >
              <FaMoneyBillWave /> Gastos
            </Nav.Link>
          </Nav>
          <div className="ms-lg-3 d-flex align-items-center">
            {cajaStatus === "open" ? (
              <Badge bg="success" className="animate-pulse">
                CAJA ABIERTA
              </Badge>
            ) : (
              <Badge bg="danger">CAJA CERRADA</Badge>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
