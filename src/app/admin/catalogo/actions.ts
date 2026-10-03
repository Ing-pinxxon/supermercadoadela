"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { del, put } from "@vercel/blob";
import { apiAdmin, ErrorCatalogo, ETIQUETA_CATALOGO } from "@/lib/api-catalogo";
import { exigirAdmin, exigirSesion } from "@/lib/sesion";
import { leerMonto, leerTexto } from "@/lib/dinero";
import type { Resultado } from "@/lib/resultado";

/**
 * Corre un cambio contra la API y lo convierte en un Resultado. Después de
 * cualquier cambio se refresca lo que ve el cliente (la caché «catalogo»).
 */
async function intentar(cambio: () => Promise<unknown>, aviso?: string): Promise<Resultado> {
  await exigirSesion();
  try {
    const r = await cambio();
    revalidateTag(ETIQUETA_CATALOGO);
    const id = r && typeof r === "object" && "id" in r && typeof r.id === "number" ? r.id : undefined;
    return { ok: true, aviso, id };
  } catch (e) {
    if (e instanceof ErrorCatalogo) return { ok: false, error: e.message, errores: e.errores };
    console.error(e);
    return { ok: false, error: "Algo salió mal al guardar. Intenta de nuevo." };
  }
}

const numero = (v: FormDataEntryValue | null) => Number(String(v ?? ""));
/** Vacío → null; si no, el monto sin puntos. */
const montoOpcional = (v: FormDataEntryValue | null) =>
  String(v ?? "").trim() === "" ? null : leerMonto(v);
const casilla = (v: FormDataEntryValue | null) => v === "on" || v === "true";

// --- Productos: los cambios rápidos de la lista ---------------------------

export async function cambiarStock(id: number, cambio: { delta?: number; valor?: number; sinControl?: boolean }) {
  return intentar(() => apiAdmin.stock(id, cambio));
}

export async function cambiarPrecio(id: number, precio: number, precioAntes: number | null) {
  return intentar(() => apiAdmin.precio(id, { precio, precioAntes }));
}

export async function cambiarPublicado(id: number, publicado: boolean) {
  return intentar(
    () => apiAdmin.publicado(id, publicado),
    publicado ? "Ya está en la tienda" : "Ya no se ve en la tienda",
  );
}

// --- Productos: el formulario completo ------------------------------------

export async function guardarProducto(_: Resultado, datos: FormData): Promise<Resultado> {
  const id = numero(datos.get("id"));
  const stockCrudo = String(datos.get("stock") ?? "").trim();
  const gradosCrudo = String(datos.get("grados") ?? "").replace(",", ".").trim();
  const cuerpo = {
    nombre: leerTexto(datos.get("nombre")) ?? "",
    presentacion: leerTexto(datos.get("presentacion")),
    descripcion: leerTexto(datos.get("descripcion")),
    categoriaId: numero(datos.get("categoriaId")) || null,
    precio: leerMonto(datos.get("precio")),
    precioAntes: montoOpcional(datos.get("precioAntes")),
    stock: stockCrudo === "" ? null : Number(stockCrudo),
    fotoUrl: leerTexto(datos.get("fotoUrl")) ?? "",
    grados: gradosCrudo === "" ? null : Number(gradosCrudo),
    origen: leerTexto(datos.get("origen")),
    publicado: casilla(datos.get("publicado")),
    destacado: casilla(datos.get("destacado")),
    version: id ? numero(datos.get("version")) : null,
  };
  const r = await intentar(
    () => (id ? apiAdmin.editarProducto(id, cuerpo) : apiAdmin.crearProducto(cuerpo)),
    id ? "Guardado" : "Producto creado",
  );
  // Recién creado: a su ficha, para ponerle la foto. (Fuera del try: redirect
  // funciona lanzando una excepción especial.)
  if (!id && r.ok && r.id) redirect(`/admin/catalogo/${r.id}`);
  return r;
}

export async function guardarRelacionados(id: number, ids: number[]) {
  return intentar(() => apiAdmin.relacionados(id, ids), "Guardado");
}

export async function borrarProducto(id: number) {
  return intentar(() => apiAdmin.borrarProducto(id), "Producto borrado");
}

// --- Fotos (Vercel Blob) ----------------------------------------------------

/**
 * Recibe la foto ya achicada en el celular (WebP de ~150 KB), la sube a Vercel
 * Blob y guarda el enlace en el producto o el combo. Borra la anterior para no
 * acumular fotos que nadie ve.
 */
export async function subirFoto(_: Resultado, datos: FormData): Promise<Resultado> {
  await exigirSesion();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error:
        "Falta conectar Vercel Blob (donde se guardan las fotos). En Vercel: Storage → Blob → conectar al proyecto, y volver a desplegar.",
    };
  }
  const archivo = datos.get("foto");
  const id = numero(datos.get("id"));
  const tipo = String(datos.get("tipo") ?? "producto");
  const anterior = leerTexto(datos.get("anterior"));
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "Elige una foto." };
  if (!archivo.type.startsWith("image/")) return { ok: false, error: "Ese archivo no es una foto." };
  if (archivo.size > 1_800_000) return { ok: false, error: "La foto es muy pesada. Intenta con otra." };

  try {
    const extension = archivo.type === "image/webp" ? "webp" : "jpg";
    const subida = await put(`${tipo}s/${id}.${extension}`, archivo, {
      access: "public",
      addRandomSuffix: true,
      contentType: archivo.type,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    if (tipo === "combo") {
      const combo = await apiAdmin.combo(id);
      await apiAdmin.editarCombo(id, {
        ...cuerpoCombo(combo),
        fotoUrl: subida.url,
      });
    } else {
      await apiAdmin.foto(id, subida.url);
    }
    if (anterior?.includes(".blob.vercel-storage.com")) await del(anterior).catch(() => {});
    revalidateTag(ETIQUETA_CATALOGO);
    return { ok: true, aviso: "Foto guardada", url: subida.url };
  } catch (e) {
    if (e instanceof ErrorCatalogo) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "No se pudo subir la foto. Revisa la conexión e intenta de nuevo." };
  }
}

export async function quitarFoto(id: number, anterior: string | null) {
  const r = await intentar(() => apiAdmin.foto(id, null), "Foto quitada");
  if (r.ok && anterior?.includes(".blob.vercel-storage.com")) await del(anterior).catch(() => {});
  return r;
}

// --- Categorías -----------------------------------------------------------

export async function guardarCategoria(_: Resultado, datos: FormData): Promise<Resultado> {
  const id = numero(datos.get("id"));
  const ordenCrudo = String(datos.get("orden") ?? "").trim();
  const cuerpo = {
    nombre: leerTexto(datos.get("nombre")) ?? "",
    descripcion: leerTexto(datos.get("descripcion")),
    icono: leerTexto(datos.get("icono")) ?? "todo",
    orden: ordenCrudo === "" ? null : Number(ordenCrudo),
    esLicor: casilla(datos.get("esLicor")),
    visible: casilla(datos.get("visible")),
  };
  return intentar(
    () => (id ? apiAdmin.editarCategoria(id, cuerpo) : apiAdmin.crearCategoria(cuerpo)),
    id ? "Guardado" : "Categoría creada",
  );
}

export async function borrarCategoria(id: number) {
  return intentar(() => apiAdmin.borrarCategoria(id), "Categoría borrada");
}

// --- Combos ---------------------------------------------------------------

type ComboParaGuardar = Awaited<ReturnType<typeof apiAdmin.combo>>;

function cuerpoCombo(c: ComboParaGuardar) {
  return {
    nombre: c.nombre,
    descripcion: c.descripcion,
    precio: c.precio,
    fotoUrl: c.fotoUrl ?? "",
    publicado: c.publicado,
    deLaSemana: c.deLaSemana,
    items: c.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
    version: c.version,
  };
}

export async function guardarCombo(_: Resultado, datos: FormData): Promise<Resultado> {
  const id = numero(datos.get("id"));
  const productos = datos.getAll("productoId").map(numero);
  const cantidades = datos.getAll("cantidad").map(numero);
  const items = productos
    .map((productoId, i) => ({ productoId, cantidad: cantidades[i] || 1 }))
    .filter((i) => i.productoId > 0);
  const cuerpo = {
    nombre: leerTexto(datos.get("nombre")) ?? "",
    descripcion: leerTexto(datos.get("descripcion")),
    precio: leerMonto(datos.get("precio")),
    fotoUrl: leerTexto(datos.get("fotoUrl")) ?? "",
    publicado: casilla(datos.get("publicado")),
    deLaSemana: casilla(datos.get("deLaSemana")),
    items,
    version: id ? numero(datos.get("version")) : null,
  };
  const r = await intentar(
    () => (id ? apiAdmin.editarCombo(id, cuerpo) : apiAdmin.crearCombo(cuerpo)),
    id ? "Guardado" : "Combo creado",
  );
  if (!id && r.ok && r.id) redirect(`/admin/catalogo/combos/${r.id}`);
  return r;
}

export async function borrarCombo(id: number) {
  return intentar(() => apiAdmin.borrarCombo(id), "Combo borrado");
}

// --- Datos de la tienda (solo el administrador) ----------------------------

export async function guardarTienda(_: Resultado, datos: FormData): Promise<Resultado> {
  await exigirAdmin("/admin/tienda");
  const domicilio = String(datos.get("valorDomicilio") ?? "").trim();
  const cuerpo = {
    nombre: leerTexto(datos.get("nombre")) ?? "",
    whatsapp: leerTexto(datos.get("whatsapp")) ?? "",
    direccion: leerTexto(datos.get("direccion")) ?? "",
    barrio: leerTexto(datos.get("barrio")),
    ciudad: leerTexto(datos.get("ciudad")) ?? "",
    abre: leerTexto(datos.get("abre")) ?? "",
    cierra: leerTexto(datos.get("cierra")) ?? "",
    notaHorario: leerTexto(datos.get("notaHorario")),
    mapsUrl: leerTexto(datos.get("mapsUrl")) ?? "",
    valorDomicilio: domicilio === "" ? null : leerMonto(domicilio),
    aceptaTransferencia: casilla(datos.get("aceptaTransferencia")),
    temporada: casilla(datos.get("temporada")),
    bannerTitulo: leerTexto(datos.get("bannerTitulo")),
    bannerTexto: leerTexto(datos.get("bannerTexto")),
    bannerSello: leerTexto(datos.get("bannerSello")),
    googleVerificacion: leerTexto(datos.get("googleVerificacion")) ?? "",
    version: numero(datos.get("version")),
  };
  return intentar(() => apiAdmin.guardarTienda(cuerpo), "Datos guardados");
}
