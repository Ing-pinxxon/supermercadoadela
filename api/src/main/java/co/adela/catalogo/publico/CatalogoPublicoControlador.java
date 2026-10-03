package co.adela.catalogo.publico;

import co.adela.catalogo.publico.Vistas.CatalogoVista;
import co.adela.catalogo.publico.Vistas.CategoriaVista;
import co.adela.catalogo.publico.Vistas.ProductoDetalle;
import co.adela.catalogo.publico.Vistas.ProductoVista;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Catálogo", description = "Lo que ve cualquier cliente. Sin API key.")
public class CatalogoPublicoControlador {

  private final CatalogoPublicoServicio servicio;

  public CatalogoPublicoControlador(CatalogoPublicoServicio servicio) {
    this.servicio = servicio;
  }

  @GetMapping("/catalogo")
  @Operation(summary = "Todo lo publicado, por estante, más los combos")
  public CatalogoVista catalogo() {
    return servicio.catalogo();
  }

  @GetMapping("/categorias/{slug}")
  public CategoriaVista categoria(@PathVariable String slug) {
    return servicio.categoria(slug);
  }

  @GetMapping("/productos/{slug}")
  @Operation(summary = "Un producto con su «Va bien con…»")
  public ProductoDetalle producto(@PathVariable String slug) {
    return servicio.producto(slug);
  }

  @GetMapping("/productos")
  @Operation(summary = "Varios productos por id (para refrescar el carrito)")
  public List<ProductoVista> productos(@RequestParam List<Long> ids) {
    return servicio.productos(ids.stream().limit(60).toList());
  }
}
