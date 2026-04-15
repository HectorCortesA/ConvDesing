import { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import { getComponentByMenuId } from "./routes/sidebarRoutes";
import "./App.css";

function App() {
  const [activeMenuId, setActiveMenuId] = useState("dashboard");

  const Component = getComponentByMenuId(activeMenuId);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw", // Cambia a 100vw
        overflow: "hidden", // Previene scroll innecesario
        margin: 0,
        padding: 0,
      }}
    >
      <Sidebar onItemChange={setActiveMenuId} />
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden", // Previene scroll horizontal
          height: "100vh",
          minWidth: 0, // Importante para que flex: 1 funcione correctamente
          // O el color que quieras
        }}
      >
        {Component ? <Component /> : <div>Selecciona una opción del menú</div>}
      </main>
    </div>
  );
}

export default App;
