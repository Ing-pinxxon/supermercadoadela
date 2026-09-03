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
