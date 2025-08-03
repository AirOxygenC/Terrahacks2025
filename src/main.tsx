import "./index.css";
import ReactDOM from "react-dom/client";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App1.tsx";
import Welcome from "./welcome.tsx";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/assessment" element={<App />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
