import { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import { getComponentByMenuId } from "./routes/sidebarRoutes";
import "./App.css";

function App() {
  const [activeMenuId, setActiveMenuId] = useState("dashboard");

  const Component = getComponentByMenuId(activeMenuId);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{
        margin: 0,
        padding: 0,
      }}
    >
      <Sidebar onItemChange={setActiveMenuId} />
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          margin: 0,
          padding: 0,
        }}
      >
        {Component ? <Component /> : <div>Selecciona una opción del menú</div>}
      </main>
    </div>
  );
}

export default App;
