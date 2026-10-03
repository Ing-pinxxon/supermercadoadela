# Supermercado Adela

Una tienda en línea para los clientes y la administración interna del negocio,
en el mismo enlace (`supermercadoadela.vercel.app`):

- **La tienda** (`/`, abierta a todos) — el catálogo para el celular: licores,
  cerveza, combos y lo de la novena, con precios, «últimas unidades» y
  «agotado». El cliente arma su pedido y lo manda por **WhatsApp**. Sale en
  Google (SEO, datos estructurados, mapa del sitio). Ver «La tienda en línea».
- **La administración** (`/admin`, con clave) — lo de siempre más el catálogo:


- **Caja** (`/caja`) — reemplaza la hoja "TIENDA". Abre en el día de hoy:
  registro rápido de pagos y entradas de plata, cierre del día, semana,
  tablero con gráficas y el archivo de la hoja vieja.
- **Fiados** (`/fiado`) — quién se llevó mercancía y todavía debe, con el saldo
  de cada persona y los abonos cuando pagan.
- **Tareas del día** (`/tareas`) — la rutina de lunes a domingo. Es
  independiente: tiene sus propias tablas y su propia navegación. La rutina se
  edita en `/tareas/rutina`: cada tarea se ve una sola vez con sus días, y
  cambiarla la cambia en todos ellos.

- **Catálogo** (`/admin/catalogo`) — productos, precios, stock, fotos, combos y
  categorías de la tienda; datos del negocio y la guía para salir en Google.

Next.js 15 (App Router) + PostgreSQL con SQL directo (`pg`) para la
administración. El catálogo vive en una **API aparte en Java (Spring Boot)**,
en la carpeta [`api/`](api/README.md), sobre la misma base de Neon.

```
Cliente (celular) ──► Next en Vercel ──(servidor a servidor)──► API Java en Render ──► Neon
                      · la tienda (en caché)                     · esquema «catalogo»
                      · /admin (con clave)
                      · fotos en Vercel Blob
```

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

## La tienda en línea: lo que hay que configurar

Además de lo de arriba, la tienda necesita tres cosas. Mientras falten, la
página principal dice «Estamos preparando la tienda en línea» y la
administración sigue funcionando igual.

1. **La API del catálogo en Render** (gratis). En https://render.com: **New →
   Blueprint** con este repositorio (usa `render.yaml`). En sus variables pon
   `DATABASE_URL` = la misma cadena de Neon que tiene Vercel, tal cual. Render
   genera `CATALOGO_API_KEY`: cópiala. Detalles en [`api/README.md`](api/README.md).
2. **Las variables en Vercel** (Settings → Environment Variables):
   - `CATALOGO_API_URL` = la dirección de Render, por ejemplo
     `https://adela-catalogo.onrender.com`.
   - `CATALOGO_API_KEY` = la misma clave de Render.
   - `SITIO_URL` (opcional) = la dirección pública, si algún día cambia de
     `https://supermercadoadela.vercel.app` (por ejemplo, con dominio propio).
3. **Las fotos**: en Vercel, **Storage → Create → Blob → Connect** al proyecto.
   Crea `BLOB_READ_WRITE_TOKEN` sola.

Después, **Redeploy** en Vercel. La API trae 38 productos de diciembre ocultos y
en $ 0: en `/admin/catalogo` se les pone precio, stock y foto, y se publican.

Render gratis se duerme a los 15 minutos sin uso y tarda ~50 s en despertar.
La tienda guarda en caché lo que lee (se refresca cada 5 minutos y al instante
cuando se edita algo), así que el cliente casi no lo nota; en la administración,
la primera edición después de un rato puede demorar y la pantalla dice
«Conectando con el catálogo…».

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
  tareas. **No ve** los totales de la semana, el tablero ni el archivo: esas
  pantallas ni siquiera le aparecen en el menú.
- `APP_PIN_ADMIN` — la del administrador. Ve todo, incluidas la semana, el
  tablero, el archivo, los datos de la tienda y `/instalar`.

Las dos editan el catálogo. La tienda (`/`, `/c/…`, `/p/…`) no pide clave. Al
entrar, la administración arranca en `/admin` (antes era `/`); quien ya entró
ve en la tienda un botón «← Administración» arriba a la izquierda.

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

## La tienda en línea

`/` es lo primero que ve cualquiera que abra el enlace. Diseño «tienda de
barrio»: papel crema, precios en etiqueta amarilla escritos a mano, rojo de
Navidad.

- **Inicio**: banner de temporada (se prende y apaga en Datos de la tienda),
  estantes por categoría, lo más pedido, el combo de la semana, ofertas, cada
  estante en una fila que se desliza, y «¿Pedido grande o para fiesta?».
- **Producto** (`/p/…`): foto, precio, «Va bien con…» y la barra para agregar.
- **Categoría** (`/c/…`): todo lo de un estante.
- **Pedido**: el carrito vive en el celular del cliente. Antes de mandarlo, la
  API lo revisa contra los precios y el stock de ese momento (avisa si algo
  cambió o se acabó) y arma el mensaje; se abre WhatsApp con el pedido escrito
  al número de la tienda. No se guardan pedidos: el stock se baja a mano.
- **Licores**: la primera vez que se agrega uno pregunta si es mayor de edad, y
  lleva las leyendas de ley (Ley 30 de 1986 y Ley 124 de 1994). No hay
  cigarrillos: la Ley 1335 de 2009 prohíbe promocionarlos.
- **Google**: títulos y descripciones con barrio y ciudad, datos estructurados
  de tienda y de producto (precio en pesos y disponibilidad), `sitemap.xml`,
  `robots.txt` (la administración no se indexa) e imagen para compartir. La
  guía para el Perfil de Negocio y Search Console está en `/admin/google`.

El cliente nunca ve el número de stock: «Últimas unidades» con 5 o menos,
«Agotado» en 0, y nada si no se lleva la cuenta.

### El catálogo en la administración

Con **cualquiera de las dos claves** (`/admin/catalogo`): la lista para usar
parado en la tienda (buscar, tocar el precio para cambiarlo, − y + para el
stock, el interruptor para mostrar u ocultar), la ficha de cada producto con la
foto desde el celular (se achica sola antes de subir), «Va bien con…» y el
historial de quién cambió qué; los combos y las categorías.

Solo el administrador: **Datos de la tienda** (WhatsApp, dirección, horario,
valor del domicilio, Nequi, banner de temporada, código de Search Console) y la
**guía de Google**.

## El tablero

`/caja/tablero` (menú **Tablero**, solo el administrador) muestra lo registrado
en la app desde el primer día que se usó — ese inicio no se escribe a mano, es
el primer día con algo anotado:

- Cuatro cifras: ingreso bruto desde que empezaste, promedio por semana, gastos
  y semanas registradas.
- **Ingreso y venta por semana**: ingreso bruto, venta en efectivo y, si hay,
  venta por transferencia.
- **En qué se va la plata**: los diez conceptos con más pagos (lo guardado en la
  caja no cuenta como gasto).
- **Qué día se vende más**: promedio de ingreso bruto por día de la semana,
  solo de días con la venta anotada.
- Al pie, una línea que compara con la hoja vieja: «la hoja de 2023 promediaba
  $X por semana; ahora vas en $Y». El promedio solo usa semanas de 5 días o más.

Usa la misma fórmula del día que el resto de la caja; las consultas están en
`src/lib/tablero.ts`.

## El archivo de la hoja

`/caja/historico` (menú **Archivo**) muestra las 26 semanas que venían de la
hoja (3 de septiembre de 2023 al 1 de marzo de 2024): ingreso por semana, qué
día vendía más y en qué se iba la plata. Va aparte de lo nuevo: lo registrado
en la app está en el tablero.

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
src/lib/historico.ts Consultas del archivo de la hoja (solo lectura).
src/lib/api-catalogo.ts  Cliente de la API Java del catálogo (solo servidor).
src/app/(tienda)/    La tienda en línea: inicio, /c/… y /p/….
src/app/admin/       La administración: inicio, catálogo, datos de la tienda, Google.
src/components/tienda/   Carrito, tarjetas, buscador, dibujos, datos para Google.
api/                 La API del catálogo en Java (Spring Boot). Ver api/README.md.
src/lib/tablero.ts   Lo registrado en la app, para el tablero.
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
npm run db:verificar   # aritmética de caja, tareas, tablero y archivo
npm run test:e2e       # formularios en un navegador (requiere npm start en :3100)
cd api && ./mvnw verify # la API en Java (necesita Docker)
```

**No las corras apuntando a la base del negocio**: `db:verificar` inserta y borra
registros de la semana del 2 de septiembre de 2026 y de la semana en curso, y
`test:e2e` usa días de septiembre de 2030. Si `CATALOGO_API_URL` apunta a una
API corriendo, `test:e2e` también prueba la tienda: crea «Aguardiente e2e»,
lo pide por WhatsApp (sin abrirlo de verdad) y lo deja agotado.

## Qué falta / siguientes pasos

- Fecha límite y aviso para los fiados que llevan mucho sin abonar.
- Exportar a Excel para el contador.
- Vista mensual, además de la semanal.
- Cuentas por persona, si se quiere saber quién registró cada cosa.
- Inventario. Es otro proyecto: implica códigos de barras y conteos.
