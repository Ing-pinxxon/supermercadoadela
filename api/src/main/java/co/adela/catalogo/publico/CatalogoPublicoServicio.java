package co.adela.catalogo.publico;

import co.adela.catalogo.categoria.Categoria;
import co.adela.catalogo.categoria.CategoriaRepositorio;
import co.adela.catalogo.combo.ComboRepositorio;
import co.adela.catalogo.comun.NoEncontrado;
import co.adela.catalogo.producto.Producto;
import co.adela.catalogo.producto.ProductoRepositorio;
import co.adela.catalogo.publico.Vistas.CatalogoVista;
import co.adela.catalogo.publico.Vistas.CategoriaVista;
import co.adela.catalogo.publico.Vistas.ComboVista;
import co.adela.catalogo.publico.Vistas.ProductoDetalle;
import co.adela.catalogo.publico.Vistas.ProductoVista;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CatalogoPublicoServicio {

  private final CategoriaRepositorio categorias;
  private final ProductoRepositorio productos;
  private final ComboRepositorio combos;

  public CatalogoPublicoServicio(CategoriaRepositorio categorias, ProductoRepositorio productos,
      ComboRepositorio combos) {
    this.categorias = categorias;
    this.productos = productos;
    this.combos = combos;
  }

  /** Los estantes visibles que tienen algo publicado, con sus productos, y los combos. */
  public CatalogoVista catalogo() {
    Map<Long, List<ProductoVista>> porCategoria = productos.publicados().stream()
        .collect(Collectors.groupingBy(p -> p.getCategoria().getId(),
            Collectors.mapping(ProductoVista::de, Collectors.toList())));
    List<CategoriaVista> estantes = categorias.findByVisibleTrueOrderByOrdenAscNombreAsc().stream()
        .filter(c -> porCategoria.containsKey(c.getId()))
        .map(c -> vista(c, porCategoria.get(c.getId())))
        .toList();
    List<ComboVista> listos = combos.publicados().stream()
        // Un combo con algún producto que se ocultó después no se puede pedir.
        .filter(c -> c.getItems().stream().allMatch(i -> i.getProducto().esVisibleEnTienda()))
        .map(ComboVista::de)
        .toList();
    return new CatalogoVista(estantes, listos);
  }

  public CategoriaVista categoria(String slug) {
    Categoria c = categorias.findBySlug(slug).filter(Categoria::isVisible)
        .orElseThrow(() -> new NoEncontrado("Esa categoría no existe."));
    List<ProductoVista> deEsta = productos.publicados().stream()
        .filter(p -> p.getCategoria().getId().equals(c.getId()))
        .map(ProductoVista::de)
        .toList();
    return vista(c, deEsta);
  }

  public ProductoDetalle producto(String slug) {
    Producto p = productos.porSlug(slug).filter(Producto::esVisibleEnTienda)
        .orElseThrow(() -> new NoEncontrado("Ese producto no está en la tienda."));
    List<ProductoVista> relacionados = p.getRelacionados().stream()
        .filter(Producto::esVisibleEnTienda)
        .map(ProductoVista::de)
        .toList();
    return new ProductoDetalle(ProductoVista.de(p), p.getDescripcion(), p.getGrados(), p.getOrigen(), relacionados);
  }

  /** Para refrescar el carrito: solo los que siguen en la tienda. */
  public List<ProductoVista> productos(Collection<Long> ids) {
    return productos.porIds(ids).stream()
        .filter(Producto::esVisibleEnTienda)
        .map(ProductoVista::de)
        .toList();
  }

  private static CategoriaVista vista(Categoria c, List<ProductoVista> productos) {
    return new CategoriaVista(c.getSlug(), c.getNombre(), c.getDescripcion(), c.getIcono(), c.isEsLicor(), productos);
  }
}
