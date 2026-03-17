import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>Gradus</h1>
      <p style={{ marginBottom: "0.5rem" }}>
        Plataforma de práctica adaptativa para reconocimiento visual de funciones en análisis matemático.
      </p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

