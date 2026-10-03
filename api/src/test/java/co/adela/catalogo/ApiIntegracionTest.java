package co.adela.catalogo;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.adela.catalogo.categoria.CategoriaRepositorio;
import co.adela.catalogo.producto.ProductoRepositorio;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * La API entera contra un Postgres de verdad (en Docker, con Testcontainers):
 * corren las migraciones con la semilla, y cada prueba habla HTTP con MockMvc.
 *
 * <p>Cada prueba corre en una transacción que se deshace al final, así que
 * todas arrancan con la base recién sembrada: los 38 productos ocultos.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
@Transactional
class ApiIntegracionTest {

  @Container
  @ServiceConnection
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

  private static final String CLAVE = "clave-de-prueba";

  @Autowired MockMvc mvc;
  @Autowired ProductoRepositorio productos;
  @Autowired CategoriaRepositorio categorias;

  // --- Ayudas -------------------------------------------------------------

  private ResultActions admin(MockHttpServletRequestBuilder req, String json) throws Exception {
    req.header("X-Api-Key", CLAVE).header("X-Usuario", "tienda");
    if (json != null) req.contentType(MediaType.APPLICATION_JSON).content(json);
    return mvc.perform(req);
  }

  private ResultActions publico(MockHttpServletRequestBuilder req, String json) throws Exception {
    if (json != null) req.contentType(MediaType.APPLICATION_JSON).content(json);
    return mvc.perform(req);
  }

  private long id(String slug) {
    return productos.porSlug(slug).orElseThrow().getId();
  }

  /** Le pone precio y stock a un producto de la semilla y lo publica. */
  private long publicar(String slug, int precio, Integer stock) throws Exception {
    long id = id(slug);
    admin(patch("/api/v1/admin/productos/{id}/precio", id), "{\"precio\": " + precio + "}").andExpect(status().isOk());
    admin(patch("/api/v1/admin/productos/{id}/stock", id),
        stock == null ? "{\"sinControl\": true}" : "{\"valor\": " + stock + "}").andExpect(status().isOk());
    admin(patch("/api/v1/admin/productos/{id}/publicado", id), "{\"publicado\": true}").andExpect(status().isOk());
    return id;
  }

  // --- Semilla y seguridad --------------------------------------------------

  @Test
  void laSemillaTraeLaTiendaYTodoOculto() throws Exception {
    publico(get("/api/v1/tienda"), null)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.whatsapp").value("573147167595"))
        .andExpect(jsonPath("$.abre").value("07:00"))
        .andExpect(jsonPath("$.temporada").value(true));
    publico(get("/api/v1/catalogo"), null)
        .andExpect(jsonPath("$.categorias", hasSize(0)))
        .andExpect(jsonPath("$.combos", hasSize(0)));
    admin(get("/api/v1/admin/productos"), null).andExpect(jsonPath("$", hasSize(38)));
  }

  @Test
  void sinLaClaveNoSePuedeEscribir() throws Exception {
    publico(get("/api/v1/admin/productos"), null).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/admin/productos").header("X-Api-Key", "otra"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.title").value("Sin permiso"));
    publico(patch("/api/v1/admin/productos/1/precio"), "{\"precio\": 1}").andExpect(status().isUnauthorized());
  }

  // --- Reglas del catálogo --------------------------------------------------

  @Test
  void noSePublicaSinPrecio() throws Exception {
    admin(patch("/api/v1/admin/productos/{id}/publicado", id("sabajon-750")), "{\"publicado\": true}")
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.detail").value("Ponle precio a «Sabajón» antes de publicarlo."));
  }

  @Test
  void lasOfertasNecesitanUnPrecioDeAntesMayor() throws Exception {
    admin(patch("/api/v1/admin/productos/{id}/precio", id("sabajon-750")), "{\"precio\": 30000, \"precioAntes\": 28000}")
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.detail", containsString("tiene que ser mayor")));
  }

  @Test
  void loPublicadoSaleYLoOcultoNo() throws Exception {
    publicar("sabajon-750", 28000, 3);
    publico(get("/api/v1/catalogo"), null)
        .andExpect(jsonPath("$.categorias", hasSize(1)))
        .andExpect(jsonPath("$.categorias[0].slug").value("otros-licores"))
        .andExpect(jsonPath("$.categorias[0].productos[0].disponibilidad").value("ULTIMAS"))
        // El cliente nunca ve el número exacto.
        .andExpect(jsonPath("$.categorias[0].productos[0].stock").doesNotExist());
    publico(get("/api/v1/productos/sabajon-750"), null).andExpect(status().isOk());
    publico(get("/api/v1/productos/sabajon-750"), null).andExpect(jsonPath("$.producto.esLicor").value(true));

    // Si se oculta el estante, el producto deja de existir para el cliente.
    categorias.findBySlug("otros-licores").orElseThrow().setVisible(false);
    publico(get("/api/v1/productos/sabajon-750"), null).andExpect(status().isNotFound());
    publico(get("/api/v1/productos/hielo-2-kg"), null).andExpect(status().isNotFound());
  }

  @Test
  void elStockNoQuedaNegativoYSeAnotaEnElHistorial() throws Exception {
    long id = publicar("hielo-2-kg", 4000, 2);
    admin(patch("/api/v1/admin/productos/{id}/stock", id), "{\"delta\": -1}")
        .andExpect(jsonPath("$.stock").value(1));
    admin(patch("/api/v1/admin/productos/{id}/stock", id), "{\"delta\": -5}")
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.detail").value("No hay tantas unidades para restar: quedan 1."));
    admin(get("/api/v1/admin/productos/{id}/historial", id), null)
        .andExpect(jsonPath("$[0].campo").value("stock"))
        .andExpect(jsonPath("$[0].antes").value("2"))
        .andExpect(jsonPath("$[0].despues").value("1"))
        .andExpect(jsonPath("$[0].quien").value("tienda"));
  }

  @Test
  void dosEdicionesALaVezNoSePisan() throws Exception {
    long id = id("sabajon-750");
    String cuerpo = """
        {"nombre": "Sabajón", "presentacion": "Botella 750 ml", "categoriaId": %d, "precio": 28000,
         "publicado": false, "destacado": false, "version": 999}
        """.formatted(productos.porSlug("sabajon-750").orElseThrow().getCategoria().getId());
    admin(put("/api/v1/admin/productos/{id}", id), cuerpo)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail", containsString("mientras lo editabas")));
  }

  @Test
  void losErroresDeValidacionVienenPorCampo() throws Exception {
    admin(post("/api/v1/admin/productos"), "{\"nombre\": \"\", \"precio\": -1}")
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errores.nombre").value("Escribe el nombre del producto."))
        .andExpect(jsonPath("$.errores.precio").value("El precio no puede ser negativo."))
        .andExpect(jsonPath("$.errores.categoriaId").value("Elige la categoría."));
  }

  @Test
  void crearUnProductoLeDaUnSlugUnico() throws Exception {
    long cat = categorias.findBySlug("navidad").orElseThrow().getId();
    String cuerpo = "{\"nombre\": \"Natilla\", \"presentacion\": \"Caja de mezcla\", \"categoriaId\": " + cat + "}";
    admin(post("/api/v1/admin/productos"), cuerpo)
        .andExpect(status().isCreated())
        // «natilla-caja-de-mezcla» está libre; el de la semilla se llama «natilla-mezcla».
        .andExpect(jsonPath("$.slug").value("natilla-caja-de-mezcla"));
    admin(post("/api/v1/admin/productos"), cuerpo)
        .andExpect(jsonPath("$.slug").value("natilla-caja-de-mezcla-2"));
  }

  @Test
  void noSeBorraUnaCategoriaConProductos() throws Exception {
    long cat = categorias.findBySlug("hielo").orElseThrow().getId();
    admin(delete("/api/v1/admin/categorias/{id}", cat), null)
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail", containsString("tiene 2 producto(s)")));
  }

  // --- Combos ---------------------------------------------------------------

  @Test
  void unComboSoloSePublicaConSusProductosPublicados() throws Exception {
    long combo = 1;
    String cuerpo = """
        {"nombre": "Combo novena", "precio": 58000, "publicado": true, "deLaSemana": true,
         "items": [{"productoId": %d, "cantidad": 1}, {"productoId": %d, "cantidad": 2}]}
        """.formatted(id("aguardiente-antioqueno-sin-azucar-750"), id("hielo-2-kg"));
    admin(put("/api/v1/admin/combos/{id}", combo), cuerpo)
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.detail", containsString("está oculto")));

    publicar("aguardiente-antioqueno-sin-azucar-750", 52000, null);
    publicar("hielo-2-kg", 4000, 3); // alcanza para un solo combo (2 bolsas cada uno)
    // Por separado sale en $ 60.000: un combo más caro no tiene sentido.
    admin(put("/api/v1/admin/combos/{id}", combo), cuerpo.replace("58000", "61000"))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.detail", containsString("más caro que comprar todo por separado")));
    admin(put("/api/v1/admin/combos/{id}", combo), cuerpo).andExpect(status().isOk());

    publico(get("/api/v1/catalogo"), null)
        .andExpect(jsonPath("$.combos[0].nombre").value("Combo novena"))
        .andExpect(jsonPath("$.combos[0].precioPorSeparado").value(60000))
        .andExpect(jsonPath("$.combos[0].disponibilidad").value("ULTIMAS"))
        .andExpect(jsonPath("$.combos[0].esLicor").value(true));
  }

  // --- Pedido por WhatsApp --------------------------------------------------

  @Test
  void elPedidoUsaLosPreciosRealesYElStock() throws Exception {
    long agua = publicar("aguardiente-antioqueno-sin-azucar-750", 52000, 2);
    long hielo = publicar("hielo-2-kg", 4000, null);
    long oculto = id("sabajon-750");
    String pedido = """
        {"lineas": [
           {"tipo": "PRODUCTO", "id": %d, "cantidad": 5, "precioVisto": 50000},
           {"tipo": "PRODUCTO", "id": %d, "cantidad": 2, "precioVisto": 4000},
           {"tipo": "PRODUCTO", "id": %d, "cantidad": 1}],
         "datos": {"entrega": "DOMICILIO", "nombre": "Laura", "direccion": "Calle 26 Sur #4-10", "pago": "EFECTIVO"}}
        """.formatted(agua, hielo, oculto);
    publico(post("/api/v1/pedidos/whatsapp"), pedido)
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.lineas", hasSize(2)))
        .andExpect(jsonPath("$.lineas[0].cantidad").value(2))
        .andExpect(jsonPath("$.total").value(2 * 52000 + 2 * 4000))
        .andExpect(jsonPath("$.avisos", hasItem("De «Aguardiente Antioqueño sin azúcar» solo nos quedan 2: te dejamos esas.")))
        .andExpect(jsonPath("$.avisos", hasItem("«Aguardiente Antioqueño sin azúcar» ahora cuesta $ 52.000.")))
        .andExpect(jsonPath("$.avisos", hasItem("Un producto que tenías ya no está en la tienda y se quitó del pedido.")))
        .andExpect(jsonPath("$.mensaje", containsString("• 2 × Hielo (Bolsa 2 kg) — $ 8.000")))
        .andExpect(jsonPath("$.enlace", containsString("https://wa.me/573147167595?text=")));
  }

  @Test
  void elDomicilioPideDireccion() throws Exception {
    long hielo = publicar("hielo-2-kg", 4000, null);
    publico(post("/api/v1/pedidos/whatsapp"), """
        {"lineas": [{"tipo": "PRODUCTO", "id": %d, "cantidad": 1}],
         "datos": {"entrega": "DOMICILIO", "nombre": "Laura", "pago": "EFECTIVO"}}
        """.formatted(hielo))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.detail").value("Escribe la dirección para el domicilio."));
  }

  @Test
  void unCarritoConTodoAgotadoNoArmaMensaje() throws Exception {
    long hielo = publicar("hielo-2-kg", 4000, 0);
    publico(post("/api/v1/pedidos/whatsapp"), """
        {"lineas": [{"tipo": "PRODUCTO", "id": %d, "cantidad": 1}],
         "datos": {"entrega": "RECOGER", "nombre": "Laura", "pago": "EFECTIVO"}}
        """.formatted(hielo))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.detail", containsString("Se acabó «Hielo»")));
  }
}
