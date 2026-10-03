"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { quitarFoto, subirFoto } from "@/app/admin/catalogo/actions";
import type { Resultado } from "@/lib/resultado";
import { MensajeError } from "@/components/catalogo/form-resultado";
import { Aviso, useAviso } from "@/components/aviso";

const LADO_MAXIMO = 1200;

/**
 * Achica la foto en el celular antes de subirla: una foto de cámara pesa 3–8 MB
 * y en la tienda se ve igual a 1200 px. Sale en WebP (~150 KB) y, si el
 * navegador no sabe hacer WebP, en JPEG.
 */
async function achicar(archivo: File): Promise<File> {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();

  const enFormato = (tipo: string) =>
    new Promise<Blob | null>((ok) => lienzo.toBlob(ok, tipo, 0.82));
  let blob = await enFormato("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await enFormato("image/jpeg");
  if (!blob) throw new Error("No se pudo procesar la foto");
  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `foto.${extension}`, { type: blob.type });
}

export function SubirFoto({
  id,
  tipo,
  actual,
}: {
  id: number;
  tipo: "producto" | "combo";
  actual: string | null;
}) {
  const [estado, enviar] = useActionState(subirFoto, { ok: true } as Resultado);
  const [preparando, empezar] = useTransition();
  const [vista, setVista] = useState<string | null>(actual);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [aviso, setAviso] = useAviso();
  const entrada = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (estado.ok && estado.url) {
      setVista(estado.url);
      setAviso(estado.aviso ?? "Foto guardada");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  function elegir(archivo: File | undefined) {
    if (!archivo) return;
    setErrorLocal(null);
    empezar(async () => {
      try {
        const chica = await achicar(archivo);
        setVista(URL.createObjectURL(chica));
        const datos = new FormData();
        datos.set("foto", chica);
        datos.set("id", String(id));
        datos.set("tipo", tipo);
        if (actual) datos.set("anterior", actual);
        enviar(datos);
      } catch {
        setErrorLocal("No se pudo leer esa foto. Prueba con otra.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="grid aspect-[4/5] w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-borde">
          {vista ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vista} alt="Foto del producto" className="h-full w-full object-contain" />
          ) : (
            <span className="px-2 text-center text-xs text-verde-700">Sin foto</span>
          )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={preparando}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-crema-200 px-4 text-sm font-semibold text-sobre-crema transition active:scale-95 disabled:opacity-60"
          >
            {preparando ? "Subiendo…" : vista ? "Cambiar foto" : "Tomar o elegir foto"}
          </button>
          {vista && !preparando && (
            <button
              type="button"
              onClick={() =>
                empezar(async () => {
                  const r = await quitarFoto(id, actual);
                  if (r.ok) {
                    setVista(null);
                    router.refresh();
                  } else setErrorLocal(r.error);
                })
              }
              className="block text-xs text-tinta-suave underline"
            >
              Quitar foto
            </button>
          )}
          <p className="text-xs text-tinta-suave">
            De frente, con buena luz y fondo claro. Se achica sola antes de subir.
          </p>
        </div>
      </div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => elegir(e.target.files?.[0])}
      />
      {(errorLocal || !estado.ok) && <MensajeError texto={errorLocal ?? (estado.ok ? "" : estado.error)} />}
      <Aviso texto={aviso} />
    </div>
  );
}
