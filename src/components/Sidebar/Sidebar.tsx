import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Plus,
} from "lucide-react";
import "../../assets/styles/sidebar.css";
import {
  SIDEBAR_MENU_ITEMS,
  MenuItem,
  SubItem,
} from "../../routes/sidebarRoutes";

interface SidebarProps {
  onItemChange: (itemId: string) => void;
  isDarkMode?: boolean; // 👈 Prop opcional para recibir el tema
}

export default function Sidebar({
  onItemChange,
  isDarkMode = true, // Valor por defecto
}: SidebarProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>("income");
  const [activeItem, setActiveItem] = useState<string>("dashboard");
  const [activeSubItem, setActiveSubItem] = useState<string>("refunds");
  const [popoverState, setPopoverState] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Handle clicking outside to close popover and collapse sidebar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;

      let clickedInsidePopover = false;
      if (popoverRef.current && popoverRef.current.contains(target)) {
        clickedInsidePopover = true;
      }

      // 1. Cerrar Popover si se hace click fuera
      if (!clickedInsidePopover) {
        if (!target.closest(".menu-item-btn")) {
          setPopoverState(null);
        }
      }

      // 2. Colapsar el sidebar si el click no es en el sidebar ni en el popover
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        !clickedInsidePopover
      ) {
        setIsCollapsed(true);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (
    item: MenuItem,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (item.subItems) {
      if (isCollapsed) {
        const rect = e.currentTarget.getBoundingClientRect();
        setPopoverState(
          popoverState?.id === item.id
            ? null
            : { id: item.id, top: rect.top, left: rect.right + 16 },
        );
      } else {
        setExpandedItem(expandedItem === item.id ? null : item.id);
        setActiveItem(item.id);
      }
    } else {
      setActiveItem(item.id);
      setPopoverState(null);
      onItemChange(item.id);
    }
  };

  const handleSubItemClick = (subItemId: string) => {
    setActiveSubItem(subItemId);
    if (isCollapsed) setPopoverState(null);
    onItemChange(subItemId);
  };

  const TreeMenu = ({ items }: { items: SubItem[] }) => (
    <div className="relative flex flex-col gap-1 w-full pl-5 py-1 mt-1">
      {/* Vertical connector line */}
      <div className="absolute left-[7px] top-4 bottom-5 w-[2px] bg-current opacity-10 rounded-full" />

      {items.map((sub) => {
        const isActive = activeSubItem === sub.id;
        return (
          <div key={sub.id} className="relative flex items-center group w-full">
            {/* Horizontal connector line */}
            <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-4 h-[2px] bg-current opacity-10" />
            <button
              onClick={() => handleSubItemClick(sub.id)}
              className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? isDarkMode
                    ? "bg-white/10 text-white shadow-sm"
                    : "bg-black/5 text-black shadow-sm"
                  : isDarkMode
                    ? "text-zinc-400 hover:bg-white/5 hover:text-white"
                    : "text-zinc-600 hover:bg-black/5 hover:text-black"
              }`}
            >
              {sub.label}
              {sub.hasArrow && (
                <ChevronRight
                  size={16}
                  className={
                    isActive
                      ? isDarkMode
                        ? "text-white"
                        : "text-black"
                      : isDarkMode
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <motion.aside
      ref={sidebarRef}
      initial={false}
      animate={{ width: isCollapsed ? 88 : 280 }}
      className={`fixed left-0 top-0 h-screen flex flex-col relative z-[100] shrink-0 transition-colors duration-300 ${
        isDarkMode
          ? "bg-black/40 backdrop-blur-xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
          : "bg-white/80 backdrop-blur-xl border-r border-black/10 shadow-[4px_0_24px_rgba(0,0,0,0.1)]"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => {
          setIsCollapsed(!isCollapsed);
          setPopoverState(null);
        }}
        className={`absolute -right-4 top-8 w-8 h-8 backdrop-blur-md border shadow-sm rounded-full flex items-center justify-center transition-all z-[110] ${
          isDarkMode
            ? "bg-black/60 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:shadow-md"
            : "bg-white/90 border-black/10 text-zinc-600 hover:text-black hover:bg-black/5 hover:shadow-md"
        }`}
      >
        {isCollapsed ? (
          <ChevronRight size={16} strokeWidth={2.5} />
        ) : (
          <ChevronLeft size={16} strokeWidth={2.5} />
        )}
      </button>

      {/* Logo Area */}
      <div className="p-6 flex items-center">
        <div
          className={`w-12 h-12 border rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors duration-300 ${
            isDarkMode
              ? "bg-white/5 border-white/10"
              : "bg-black/5 border-black/10"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isDarkMode ? "bg-white" : "bg-black"
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                isDarkMode ? "bg-black/80" : "bg-white/80"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-1.5 scrollbar-hide">
        {SIDEBAR_MENU_ITEMS.map((item) => {
          const isActive =
            activeItem === item.id ||
            (item.subItems && expandedItem === item.id && !isCollapsed);
          const Icon = item.icon;

          return (
            <div key={item.id} className="relative">
              <button
                onClick={(e) => handleItemClick(item, e)}
                className={`menu-item-btn w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors relative ${
                  isActive && !isCollapsed
                    ? isDarkMode
                      ? "bg-white/10 shadow-sm"
                      : "bg-black/5 shadow-sm"
                    : isDarkMode
                      ? "hover:bg-white/5"
                      : "hover:bg-black/5"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <div
                  className={`shrink-0 transition-colors duration-300 ${
                    isActive && !isCollapsed
                      ? isDarkMode
                        ? "text-white"
                        : "text-black"
                      : isDarkMode
                        ? "text-zinc-400"
                        : "text-zinc-600"
                  }`}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive && !isCollapsed ? 2.5 : 2}
                  />
                </div>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex flex-1 items-center justify-between whitespace-nowrap overflow-hidden"
                    >
                      <span
                        className={`text-[15px] font-semibold transition-colors duration-300 ${
                          isActive
                            ? isDarkMode
                              ? "text-white"
                              : "text-black"
                            : isDarkMode
                              ? "text-zinc-300"
                              : "text-zinc-700"
                        }`}
                      >
                        {item.label}
                      </span>

                      <div className="flex items-center gap-2">
                        {item.hasPlus && (
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shadow-sm ${
                              isDarkMode
                                ? "bg-black/40 border-white/10 text-zinc-400 hover:text-white hover:bg-white/20"
                                : "bg-white/80 border-black/10 text-zinc-600 hover:text-black hover:bg-black/10"
                            }`}
                          >
                            <Plus size={12} />
                          </div>
                        )}
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-bold ${item.badge.bg} ${item.badge.textCol}`}
                          >
                            {item.badge.text}
                          </span>
                        )}
                        {item.subItems && (
                          <div
                            className={
                              isDarkMode ? "text-zinc-500" : "text-zinc-400"
                            }
                          >
                            {expandedItem === item.id ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Expanded Submenu (Only when sidebar is open) */}
              <AnimatePresence>
                {!isCollapsed && item.subItems && expandedItem === item.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <TreeMenu items={item.subItems} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Popover (Only when sidebar is collapsed) */}
              {isCollapsed &&
                popoverState?.id === item.id &&
                item.subItems &&
                createPortal(
                  <div
                    ref={popoverRef}
                    className="fixed z-[9999] flex flex-col gap-2 min-w-[220px]"
                    style={{ top: popoverState.top, left: popoverState.left }}
                  >
                    {/* Tooltip Header */}
                    <div
                      className={`backdrop-blur-md text-sm font-semibold px-4 py-2.5 rounded-xl w-max shadow-lg border ${
                        isDarkMode
                          ? "bg-zinc-900/80 text-white border-white/10"
                          : "bg-white/90 text-black border-black/10"
                      }`}
                    >
                      {item.label}
                    </div>

                    {/* Popover Body */}
                    <div
                      className={`backdrop-blur-xl rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] p-3 border ml-2 ${
                        isDarkMode
                          ? "bg-black/50 border-white/10"
                          : "bg-white/90 border-black/10"
                      }`}
                    >
                      <TreeMenu items={item.subItems} />
                    </div>
                  </div>,
                  document.body,
                )}
            </div>
          );
        })}
      </nav>

      {/* Required style to hide scrollbar cleanly across browsers */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </motion.aside>
  );
}
