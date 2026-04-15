import React from "react";
import { Home, FileText, CalendarCheck, PieChart } from "lucide-react";
import IconGenerator from "../view/IconGenerator";
import { ImageConverter } from "../view/ImageConverter";
import { PaletteExtractor } from "../view/PaletteExtractor";
import Vectorizer from "../view/Vectorizer";

export type SubItem = {
  id: string;
  label: string;
  hasArrow?: boolean;
};

export type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: {
    text: string;
    bg: string;
    textCol: string;
  };
  hasPlus?: boolean;
  subItems?: SubItem[];
  component?: React.ComponentType;
};

// Mantén exactamente tu MENU_ITEMS original pero añadiendo los componentes
export const SIDEBAR_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    // Si tienes un componente para Dashboard, añádelo aquí
    // component: DashboardComponent,
  },
  {
    id: "ElimininarFondo",
    label: "Eliminar Fondo",
    icon: FileText,
    badge: { text: "8", bg: "bg-emerald-200", textCol: "text-emerald-900" },
    component: IconGenerator, // Asigna el componente que quieras aquí
  },
  {
    id: "Paleta",
    label: "Paleta Colores",
    icon: CalendarCheck,
    hasPlus: true,
    badge: { text: "3", bg: "bg-orange-200", textCol: "text-orange-900" },
    component: PaletteExtractor, // Asigna el componente que quieras aquí
  },
  {
    id: "Conversor",
    label: "Conversor",
    icon: PieChart,
    subItems: [
      { id: "Iconos", label: "Iconos" },
      { id: "Imagene", label: "Imagenes", hasArrow: true },
    ],
    component: ImageConverter, // Asigna el componente que quieras aquí
  },
];

/**
 * Obtiene un item del menú por su ID
 * @param id - El ID del item del menú
 * @returns El item del menú o undefined si no existe
 */
export const getMenuItemById = (id: string): MenuItem | undefined => {
  return SIDEBAR_MENU_ITEMS.find((item) => item.id === id);
};

/**
 * Obtiene el componente asociado a un item del menú
 * @param itemId - El ID del item del menú
 * @returns El componente React o undefined
 */
export const getComponentByMenuId = (
  itemId: string,
): React.ComponentType | undefined => {
  // Primero busca en items principales
  const item = getMenuItemById(itemId);
  if (item?.component) return item.component;

  // Si no encuentra, busca en subItems
  for (const menuItem of SIDEBAR_MENU_ITEMS) {
    if (menuItem.subItems) {
      const subItem = menuItem.subItems.find((sub) => sub.id === itemId);
      if (subItem) {
        // Si encuentra un subItem, retorna el componente del padre o undefined
        return menuItem.component;
      }
    }
  }

  return undefined;
};

/**
 * Verifica si un item tiene un componente asociado
 * @param itemId - El ID del item
 * @returns true si el item tiene componente
 */
export const hasComponent = (itemId: string): boolean => {
  return !!getComponentByMenuId(itemId);
};

/**
 * Obtiene todos los items del menú que tienen componentes
 * @returns Array de items con componentes
 */
export const getMenuItemsWithComponents = (): MenuItem[] => {
  return SIDEBAR_MENU_ITEMS.filter((item) => item.component);
};
