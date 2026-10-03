/**
 * Los dibujos de los «estantes» de la tienda. La clave se guarda en la
 * categoría (columna `icono` en la API); el dibujo lo pinta
 * `src/components/tienda/dibujos.tsx`.
 */
export const ICONOS = [
  { clave: "todo", nombre: "Cuadritos (todo)" },
  { clave: "botella-azul", nombre: "Botella azul (aguardiente)" },
  { clave: "botella-ambar", nombre: "Botella ámbar (ron)" },
  { clave: "botella-whisky", nombre: "Botella de whisky" },
  { clave: "vino", nombre: "Botella de vino" },
  { clave: "licor-crema", nombre: "Botella clara (cremas, sabajón)" },
  { clave: "lata", nombre: "Lata (cerveza)" },
  { clave: "gaseosa", nombre: "Gaseosa" },
  { clave: "hielo", nombre: "Bolsa de hielo" },
  { clave: "bunuelo", nombre: "Buñuelos (Navidad)" },
  { clave: "bolsa", nombre: "Paquete (mecato)" },
  { clave: "vaso", nombre: "Vaso (desechables)" },
] as const;

export type ClaveIcono = (typeof ICONOS)[number]["clave"];
