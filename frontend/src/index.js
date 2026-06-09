import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// ── Blindaje contra "Failed to execute 'removeChild' on 'Node'" ──
// Si el navegador traduce la página (Google Translate / Edge), reemplaza
// nodos de texto y React falla al desmontar nodos cuya referencia ya no es
// hija de su padre. Esto vuelve removeChild/insertBefore tolerantes en vez
// de lanzar una excepción que tumba toda la app. (Workaround estándar.)
if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console) console.warn("[PCL] removeChild: nodo con otro padre, ignorado.", child, this);
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) console.warn("[PCL] insertBefore: referencia con otro padre, anexado al final.", referenceNode, this);
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
