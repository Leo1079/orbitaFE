import { Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import VentasPage from "./pages/VentasPage";
import HistorialVentasPage from "./pages/HistorialVentasPage";
import ProductosPage from "./pages/ProductosPage";
import CajaPage from "./pages/CajaPage";
import GastosPage from "./pages/GastosPage";
import { Container } from "react-bootstrap";
import "./App.css";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getActiveCash } from "./store/slices/cashSlice";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getActiveCash());
  }, [dispatch]);
  return (
    <>
      <Navigation />
      <Container className="py-4">
        <Routes>
          <Route path="/" element={<VentasPage />} /> 
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/historial" element={<HistorialVentasPage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/caja" element={<CajaPage />} />
          <Route path="/gastos" element={<GastosPage />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
