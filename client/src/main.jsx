import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./styles.css";
import { Home } from "./pages/Home";

const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const FarmMap = lazy(() => import("./pages/FarmMap").then((module) => ({ default: module.FarmMap })));
const Farms = lazy(() => import("./pages/Farms").then((module) => ({ default: module.Farms })));
const TouristAccount = lazy(() => import("./pages/TouristAccount").then((module) => ({ default: module.TouristAccount })));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error);
    console.error("Error Info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", backgroundColor: "#f5f3f0", padding: "20px", textAlign: "center", fontFamily: "system-ui" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#173f2a", marginBottom: "10px" }}>Algo correu mal</h1>
            <p style={{ fontSize: "14px", color: "#78716c", marginBottom: "20px" }}>{this.state.error?.message || "Erro desconhecido"}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 24px",
                backgroundColor: "#527d52",
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
                border: "none",
                borderRadius: "9999px",
                cursor: "pointer",
              }}
            >
              Recarregar página
            </button>
            <pre style={{ marginTop: "20px", textAlign: "left", overflow: "auto", maxWidth: "100%", fontSize: "11px" }}>
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log("🚀 AGRO TUR iniciando...");

window.addEventListener("error", (event) => {
  console.error("❌ Erro global:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("❌ Promise rejeitada não tratada:", event.reason);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  document.body.innerHTML = '<div style="padding:20px; font-family: system-ui;">Erro: Elemento root não encontrado</div>';
} else {
  console.log("✓ Elemento root encontrado");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<div className="grid min-h-screen place-items-center bg-cream text-sm font-bold text-agro-800">A preparar a fazenda…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mapa" element={<FarmMap />} />
              <Route path="/fazendas" element={<Farms />} />
              <Route path="/conta" element={<TouristAccount />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
