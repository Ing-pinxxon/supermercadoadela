-- El catálogo de la tienda en línea.
--
-- Vive en el esquema «catalogo» (lo crea Flyway), aparte de las tablas de caja,
-- fiados y tareas que maneja la app de Next en el esquema «public».
-- Los montos son enteros en pesos: el peso colombiano no usa centavos.
-- Las migraciones no se editan una vez desplegadas: si algo cambia, va en una V nueva.

CREATE TABLE categoria (
  id           BIGSERIAL PRIMARY KEY,
  slug         TEXT    NOT NULL UNIQUE,
  nombre       TEXT    NOT NULL,
  -- Texto para Google en la página de la categoría.
  descripcion  TEXT,
  -- Qué dibujo usa la tienda para el «estante» de la categoría.
  icono        TEXT    NOT NULL DEFAULT 'todo',
  orden        INTEGER NOT NULL DEFAULT 0,
  -- Licores: piden confirmar mayoría de edad y llevan las leyendas de ley.
  es_licor     BOOLEAN NOT NULL DEFAULT FALSE,
  visible      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE producto (
  id             BIGSERIAL PRIMARY KEY,
  slug           TEXT    NOT NULL UNIQUE,
  nombre         TEXT    NOT NULL,
  -- «Botella 750 ml», «Six pack · lata 330 ml».
  presentacion   TEXT,
  descripcion    TEXT,
  categoria_id   BIGINT  NOT NULL REFERENCES categoria (id),
  precio         INTEGER NOT NULL DEFAULT 0 CHECK (precio >= 0),
  -- El precio de antes, para mostrarlo tachado en una oferta.
  precio_antes   INTEGER CHECK (precio_antes > 0),
  -- NULL = no se lleva la cuenta (siempre disponible).
  stock          INTEGER CHECK (stock >= 0),
  foto_url       TEXT,
  -- Las «pastillas» de la página del producto: «29 % alcohol», «Hecho en Antioquia».
  grados         NUMERIC(4, 1) CHECK (grados >= 0 AND grados <= 100),
  origen         TEXT,
  publicado      BOOLEAN NOT NULL DEFAULT FALSE,
  destacado      BOOLEAN NOT NULL DEFAULT FALSE,
  orden          INTEGER NOT NULL DEFAULT 0,
  -- Para que dos personas editando a la vez no se pisen (bloqueo optimista).
  version        BIGINT  NOT NULL DEFAULT 0,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Nada sale a la tienda sin precio.
  CONSTRAINT producto_publicado_con_precio CHECK (NOT publicado OR precio > 0)
);

CREATE INDEX producto_categoria_idx ON producto (categoria_id);

-- «Va bien con…»: hasta tres productos sugeridos en la página de cada uno.
CREATE TABLE producto_relacionado (
  producto_id     BIGINT  NOT NULL REFERENCES producto (id) ON DELETE CASCADE,
  relacionado_id  BIGINT  NOT NULL REFERENCES producto (id) ON DELETE CASCADE,
  orden           INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (producto_id, relacionado_id),
  CHECK (producto_id <> relacionado_id)
);

-- Paquetes armados a un solo precio: «Combo novena».
CREATE TABLE combo (
  id             BIGSERIAL PRIMARY KEY,
  slug           TEXT    NOT NULL UNIQUE,
  nombre         TEXT    NOT NULL,
  descripcion    TEXT,
  precio         INTEGER NOT NULL DEFAULT 0 CHECK (precio >= 0),
  foto_url       TEXT,
  publicado      BOOLEAN NOT NULL DEFAULT FALSE,
  -- El que sale en el inicio como «Combo de la semana».
  de_la_semana   BOOLEAN NOT NULL DEFAULT FALSE,
  version        BIGINT  NOT NULL DEFAULT 0,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT combo_publicado_con_precio CHECK (NOT publicado OR precio > 0)
);

CREATE TABLE combo_item (
  combo_id     BIGINT  NOT NULL REFERENCES combo (id) ON DELETE CASCADE,
  -- No se puede borrar un producto que está en un combo: primero se saca del combo.
  producto_id  BIGINT  NOT NULL REFERENCES producto (id),
  cantidad     INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  PRIMARY KEY (combo_id, producto_id)
);

-- Los datos del negocio. Una sola fila.
CREATE TABLE tienda (
  id                   SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nombre               TEXT    NOT NULL,
  -- Solo dígitos, con el indicativo del país: 573147167595.
  whatsapp             TEXT    NOT NULL,
  direccion            TEXT    NOT NULL,
  barrio               TEXT,
  ciudad               TEXT    NOT NULL,
  abre                 TIME    NOT NULL,
  cierra               TIME    NOT NULL,
  nota_horario         TEXT,
  maps_url             TEXT,
  -- NULL = el valor del domicilio se confirma por WhatsApp.
  valor_domicilio      INTEGER CHECK (valor_domicilio >= 0),
  acepta_transferencia BOOLEAN NOT NULL DEFAULT TRUE,
  -- La temporada navideña: el banner del inicio.
  temporada            BOOLEAN NOT NULL DEFAULT FALSE,
  banner_titulo        TEXT,
  banner_texto         TEXT,
  banner_sello         TEXT,
  -- El código de la meta etiqueta de Google Search Console.
  google_verificacion  TEXT,
  version              BIGINT  NOT NULL DEFAULT 0,
  actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quién cambió qué y cuándo: precio, stock, publicado…
CREATE TABLE cambio_producto (
  id           BIGSERIAL PRIMARY KEY,
  producto_id  BIGINT NOT NULL REFERENCES producto (id) ON DELETE CASCADE,
  campo        TEXT   NOT NULL,
  antes        TEXT,
  despues      TEXT,
  -- «tienda» o «admin»: la clave con la que se entró en la página.
  quien        TEXT   NOT NULL,
  cuando       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cambio_producto_idx ON cambio_producto (producto_id, cuando DESC);
