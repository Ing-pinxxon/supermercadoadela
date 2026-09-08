"use client";

import { useRouter } from "next/navigation";

/**
 * Un formulario que refresca la pantalla después de guardar.
 *
 * Con un `<form action={…}>` normal pasaba esto: la acción guardaba bien (la
 * base quedaba con el dato y al recargar a mano se veía), pero la pantalla
 * seguía mostrando lo de antes. En la tienda eso es feo de verdad — uno toca
 * una tarea, no cambia nada, la vuelve a tocar y la desmarca; o guarda la venta
 * y cree que no quedó.
 *
 * `router.refresh()` vuelve a pedir la pantalla al servidor en cuanto la acción
 * termina. Todas las pantallas son `force-dynamic`, así que no hay caché que
 * perder: pedirla de nuevo no cuesta nada.
 */
export function FormAccion({
  action,
  children,
  className,
}: {
  action: (datos: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <form
      className={className}
      action={async (datos) => {
        await action(datos);
        router.refresh();
      }}
    >
      {children}
    </form>
  );
}
