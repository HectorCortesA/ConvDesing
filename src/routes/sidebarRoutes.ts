import React from "react";
import { Home, FileText, CalendarCheck, PieChart } from "lucide-react";
import IconGenerator from "../view/IconGenerator";
import { ImageConverter } from "../view/ImageConverter";
import { PaletteExtractor } from "../view/PaletteExtractor";
import PaletteColors from "../view/PaletteColors";
import { BackgroundRemover } from "../view/Backgroundremover";
import Vectorizer from "../view/Vectorizer.tsx";
import Configuracion from "../view/Configurancion.tsx";

export type SubItem = {
  id: string;
  label: string;
  hasArrow?: boolean;
  component?: React.ComponentType;
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

export const SIDEBAR_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
  },
  {
    id: "ElimininarFondo",
    label: "Eliminar Fondo",
    icon: FileText,
    component: BackgroundRemover,
  },
  {
    id: "Paleta",
    label: "Extraer Paleta Color",
    icon: CalendarCheck,
    component: PaletteExtractor,
  },
  {
    id: "PaletasGuardadas",
    label: "Paleta de color",
    icon: CalendarCheck,
    component: PaletteColors,
  },
  {
    id: "Conversor",
    label: "Conversor",
    icon: PieChart,
    subItems: [
      {
        id: "Iconos",
        label: "Iconos",
        component: IconGenerator,
      },
      {
        id: "Imagene",
        label: "Imagenes",
        component: ImageConverter,
      },
    ],
  },
  {
    id: "Vectorizador",
    label: "Vectorizador",
    icon: CalendarCheck,
    component: Vectorizer,
  },

  {
    id: "Configuracion",
    label: "Configuracion",
    icon: CalendarCheck,
    component: Configuracion,
  },
];

/**
 * Obtiene un item del menú por su ID
 */
export const getMenuItemById = (id: string): MenuItem | undefined => {
  return SIDEBAR_MENU_ITEMS.find((item) => item.id === id);
};

/**
 * Obtiene el componente asociado a un item del menú
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
      if (subItem?.component) {
        return subItem.component; // 👈 CORRECCIÓN: Retorna el componente del subItem
      }
    }
  }

  return undefined;
};

/**
 * Verifica si un item tiene un componente asociado
 */
export const hasComponent = (itemId: string): boolean => {
  return !!getComponentByMenuId(itemId);
};

/**
 * Obtiene todos los items del menú que tienen componentes
 */
export const getMenuItemsWithComponents = (): MenuItem[] => {
  return SIDEBAR_MENU_ITEMS.filter((item) => item.component);
};
