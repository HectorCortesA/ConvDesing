import { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import { getComponentByMenuId } from "./routes/sidebarRoutes";
import {
  BackgroundProvider,
  useBackground,
} from "./contexts/BackgroundContext";
import "./App.css";
import title from "./assets/title.svg";

function AppContent() {
  const [activeMenuId, setActiveMenuId] = useState("dashboard");
  const { backgroundImage } = useBackground();
  const Component = getComponentByMenuId(activeMenuId);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{
        margin: 0,
        padding: 0,
      }}
    >
      <img
        src={backgroundImage}
        alt="Fondo"
        className="fixed top-0 left-0 w-full h-full object-cover -z-10 filter blur-sm opacity-95 transition-all duration-300"
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

function App() {
  return (
    <BackgroundProvider>
      <AppContent />
    </BackgroundProvider>
  );
}

export default App;
