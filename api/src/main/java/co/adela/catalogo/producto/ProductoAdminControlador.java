package co.adela.catalogo.producto;

import co.adela.catalogo.producto.ProductoDtos.CambioFoto;
import co.adela.catalogo.producto.ProductoDtos.CambioPrecio;
import co.adela.catalogo.producto.ProductoDtos.CambioPublicado;
import co.adela.catalogo.producto.ProductoDtos.CambioStock;
import co.adela.catalogo.producto.ProductoDtos.CambioVista;
import co.adela.catalogo.producto.ProductoDtos.ProductoAdmin;
import co.adela.catalogo.producto.ProductoDtos.ProductoEntrada;
import co.adela.catalogo.producto.ProductoDtos.Relacionados;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/productos")
@Tag(name = "Administración: productos", description = "Con API key. Incluye los ocultos y el stock exacto.")
public class ProductoAdminControlador {

  private final ProductoServicio servicio;

  public ProductoAdminControlador(ProductoServicio servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  @Operation(summary = "Todos los productos, en el orden de los estantes")
  public List<ProductoAdmin> todos() {
    return servicio.todos();
  }

  @GetMapping("/{id}")
  public ProductoAdmin ver(@PathVariable long id) {
    return servicio.ver(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ProductoAdmin crear(@Valid @RequestBody ProductoEntrada entrada) {
    return servicio.crear(entrada);
  }

  @PutMapping("/{id}")
  @Operation(summary = "Guardar el producto completo",
      description = "Manda la versión que se estaba editando: si alguien guardó después, responde 409.")
  public ProductoAdmin editar(@PathVariable long id, @Valid @RequestBody ProductoEntrada entrada) {
    return servicio.editar(id, entrada);
  }

  @PatchMapping("/{id}/stock")
  @Operation(summary = "Sumar, restar o fijar el stock", description = "{\"delta\": -1}, {\"valor\": 12} o {\"sinControl\": true}")
  public ProductoAdmin stock(@PathVariable long id, @Valid @RequestBody CambioStock cambio) {
    return servicio.cambiarStock(id, cambio);
  }

  @PatchMapping("/{id}/precio")
  public ProductoAdmin precio(@PathVariable long id, @Valid @RequestBody CambioPrecio cambio) {
    return servicio.cambiarPrecio(id, cambio);
  }

  @PatchMapping("/{id}/publicado")
  public ProductoAdmin publicado(@PathVariable long id, @RequestBody CambioPublicado cambio) {
    return servicio.cambiarPublicado(id, cambio.publicado());
  }

  @PatchMapping("/{id}/foto")
  public ProductoAdmin foto(@PathVariable long id, @Valid @RequestBody CambioFoto cambio) {
    return servicio.cambiarFoto(id, cambio.fotoUrl());
  }

  @PutMapping("/{id}/relacionados")
  @Operation(summary = "Elegir los de «Va bien con…» (máximo 3, en orden)")
  public ProductoAdmin relacionados(@PathVariable long id, @Valid @RequestBody Relacionados cuerpo) {
    return servicio.cambiarRelacionados(id, cuerpo.ids());
  }

  @GetMapping("/{id}/historial")
  @Operation(summary = "Los últimos 50 cambios: quién cambió qué y cuándo")
  public List<CambioVista> historial(@PathVariable long id) {
    return servicio.historial(id);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void borrar(@PathVariable long id) {
    servicio.borrar(id);
  }
}
