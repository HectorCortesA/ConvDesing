import { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import { getComponentByMenuId } from "./routes/sidebarRoutes";
import "./App.css";
import fondo from "./assets/fondo.jpg";
import title from "./assets/title.svg";

function App() {
  const [activeMenuId, setActiveMenuId] = useState("dashboard");

  const Component = getComponentByMenuId(activeMenuId);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden "
      style={{
        margin: 0,
        padding: 0,
      }}
    >
      <img
        src={fondo}
        alt="Fondo"
        className="fixed top-0 left-0 w-full h-full object-cover -z-10 filter blur-sm opacity-95 "
      />
      <Sidebar onItemChange={setActiveMenuId} />
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          margin: 0,
          padding: 0,
        }}
      >
        {Component ? (
          <Component />
        ) : (
          <div className="flex items-center justify-center h-full w-full p-30">
            <img src={title} alt="Title" className="h-32 object-contain" />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
