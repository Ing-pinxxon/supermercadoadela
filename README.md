# Supermercado Adela

Dos herramientas en un mismo proyecto:

- **Caja** (`/caja`) — reemplaza la hoja "TIENDA". Registro rápido de pagos y
  entradas de plata, cierre del día, semana e histórico.
- **Tareas del día** (`/tareas`) — la rutina de lunes a domingo. Es
  independiente: tiene sus propias tablas y su propia navegación.

Next.js 15 (App Router) + PostgreSQL con SQL directo (`pg`). Sin ORM, sin paso
de generación de código: lo que ves en `db/schema.sql` es lo que hay en la base.

## La fórmula

Es la misma de la hoja:

```
ingreso bruto del día = venta en efectivo + salidas − entradas
```

- **Salidas**: todo lo que sale de la caja — proveedores, mercado, trabajador,
  servicios. Un monto negativo es una devolución o nota crédito.
- **Entradas**: plata que entra sin ser venta del día — prestados de ayer, venta
  de ayer que se sumó, aportes.
- **Venta en efectivo**: lo que se contó de venta al cerrar.

Toda la aritmética vive en `src/lib/caja.ts`. Ninguna pantalla calcula plata por
su cuenta.

## Arrancar en local

```bash
cp .env.example .env      # y llena DATABASE_URL
npm install
npm run db:setup          # crea tablas y carga la rutina de tareas de ejemplo
npm run dev               # http://localhost:3000
```

`db:setup` se puede correr las veces que sea: no borra ni duplica nada. Lo
mismo se puede hacer desde el navegador en `/instalar`, sin consola.

## Desplegar en Vercel con Neon

1. Sube el repo a GitHub y en Vercel haz **Add New → Project → Import**.
2. En el proyecto, pestaña **Storage → Create Database → Neon** (o *Connect*
   una que ya tengas). Neon queda conectada y Vercel escribe las variables de
   conexión solas.
3. Pestaña **Settings → Environment Variables**: agrega `APP_PIN` con la clave
   del negocio.
4. **Deployments → Redeploy.** Las variables solo entran en un despliegue nuevo:
   si conectaste la base después de desplegar, este paso es obligatorio.
5. Abre `https://tu-app.vercel.app/instalar`, entra con la clave y dale a
   **Crear tablas y rutina**. Si quieres las 26 semanas de la hoja vieja,
   dale también a **Cargar histórico**.

La app no lee ninguna variable en el build: si algo falla, falla en `/instalar`,
que dice exactamente qué es.

### Si algo sale mal

Todo se diagnostica en `/instalar`, que muestra qué variable se está usando,
contra qué servidor habla, qué tablas hay y cuántas filas tiene cada cosa.

- **«No hay ninguna variable de conexión»** → la base no está conectada al
  proyecto, o se conectó después del último despliegue. Conecta y **Redeploy**.
- **«La base rechazó el usuario o la clave»** → vuelve a copiar la cadena desde
  Neon (*Connection string*, la versión **pooled**).
- **Faltan tablas** → dale a **Crear tablas y rutina**. Es la causa más común
  del error al abrir `/caja` o `/tareas` recién desplegado: la conexión está
  bien, pero la base está vacía.
- **La base tarda en responder la primera vez** → los proyectos gratis de Neon
  se duermen. Vuelve a cargar la página.

Se aceptan tanto `DATABASE_URL` como los nombres que crea la integración de
Neon (`POSTGRES_URL`, `DATABASE_URL_UNPOOLED`, …); `/instalar` dice cuál tomó.

## Desplegar en Railway

1. Sube el repo a GitHub y en Railway haz **New Project → Deploy from GitHub**.
2. En el mismo proyecto, **New → Database → PostgreSQL**.
3. En el servicio de la app, pestaña **Variables**:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `APP_PIN` = la clave del negocio.
4. Railway detecta Next.js solo. Build: `npm run build`, start: `npm start`.
5. Una sola vez, para crear las tablas: `railway run npm run db:setup` (o abre
   `/instalar` en la app y dale al botón).

La app queda detrás de una clave única compartida (`APP_PIN`, cookie de un mes).
No son cuentas por persona: es para que la URL no quede abierta a internet.

## El día a día

**Cada vez que se paga algo**: escribes a quién y cuánto, y le das a «Pagué».
Eso es todo — no hay que elegir categoría ni proveedor de una lista. Los botones
grises de arriba son los conceptos que sueles pagar ese día de la semana,
calculados a partir de lo ya registrado; no hay lista de proveedores que
mantener. El campo también autocompleta con todo lo que hayas usado antes.

Las variantes de escritura se agrupan solas para los totales: «Mac pollo»,
«Macpollo» y «Mac Pollo» cuentan como el mismo proveedor.

**Cuando entra plata que no es venta** (prestados de ayer, un aporte): lo mismo,
pero con «Entró plata».

**Al cerrar**: se anota la venta en efectivo. El ingreso bruto se calcula solo y
queda arriba de la pantalla.

**En la semana** (`/caja`): la misma tabla de la hoja — cada día con sus salidas,
entradas, venta e ingreso, más los totales. Abajo, en qué se fue la plata esa
semana y el conteo de efectivo comparado con la semana anterior.

## El histórico

`/caja/historico` muestra las 26 semanas que venían de la hoja (3 de septiembre
de 2023 al 1 de marzo de 2024): ingreso por semana, qué día vendía más y en qué
se iba la plata. Cuando registres semanas completas en la app, aparece la
comparación contra ese promedio.

El archivo es **de solo lectura** y vive en sus propias tablas
(`historico_dia`, `historico_detalle`), separado de lo que registres desde
ahora. Nada de lo que hagas en la app lo modifica.

Dos cosas honestas sobre esos datos:

- **El año es una deducción.** La hoja solo trae fechas en el primer bloque
  ("Semana del: septiembre 3", con el 3 de septiembre en domingo). El 3 de
  septiembre cayó domingo en 2023, así que ese es el ancla. Si el año está mal,
  se cambia una línea: `ANCLA` en `import/parser.mjs`, y se vuelve a importar.
- **En 19 de 170 días el detalle no suma el total.** Así estaba en la hoja: el
  "Total Gastos" escrito a mano no coincidía con la lista de arriba. Los totales
  y las gráficas usan los números de la hoja, que son los que usaste en su
  momento; el detalle por concepto sirve para ver tendencias, no para cuadrar.

Para volver a importar: el botón **Cargar histórico** de `/instalar`, o desde
la consola:

```bash
node import/importar.mjs             # simulación, no escribe
node import/importar.mjs --escribir
```

## Estructura

```
src/lib/esquema.ts   Las tablas. Fuente de verdad del modelo de datos.
src/lib/rutina.ts    La rutina semanal con la que arranca el módulo de tareas.
src/lib/instalacion.ts  Diagnóstico y puesta en marcha de la base (/instalar).
db/setup.ts          Crea tablas + rutina de tareas (npm run db:setup).
db/verificar.ts      Prueba de la aritmética contra una base real.
e2e.mjs              Prueba de navegador de los formularios.
import/parser.mjs    Lee la hoja de cálculo. El ANCLA de fechas está acá.
import/importar.mjs  Carga el archivo histórico en la base (versión de consola).
import/hoja.json     La exportación de la hoja "TIENDA".
src/app/instalar/    Pantalla de estado de la base, protegida por la clave.
src/lib/db.ts        Pool de conexiones y helpers de consulta.
src/lib/fechas.ts    Fechas como texto "YYYY-MM-DD". Lee el comentario de arriba.
src/lib/caja.ts      TODA la aritmética de caja vive aquí.
src/lib/historico.ts Consultas del archivo y la comparación con el año actual.
src/lib/tareas.ts    Consultas del módulo de tareas.
src/components/      UI, registro rápido y gráficas (SVG, sin librerías).
```

Tres decisiones que conviene no romper:

- **Los montos son enteros en pesos.** El peso no usa centavos, así que no hay
  decimales ni redondeos en ninguna parte.
- **El esquema vive en `src/lib/esquema.ts`, no en un `.sql` suelto.** Vercel
  solo despliega los archivos que el código importa, y así la pantalla
  `/instalar` puede crear las tablas sin consola.
- **Las fechas son strings `YYYY-MM-DD`, nunca `Date`.** El servidor corre en
  UTC y Bogotá es UTC−5: si se usa `new Date()` para calcular "hoy", entre las
  7 p.m. y la medianoche la app registra el día siguiente. `src/lib/fechas.ts`
  es el único lugar que toca fechas, y `src/lib/db.ts` le dice a Postgres que
  devuelva las columnas `DATE` tal cual, sin convertirlas.
- **Los colores de las gráficas están validados para daltonismo.** Si los
  cambias, revisa que el par siga siendo distinguible.

## Pruebas

```bash
npm run db:verificar   # aritmética de caja, tareas e histórico
npm run test:e2e       # formularios en un navegador (requiere npm start en :3100)
```

**No las corras apuntando a la base del negocio**: `db:verificar` inserta y borra
registros de la semana del 2 de septiembre de 2026.

## Qué falta / siguientes pasos

- Exportar a Excel para el contador.
- Vista mensual, además de la semanal.
- Cuentas por persona, si se quiere saber quién registró cada cosa.
- Inventario. Es otro proyecto: implica códigos de barras y conteos.
