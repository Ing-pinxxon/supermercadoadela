# API del catálogo (Java + Spring Boot)

La tienda en línea de Supermercado Adela le pide aquí los productos, los combos
y los datos del negocio, y le manda el carrito para armar el pedido de WhatsApp.
La página (Next.js en Vercel) es la que ve el cliente; esta API es la que sabe
las reglas.

```
Cliente (celular) ──► Next en Vercel ──(servidor a servidor)──► esta API en Render ──► Neon
```

Java 21 · Spring Boot 3.5 · Maven · PostgreSQL (Neon) · Flyway · JPA/Hibernate ·
Spring Security · springdoc (Swagger) · JUnit 5 + Testcontainers.

## Correrla en tu computador

Necesitas Java 21 y un Postgres. Maven no hace falta: viene `./mvnw`.

```bash
cd api
# Contra un Postgres local (por defecto: 127.0.0.1:5433/adela, usuario postgres)
CATALOGO_API_KEY=una-clave ./mvnw spring-boot:run

# O contra Neon, pegando la misma cadena que usa la app de Next
DATABASE_URL='postgresql://usuario:clave@ep-xxx.neon.tech/neondb?sslmode=require' \
CATALOGO_API_KEY=una-clave ./mvnw spring-boot:run
```

Al arrancar, Flyway crea el esquema `catalogo` y carga la semilla: 11 categorías,
38 productos de diciembre (ocultos y en $ 0), un combo y los datos de la tienda.

- Swagger (para probar todo desde el navegador): http://localhost:8080/swagger-ui.html
- Salud: http://localhost:8080/actuator/health

## Pruebas

```bash
./mvnw verify
```

Corre las pruebas de unidad (reglas, mensaje de WhatsApp, conversión de la
cadena de Neon) y las de integración, que levantan un Postgres de verdad en
Docker con Testcontainers. Necesitas Docker abierto.

## Cómo está organizada

Por función, no por capa: todo lo de los productos está junto.

| Paquete | Qué hace |
|---|---|
| `comun` | Lo que usan todos: `Disponibilidad`, `Slugs`, `Pesos`, los errores y cómo salen en JSON (`ManejoDeErrores`), y `UrlDeNeon`. |
| `seguridad` | La API key: `FiltroApiKey` la revisa y `SeguridadConfig` dice qué rutas la piden. |
| `categoria`, `producto`, `combo`, `tienda` | Cada uno con su entidad JPA, su repositorio (Spring Data), su servicio (las reglas) y su controlador de administración. |
| `publico` | Lo que ve el cliente: solo lo publicado, sin stock exacto. |
| `pedido` | Revisa el carrito contra la base y arma el mensaje y el enlace de WhatsApp. |

Cada pedido HTTP pasa por las mismas capas:

1. **Controlador** (`@RestController`): recibe el JSON, lo valida con `@Valid` y
   llama al servicio. No decide nada.
2. **Servicio** (`@Service`, `@Transactional`): las reglas del negocio. Si algo no
   se puede, lanza `ReglaDeNegocio`, `Conflicto` o `NoEncontrado`.
3. **Repositorio** (`JpaRepository`): Spring Data arma las consultas a partir del
   nombre del método o de la `@Query`.
4. **Entidad** (`@Entity`): una fila de la tabla. Las tablas no las crea
   Hibernate (`ddl-auto: validate`); las crea Flyway desde `db/migration`.

Lo que sale hacia afuera nunca es la entidad: son `record`s (`ProductoAdmin`,
`ProductoVista`…), para controlar exactamente qué se muestra. Por ejemplo, el
cliente nunca ve el número de stock, solo `DISPONIBLE`, `ULTIMAS` o `AGOTADO`.

## Las reglas que vale la pena leer

- `Disponibilidad.de(stock)`: null = no se lleva cuenta; 0 = agotado; 1 a 5 =
  últimas unidades.
- `ProductoServicio.validar`: no se publica sin precio; el precio de antes
  (oferta) tiene que ser mayor que el de ahora.
- `ComboServicio.validar`: un combo publicado necesita precio, todos sus
  productos publicados, y no puede costar más que comprarlos por separado.
- `PedidoServicio`: si piden más de lo que hay, deja lo que hay y avisa; si el
  precio cambió desde que el cliente lo vio, avisa; lo oculto o agotado se quita.
- Bloqueo optimista (`@Version`): si dos personas editan el mismo producto, la
  segunda recibe un 409 en vez de pisar el cambio de la primera.
- Historial: cada cambio de precio, stock, publicado o categoría queda en
  `cambio_producto` con quién lo hizo («tienda» o «admin»).

## Rutas

Públicas (sin clave):

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/api/v1/catalogo` | Todo lo publicado por estante, más los combos |
| GET | `/api/v1/categorias/{slug}` | Un estante |
| GET | `/api/v1/productos/{slug}` | Un producto con su «Va bien con…» |
| GET | `/api/v1/productos?ids=1,2` | Refrescar el carrito |
| GET | `/api/v1/tienda` | WhatsApp, dirección, horario, temporada |
| POST | `/api/v1/pedidos/revisar` | Revisar el carrito con precios y stock de ahora |
| POST | `/api/v1/pedidos/whatsapp` | Armar el mensaje y el enlace de WhatsApp |

Con la cabecera `X-Api-Key` (y `X-Usuario: tienda|admin` para el historial),
todo bajo `/api/v1/admin/`: CRUD de `productos`, `categorias` y `combos`;
`PATCH productos/{id}/stock|precio|publicado|foto`; `PUT productos/{id}/relacionados`;
`GET productos/{id}/historial`; `PUT tienda`. Los errores salen siempre como
Problem Details (RFC 7807) en español, listos para mostrar.

## Desplegar en Render (gratis)

1. En https://render.com: **New → Blueprint** y elige este repositorio. Render
   lee `render.yaml` (en la raíz) y crea el servicio `adela-catalogo`.
2. En las variables del servicio:
   - `DATABASE_URL`: la cadena de Neon, la misma que tiene Vercel. Se pega tal
     cual (`postgresql://…`); la API la convierte sola y usa el host directo,
     no el `-pooler`.
   - `CATALOGO_API_KEY`: Render la genera sola. Cópiala: la misma va en Vercel.
3. Cuando diga *Live*, abre `https://adela-catalogo.onrender.com/actuator/health`:
   tiene que decir `UP`.

El plan gratis se duerme a los 15 minutos sin uso y tarda unos 50 segundos en
despertar. La tienda guarda en caché lo que lee de aquí, así que los clientes
casi no lo notan; en la administración la primera edición del día puede demorar.

La región está en Ohio (`render.yaml`), cerca de la mayoría de bases de Neon en
Estados Unidos. Si tu base de Neon está en otra región, cambia `region` para que
queden cerca.
