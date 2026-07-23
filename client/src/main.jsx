import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./styles.css";
import { Home } from "./pages/Home";

const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const FarmMap = lazy(() => import("./pages/FarmMap").then((module) => ({ default: module.FarmMap })));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-cream px-5 text-center">
          <div>
            <h1 className="text-2xl font-bold text-agro-900">Algo correu mal</h1>
            <p className="mt-2 text-sm text-stone-600">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-block rounded-full bg-agro-600 px-6 py-2 text-sm font-bold text-white hover:bg-agro-700"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<div className="grid min-h-screen place-items-center bg-cream text-sm font-bold text-agro-800">A preparar a fazenda…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mapa" element={<FarmMap />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
