# Supermercado Adela

Tres herramientas en un mismo proyecto:

- **Caja** (`/caja`) — reemplaza la hoja "TIENDA". Abre en el día de hoy:
  registro rápido de pagos y entradas de plata, cierre del día, semana e
  histórico.
- **Fiados** (`/fiado`) — quién se llevó mercancía y todavía debe, con el saldo
  de cada persona y los abonos cuando pagan.
- **Tareas del día** (`/tareas`) — la rutina de lunes a domingo. Es
  independiente: tiene sus propias tablas y su propia navegación. La rutina se
  edita en `/tareas/rutina`: cada tarea se ve una sola vez con sus días, y
  cambiarla la cambia en todos ellos.

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

**La caja de la semana** es la plata guardada:

```
caja = con cuánto arrancó la semana
     + la venta en efectivo de los días que ya terminaron
     + lo que se metió a la caja
     − lo que se sacó de la caja
```

**Los pagos no le restan.** Al cerrar el día se anota en «venta en efectivo» lo
que quedó contado en el cajón, y esa plata ya tiene los pagos descontados:
restarlos otra vez los contaría dos veces. Un día cuenta como terminado cuando
se marca cerrado o cuando ya pasó.

Cada lunes hay que decir con cuánto arranca la semana. Mientras no se diga, la
app **no muestra ningún saldo** — avisa que falta, y ofrece el cierre de la
semana anterior. El saldo lo ve solo el administrador; los botones de meter y
sacar los usa cualquiera.

Tres cosas que conviene tener claras, porque deciden dónde entra cada peso:

- **Una transferencia cuenta igual que el efectivo.** Un pago a proveedor hecho
  por Nequi entra en las salidas y suma al ingreso bruto como cualquier otro. El
  medio queda anotado para saber después por dónde se movió la plata, pero no
  cambia la cuenta.
- **La venta por transferencia va aparte.** El ingreso bruto sigue siendo la
  fórmula de arriba, que es de caja. Al lado aparece «todo lo que se vendió»,
  que es el bruto más esa venta.
- **Sacar de la caja no es un gasto.** Es decir de dónde salió la plata: para
  el día cuenta como una entrada (por eso esos pesos no cuentan como venta de
  hoy) y para la caja es lo que la baja. El pago se registra aparte.
- **Después de guardar hay que refrescar la pantalla a mano, desde el código.**
  Con un `<form action={…}>` normal, la acción guardaba bien pero la vista se
  quedaba mostrando lo de antes — y en la tienda eso lleva a tocar dos veces y
  desmarcar lo que se acababa de marcar. Por eso los formularios que guardan
  usan `src/components/form-accion.tsx` (o llaman `router.refresh()`), y no
  `<form>` pelado.
- **Fiar no mueve la caja; abonar sí.** Cuando alguien se lleva algo fiado solo
  nace la deuda. Cuando abona, esa plata entra al cajón sin ser venta del día,
  así que se registra como una entrada — el mismo papel que «Prestados ayer».
  Por eso cada abono crea su movimiento de caja, y borrar uno borra el otro.

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
   del negocio y `APP_PIN_ADMIN` con la del administrador.
4. **Deployments → Redeploy.** Las variables solo entran en un despliegue nuevo:
   si conectaste la base después de desplegar, este paso es obligatorio.
5. Abre `https://tu-app.vercel.app/instalar`, entra con la clave y dale a
   **Crear tablas y rutina**. Si quieres las 26 semanas de la hoja vieja,
   dale también a **Cargar histórico**.

La app no lee ninguna variable en el build: si algo falla, falla en `/instalar`,
que dice exactamente qué es.

**Cada vez que se despliega una versión nueva**, conviene abrir `/instalar`
(con la clave de administrador) y, si dice «la base está desactualizada», darle
a **Actualizar la base**: agrega lo nuevo sin tocar lo que ya hay.

### Si algo sale mal

Todo se diagnostica en `/instalar`, que muestra qué variable se está usando,
contra qué servidor habla, qué tablas hay y cuántas filas tiene cada cosa.

- **«No hay ninguna variable de conexión»** → la base no está conectada al
  proyecto, o se conectó después del último despliegue. Conecta y **Redeploy**.
- **«La base rechazó el usuario o la clave»** → vuelve a copiar la cadena desde
  Neon (*Connection string*, la versión **pooled**).
- **«Esa pantalla es del administrador»** al abrir `/instalar` → la sesión
  guardada es la de la tienda. Escribe la clave de administrador ahí mismo y
  vuelve a donde ibas. Desde la pantalla de error, «Entrar con otra clave» hace
  lo mismo.
- **«La base está desactualizada»** → dale a **Actualizar la base**. Pasa
  después de desplegar una versión que trae columnas o tablas nuevas.
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
   - `APP_PIN` = la clave del negocio, `APP_PIN_ADMIN` = la del administrador.
4. Railway detecta Next.js solo. Build: `npm run build`, start: `npm start`.
5. Una sola vez, para crear las tablas: `railway run npm run db:setup` (o abre
   `/instalar` en la app y dale al botón).

## Las dos claves

- `APP_PIN` — la de la tienda. Registra pagos, fía, recibe abonos y marca
  tareas. **No ve** los totales de la semana ni el histórico: esas pantallas ni
  siquiera le aparecen en el menú.
- `APP_PIN_ADMIN` — la del administrador. Ve todo, incluidas la semana, el
  histórico y `/instalar`.

Son claves compartidas del negocio, no cuentas por persona (cookie de un mes).
La clave con la que se entra decide lo que se ve; arriba a la derecha dice si
se entró como «Tienda» o como «Admin», y ahí mismo se sale.

Si no hay `APP_PIN`, la app queda abierta y todo el mundo ve todo: es el modo
de trabajar en local. Si hay `APP_PIN` pero no `APP_PIN_ADMIN`, quien entra con
la clave de la tienda es administrador — sin eso nadie podría llegar a
`/instalar`.

Los fiados los ve y los registra todo el mundo, con el total incluido.

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

**Al cerrar**: se anota la venta en efectivo y, aparte, la que entró por
transferencia. El ingreso bruto se calcula solo y queda al final de la pantalla,
debajo de todo lo que se registró.

**Cuando se paga con plata de días anteriores**: en la pantalla del día,
escribes el monto y le das a «Saqué de la caja». Eso no registra el gasto —el
pago se anota aparte con «Pagué», como siempre—; solo dice de dónde salió la
plata, para que no cuente como venta de hoy y para descontarla de la caja.

**Cuando alguien fía**: en `/fiado` se busca o se crea la persona y se anota lo
que se llevó. Cuando abona, el botón «Abonó» — eso baja su saldo y entra a la
caja del día solo. El nombre se agrupa igual que los proveedores: «Doña Rosa» y
«dona rosa» son la misma persona.

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
src/app/fiado/       Los fiados: lista de deudores y ficha de cada uno.
src/app/instalar/    Pantalla de estado de la base, protegida por la clave.
src/lib/db.ts        Pool de conexiones y helpers de consulta.
src/lib/fechas.ts    Fechas como texto "YYYY-MM-DD". Lee el comentario de arriba.
src/lib/caja.ts      TODA la aritmética de caja vive aquí.
src/lib/fiados.ts    Saldos y movimientos de los fiados.
                     (la caja de la semana está en caja.ts, con lo demás)
src/lib/sesion.ts    Las dos claves y qué puede ver cada una.
src/lib/historico.ts Consultas del archivo y la comparación con el año actual.
src/lib/tareas.ts    Consultas del módulo de tareas.
src/components/      UI, registro rápido, navegación y gráficas (SVG).
```

Cinco decisiones que conviene no romper:

- **Los botones de navegación avisan que están cargando.** Todas las pantallas
  son `force-dynamic`: cada toque es un viaje al servidor. Sin ese aviso
  (`useLinkStatus`, en `src/components/nav.tsx`) la pantalla no cambia en nada
  mientras responde la base y el botón parece roto.
- **Una tarea repetida son varias filas, unidas por `grupo_id`.** Cada día de
  la semana tiene su fila en `tarea_plantilla` con su propio historial en
  `tarea_hecha`; `grupo_id` es lo que las vuelve «una tarea» para editarlas
  juntas. Al sacar un día, la fila se borra si nunca se marcó y se desactiva si
  tiene historial — así nada de lo que ya se hizo se pierde.
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
- **Todo el color sale de los tokens de `src/app/globals.css`.** Las pantallas
  dicen `bg-superficie` o `text-tinta`, nunca un color a mano: cambiar de tema
  es cambiar ese archivo. Las letras (Fraunces para títulos y cifras, Cabin
  para el resto) se empaquetan al construir con `next/font`; el celular no
  depende de internet para verlas.
- **Los colores de las gráficas están validados para daltonismo.** Si los
  cambias, revisa que el par siga siendo distinguible sobre el verde.

## Pruebas

```bash
npm run db:verificar   # aritmética de caja, tareas e histórico
npm run test:e2e       # formularios en un navegador (requiere npm start en :3100)
```

**No las corras apuntando a la base del negocio**: `db:verificar` inserta y borra
registros de la semana del 2 de septiembre de 2026.

## Qué falta / siguientes pasos

- Fecha límite y aviso para los fiados que llevan mucho sin abonar.
- Exportar a Excel para el contador.
- Vista mensual, además de la semanal.
- Cuentas por persona, si se quiere saber quién registró cada cosa.
- Inventario. Es otro proyecto: implica códigos de barras y conteos.
