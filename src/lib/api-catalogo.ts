/**
 * Cliente de la API del catálogo (la de Java, en Render).
 *
 * Solo se usa desde el servidor: la clave `CATALOGO_API_KEY` nunca llega al
 * navegador. Los tipos de aquí son espejo de los `record` de Java; si allá
 * cambia uno, se cambia aquí.
 *
 * Lo público se cachea con la etiqueta «catalogo» (se refresca solo cada pocos
 * minutos y al instante cuando se edita algo). Lo de administración nunca se
 * cachea.
 */
import { rolActual } from "@/lib/sesion";

// --- Tipos (espejo de api/src/main/java/.../Vistas.java y compañía) ---------

export type Disponibilidad = "DISPONIBLE" | "ULTIMAS" | "AGOTADO";

export type ProductoVista = {
  id: number;
  slug: string;
  nombre: string;
  presentacion: string | null;
  precio: number;
  precioAntes: number | null;
  fotoUrl: string | null;
  disponibilidad: Disponibilidad;
  categoria: string;
  categoriaSlug: string;
  icono: string;
  esLicor: boolean;
  destacado: boolean;
};

export type CategoriaVista = {
  slug: string;
  nombre: string;
  descripcion: string | null;
  icono: string;
  esLicor: boolean;
  productos: ProductoVista[];
};

export type ComboVista = {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precioPorSeparado: number;
  fotoUrl: string | null;
  disponibilidad: Disponibilidad;
  deLaSemana: boolean;
  esLicor: boolean;
  items: { nombre: string; presentacion: string | null; cantidad: number }[];
};

export type CatalogoVista = { categorias: CategoriaVista[]; combos: ComboVista[] };

export type ProductoDetalle = {
  producto: ProductoVista;
  descripcion: string | null;
  grados: number | null;
  origen: string | null;
  relacionados: ProductoVista[];
};

export type TiendaVista = {
  nombre: string;
  whatsapp: string;
  direccion: string;
  barrio: string | null;
  ciudad: string;
  abre: string;
  cierra: string;
  notaHorario: string | null;
  mapsUrl: string | null;
  valorDomicilio: number | null;
  aceptaTransferencia: boolean;
  temporada: boolean;
  bannerTitulo: string | null;
  bannerTexto: string | null;
  bannerSello: string | null;
  googleVerificacion: string | null;
  version: number;
};

export type ProductoAdmin = {
  id: number;
  slug: string;
  nombre: string;
  presentacion: string | null;
  descripcion: string | null;
  categoriaId: number;
  categoria: string;
  precio: number;
  precioAntes: number | null;
  stock: number | null;
  disponibilidad: Disponibilidad;
  fotoUrl: string | null;
  grados: number | null;
  origen: string | null;
  publicado: boolean;
  destacado: boolean;
  orden: number;
  version: number;
  relacionados: number[];
  actualizadoEn: string;
};

export type CategoriaAdmin = {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string | null;
  icono: string;
  orden: number;
  esLicor: boolean;
  visible: boolean;
  productos: number;
};

export type ComboAdmin = {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precioPorSeparado: number;
  fotoUrl: string | null;
  publicado: boolean;
  deLaSemana: boolean;
  disponibilidad: Disponibilidad;
  version: number;
  items: {
    productoId: number;
    nombre: string;
    presentacion: string | null;
    cantidad: number;
    precio: number;
    publicado: boolean;
  }[];
};

export type CambioVista = {
  campo: string;
  antes: string | null;
  despues: string | null;
  quien: string;
  cuando: string;
};

export type LineaPedido = {
  tipo: "PRODUCTO" | "COMBO";
  id: number;
  cantidad: number;
  precioVisto?: number;
};

export type DatosEntrega = {
  entrega: "DOMICILIO" | "RECOGER";
  nombre: string;
  direccion?: string;
  nota?: string;
  pago: "EFECTIVO" | "TRANSFERENCIA";
};

export type PedidoRespuesta = {
  lineas: {
    tipo: "PRODUCTO" | "COMBO";
    id: number;
    nombre: string;
    presentacion: string | null;
    cantidad: number;
    precio: number;
    total: number;
    disponibilidad: Disponibilidad;
  }[];
  subtotal: number;
  domicilio: number | null;
  total: number;
  avisos: string[];
  mensaje: string | null;
  enlace: string | null;
};

// --- Transporte ---------------------------------------------------------

export const ETIQUETA_CATALOGO = "catalogo";

/** Un error de la API ya en español, listo para mostrarlo en la pantalla. */
export class ErrorCatalogo extends Error {
  constructor(
    mensaje: string,
    readonly estado: number,
    readonly errores: Record<string, string> = {},
  ) {
    super(mensaje);
  }
}

export function catalogoConfigurado(): boolean {
  return Boolean(process.env.CATALOGO_API_URL);
}

function base(): string {
  const url = process.env.CATALOGO_API_URL;
  if (!url) {
    throw new ErrorCatalogo(
      "Falta CATALOGO_API_URL: la dirección de la API del catálogo (Render).",
      503,
    );
  }
  return url.replace(/\/+$/, "");
}

type Opciones = {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  /** Lleva la API key: para todo lo de /admin. */
  admin?: boolean;
  /** Segundos de caché para lo público; sin esto no se cachea. */
  cache?: number;
  /** Render gratis tarda hasta ~50 s en despertar. */
  esperaMs?: number;
};

async function pedir<T>(ruta: string, o: Opciones = {}): Promise<T> {
  const cabeceras: Record<string, string> = { Accept: "application/json" };
  if (o.cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
  if (o.admin) {
    cabeceras["X-Api-Key"] = process.env.CATALOGO_API_KEY ?? "";
    // Para el historial: con qué clave se entró a la página.
    const rol = await rolActual();
    cabeceras["X-Usuario"] = rol === "usuario" ? "tienda" : "admin";
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${base()}${ruta}`, {
      method: o.metodo ?? "GET",
      headers: cabeceras,
      body: o.cuerpo === undefined ? undefined : JSON.stringify(o.cuerpo),
      signal: AbortSignal.timeout(o.esperaMs ?? 55_000),
      ...(o.cache !== undefined
        ? { next: { revalidate: o.cache, tags: [ETIQUETA_CATALOGO] } }
        : { cache: "no-store" as const }),
    });
  } catch (e) {
    if (e instanceof ErrorCatalogo) throw e;
    throw new ErrorCatalogo(
      "No se pudo hablar con el catálogo. Si lleva rato sin uso, está despertando: intenta de nuevo en un minuto.",
      503,
    );
  }

  if (respuesta.status === 204) return undefined as T;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorCatalogo(
      datos?.detail ?? `El catálogo respondió ${respuesta.status}.`,
      respuesta.status,
      datos?.errores ?? {},
    );
  }
  return datos as T;
}

// --- Público (cacheado) -------------------------------------------------

/** Cinco minutos: si Render duerme, el cliente ve lo último que se leyó. */
const CINCO_MINUTOS = 300;

export const api = {
  catalogo: () => pedir<CatalogoVista>("/api/v1/catalogo", { cache: CINCO_MINUTOS }),
  tienda: () => pedir<TiendaVista>("/api/v1/tienda", { cache: CINCO_MINUTOS }),
  categoria: (slug: string) =>
    pedir<CategoriaVista>(`/api/v1/categorias/${encodeURIComponent(slug)}`, { cache: CINCO_MINUTOS }),
  producto: (slug: string) =>
    pedir<ProductoDetalle>(`/api/v1/productos/${encodeURIComponent(slug)}`, { cache: CINCO_MINUTOS }),

  /** El carrito siempre con lo de ahora: sin caché. */
  revisar: (lineas: LineaPedido[]) =>
    pedir<PedidoRespuesta>("/api/v1/pedidos/revisar", {
      metodo: "POST",
      cuerpo: { lineas },
      esperaMs: 25_000,
    }),
  whatsapp: (lineas: LineaPedido[], datos: DatosEntrega) =>
    pedir<PedidoRespuesta>("/api/v1/pedidos/whatsapp", {
      metodo: "POST",
      cuerpo: { lineas, datos },
      esperaMs: 25_000,
    }),
};

// --- Administración (con API key, sin caché) ----------------------------

export const apiAdmin = {
  productos: () => pedir<ProductoAdmin[]>("/api/v1/admin/productos", { admin: true }),
  producto: (id: number) => pedir<ProductoAdmin>(`/api/v1/admin/productos/${id}`, { admin: true }),
  crearProducto: (cuerpo: unknown) =>
    pedir<ProductoAdmin>("/api/v1/admin/productos", { admin: true, metodo: "POST", cuerpo }),
  editarProducto: (id: number, cuerpo: unknown) =>
    pedir<ProductoAdmin>(`/api/v1/admin/productos/${id}`, { admin: true, metodo: "PUT", cuerpo }),
  stock: (id: number, cuerpo: { delta?: number; valor?: number; sinControl?: boolean }) =>
    pedir<ProductoAdmin>(`/api/v1/admin/productos/${id}/stock`, { admin: true, metodo: "PATCH", cuerpo }),
  precio: (id: number, cuerpo: { precio: number; precioAntes: number | null }) =>
    pedir<ProductoAdmin>(`/api/v1/admin/productos/${id}/precio`, { admin: true, metodo: "PATCH", cuerpo }),
  publicado: (id: number, publicado: boolean) =>
    pedir<ProductoAdmin>(`/api/v1/admin/productos/${id}/publicado`, {
      admin: true,
      metodo: "PATCH",
      cuerpo: { publicado },
    }),
  foto: (id: number, fotoUrl: string | null) =>
    pedir<ProductoAdmin>(`/api/v1/admin/productos/${id}/foto`, {
      admin: true,
      metodo: "PATCH",
      cuerpo: { fotoUrl: fotoUrl ?? "" },
    }),
  relacionados: (id: number, ids: number[]) =>
    pedir<ProductoAdmin>(`/api/v1/admin/productos/${id}/relacionados`, {
      admin: true,
      metodo: "PUT",
      cuerpo: { ids },
    }),
  historial: (id: number) => pedir<CambioVista[]>(`/api/v1/admin/productos/${id}/historial`, { admin: true }),
  borrarProducto: (id: number) =>
    pedir<void>(`/api/v1/admin/productos/${id}`, { admin: true, metodo: "DELETE" }),

  categorias: () => pedir<CategoriaAdmin[]>("/api/v1/admin/categorias", { admin: true }),
  crearCategoria: (cuerpo: unknown) =>
    pedir<CategoriaAdmin>("/api/v1/admin/categorias", { admin: true, metodo: "POST", cuerpo }),
  editarCategoria: (id: number, cuerpo: unknown) =>
    pedir<CategoriaAdmin>(`/api/v1/admin/categorias/${id}`, { admin: true, metodo: "PUT", cuerpo }),
  borrarCategoria: (id: number) =>
    pedir<void>(`/api/v1/admin/categorias/${id}`, { admin: true, metodo: "DELETE" }),

  combos: () => pedir<ComboAdmin[]>("/api/v1/admin/combos", { admin: true }),
  combo: (id: number) => pedir<ComboAdmin>(`/api/v1/admin/combos/${id}`, { admin: true }),
  crearCombo: (cuerpo: unknown) =>
    pedir<ComboAdmin>("/api/v1/admin/combos", { admin: true, metodo: "POST", cuerpo }),
  editarCombo: (id: number, cuerpo: unknown) =>
    pedir<ComboAdmin>(`/api/v1/admin/combos/${id}`, { admin: true, metodo: "PUT", cuerpo }),
  borrarCombo: (id: number) =>
    pedir<void>(`/api/v1/admin/combos/${id}`, { admin: true, metodo: "DELETE" }),

  /** Los datos de la tienda sin caché, para editarlos. */
  tienda: () => pedir<TiendaVista>("/api/v1/tienda"),
  guardarTienda: (cuerpo: unknown) =>
    pedir<TiendaVista>("/api/v1/admin/tienda", { admin: true, metodo: "PUT", cuerpo }),
};

/**
 * Para las páginas de administración: devuelve los datos o el mensaje de por
 * qué no se pudieron traer, sin romper la pantalla.
 */
export async function cargar<T>(
  traer: () => Promise<T>,
): Promise<{ datos: T; error: null } | { datos: null; error: string }> {
  try {
    return { datos: await traer(), error: null };
  } catch (e) {
    if (e instanceof ErrorCatalogo) return { datos: null, error: e.message };
    throw e;
  }
}
