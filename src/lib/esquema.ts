/**
 * El esquema de la base, tal cual. Fuente de verdad del modelo de datos.
 *
 * Antes esto era `db/schema.sql`. Está aquí como texto de TypeScript para que
 * también viaje dentro del paquete que se despliega (Vercel solo sube lo que el
 * código importa, y un `.sql` suelto no lo importa nadie): así la pantalla
 * `/instalar` puede crear las tablas desde la app misma, sin CLI.
 *
 * Es idempotente: se puede correr las veces que sea.
 */
export const ESQUEMA_SQL = `
-- Esquema de Supermercado Adela.
-- Es idempotente: se puede correr las veces que sea (npm run db:setup).
-- Todos los montos son enteros en pesos; el peso colombiano no usa centavos.
--
-- El modelo es el mismo de la hoja "TIENDA":
--   ingreso bruto del día = venta en efectivo + salidas − entradas
-- donde "salidas" es todo lo que salió de la caja (proveedores, mercado,
-- trabajador, gastos) y "entradas" es la plata que entró sin ser venta
-- (prestados de ayer, venta de ayer que se sumó, aportes).

-- --- Operación diaria -----------------------------------------------

CREATE TABLE IF NOT EXISTS movimiento (
  id         TEXT PRIMARY KEY,
  fecha      DATE NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('SALIDA', 'ENTRADA')),
  -- Texto libre, igual que en la hoja: "Postobon", "Mercado", "Trabajador".
  concepto   TEXT NOT NULL,
  -- Puede ser negativo en una salida: devolución o nota crédito.
  monto      INTEGER NOT NULL,
  nota       TEXT,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS movimiento_fecha_idx ON movimiento (fecha);
CREATE INDEX IF NOT EXISTS movimiento_concepto_idx ON movimiento (lower(concepto));

CREATE TABLE IF NOT EXISTS cierre_dia (
  fecha           DATE PRIMARY KEY,
  venta_efectivo  INTEGER NOT NULL DEFAULT 0,
  observaciones   TEXT,
  cerrado         BOOLEAN NOT NULL DEFAULT FALSE,
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conteo de efectivo al cerrar la semana, para comparar con la anterior.
CREATE TABLE IF NOT EXISTS semana (
  lunes            DATE PRIMARY KEY,
  cuenta_efectivo  INTEGER,
  nota             TEXT,
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --- Archivo histórico (solo lectura) -------------------------------
-- Viene de la hoja de cálculo. Se guardan los totales que la hoja ya traía
-- calculados, porque son los que Daniel usó; el detalle por concepto se guarda
-- aparte y en algunos días no suma exactamente el total (así estaba en la hoja).

CREATE TABLE IF NOT EXISTS historico_dia (
  fecha           DATE PRIMARY KEY,
  total_salidas   INTEGER NOT NULL DEFAULT 0,
  total_entradas  INTEGER NOT NULL DEFAULT 0,
  venta_efectivo  INTEGER NOT NULL DEFAULT 0,
  ingreso_bruto   INTEGER NOT NULL DEFAULT 0,
  -- FALSE cuando el detalle no suma el total que traía la hoja.
  detalle_cuadra  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS historico_detalle (
  id        TEXT PRIMARY KEY,
  fecha     DATE NOT NULL,
  tipo      TEXT NOT NULL CHECK (tipo IN ('SALIDA', 'ENTRADA')),
  concepto  TEXT NOT NULL,
  monto     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS historico_detalle_fecha_idx ON historico_detalle (fecha);

-- --- Módulo de tareas (independiente del de caja) -------------------

CREATE TABLE IF NOT EXISTS tarea_plantilla (
  id          TEXT PRIMARY KEY,
  titulo      TEXT NOT NULL,
  detalle     TEXT,
  dia_semana  SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  franja      TEXT NOT NULL DEFAULT 'MANANA'
              CHECK (franja IN ('MANANA','TARDE','NOCHE')),
  orden       INTEGER NOT NULL DEFAULT 0,
  activa      BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tarea_plantilla_dia_idx ON tarea_plantilla (dia_semana, activa);

CREATE TABLE IF NOT EXISTS tarea_hecha (
  id            TEXT PRIMARY KEY,
  plantilla_id  TEXT NOT NULL REFERENCES tarea_plantilla(id) ON DELETE CASCADE,
  fecha         DATE NOT NULL,
  hecha         BOOLEAN NOT NULL DEFAULT FALSE,
  nota          TEXT,
  marcada_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plantilla_id, fecha)
);

CREATE INDEX IF NOT EXISTS tarea_hecha_fecha_idx ON tarea_hecha (fecha);

-- --- Cómo se pagó ---------------------------------------------------
-- Se agregan con ALTER para que una base que ya está en uso se actualice
-- sola, sin perder nada. Correrlo de nuevo no hace daño.
--
-- El medio es una etiqueta: un pago por transferencia cuenta en las salidas
-- y en el ingreso bruto igual que uno en efectivo. Sirve para saber después
-- por dónde salió la plata, no para cambiar la cuenta.

ALTER TABLE movimiento
  ADD COLUMN IF NOT EXISTS medio TEXT NOT NULL DEFAULT 'EFECTIVO';
ALTER TABLE movimiento DROP CONSTRAINT IF EXISTS movimiento_medio_check;
ALTER TABLE movimiento
  ADD CONSTRAINT movimiento_medio_check
  CHECK (medio IN ('EFECTIVO', 'TRANSFERENCIA'));

-- La venta que entra por Nequi o transferencia se lleva aparte de la de
-- efectivo: el ingreso bruto sigue siendo la fórmula de caja de la hoja.
ALTER TABLE cierre_dia
  ADD COLUMN IF NOT EXISTS venta_transferencia INTEGER NOT NULL DEFAULT 0;

-- --- Fiados ---------------------------------------------------------
-- Quien se lleva mercancía y paga después. Es su propio módulo: fiar no toca
-- la caja (no entró ni salió plata, solo nace la deuda) y abonar sí, con un
-- movimiento de ENTRADA enlazado.

CREATE TABLE IF NOT EXISTS deudor (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL,
  -- Nombre normalizado (minúsculas, sin tildes ni espacios). Es UNIQUE para
  -- que "Doña Rosa" y "dona rosa" no queden como dos personas distintas.
  clave      TEXT NOT NULL UNIQUE,
  telefono   TEXT,
  nota       TEXT,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fiado (
  id         TEXT PRIMARY KEY,
  deudor_id  TEXT NOT NULL REFERENCES deudor(id) ON DELETE CASCADE,
  fecha      DATE NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('FIADO', 'ABONO')),
  monto      INTEGER NOT NULL CHECK (monto > 0),
  medio      TEXT NOT NULL DEFAULT 'EFECTIVO'
             CHECK (medio IN ('EFECTIVO', 'TRANSFERENCIA')),
  nota       TEXT,
  -- El abono también entra a la caja. Se enlaza para que borrar el abono
  -- borre su entrada y la caja no quede descuadrada.
  movimiento_id TEXT REFERENCES movimiento(id) ON DELETE SET NULL,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fiado_deudor_idx ON fiado (deudor_id);
CREATE INDEX IF NOT EXISTS fiado_fecha_idx ON fiado (fecha);

-- --- Una tarea de la rutina, aunque se repita varios días -----------
-- Cada día de la semana es su propia fila (con su propio historial en
-- tarea_hecha). La columna grupo_id es lo que las vuelve «una sola tarea»,
-- para poder editarlas juntas.

ALTER TABLE tarea_plantilla ADD COLUMN IF NOT EXISTS grupo_id TEXT;

-- Las filas que ya existían se agrupan por título y franja, que es exactamente
-- como las creó el formulario: el mismo título repetido en cada día. Solo toca
-- las que no tienen grupo, así que correrlo de nuevo no hace nada.
UPDATE tarea_plantilla t SET grupo_id = g.primero
  FROM (SELECT titulo, franja, MIN(id) AS primero
          FROM tarea_plantilla GROUP BY titulo, franja) g
 WHERE t.grupo_id IS NULL AND t.titulo = g.titulo AND t.franja = g.franja;

CREATE INDEX IF NOT EXISTS tarea_plantilla_grupo_idx
  ON tarea_plantilla (grupo_id);
`;
