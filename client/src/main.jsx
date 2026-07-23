import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./styles.css";
import { Home } from "./pages/Home";

const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const FarmMap = lazy(() => import("./pages/FarmMap").then((module) => ({ default: module.FarmMap })));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-cream text-sm font-bold text-agro-800">A preparar a fazenda…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mapa" element={<FarmMap />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
);
