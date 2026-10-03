package co.adela.catalogo.publico;

import co.adela.catalogo.categoria.Categoria;
import co.adela.catalogo.combo.Combo;
import co.adela.catalogo.comun.Disponibilidad;
import co.adela.catalogo.producto.Producto;
import java.math.BigDecimal;
import java.util.List;

/**
 * Lo que ve el cliente. Nunca lleva el stock exacto ni nada oculto: solo
 * {@link Disponibilidad}.
 */
public final class Vistas {

  private Vistas() {}

  public record ProductoVista(
      long id, String slug, String nombre, String presentacion, int precio, Integer precioAntes,
      String fotoUrl, Disponibilidad disponibilidad, String categoria, String categoriaSlug,
      String icono, boolean esLicor, boolean destacado) {

    public static ProductoVista de(Producto p) {
      Categoria c = p.getCategoria();
      return new ProductoVista(p.getId(), p.getSlug(), p.getNombre(), p.getPresentacion(), p.getPrecio(),
          p.getPrecioAntes(), p.getFotoUrl(), p.disponibilidad(), c.getNombre(), c.getSlug(), c.getIcono(),
          c.isEsLicor(), p.isDestacado());
    }
  }

  public record CategoriaVista(
      String slug, String nombre, String descripcion, String icono, boolean esLicor,
      List<ProductoVista> productos) {}

  public record ProductoDetalle(
      ProductoVista producto, String descripcion, BigDecimal grados, String origen,
      List<ProductoVista> relacionados) {}

  public record ComboItemVista(String nombre, String presentacion, int cantidad) {}

  public record ComboVista(
      long id, String slug, String nombre, String descripcion, int precio, int precioPorSeparado,
      String fotoUrl, Disponibilidad disponibilidad, boolean deLaSemana, boolean esLicor,
      List<ComboItemVista> items) {

    public static ComboVista de(Combo c) {
      return new ComboVista(c.getId(), c.getSlug(), c.getNombre(), c.getDescripcion(), c.getPrecio(),
          c.precioPorSeparado(), c.getFotoUrl(), c.disponibilidad(), c.isDeLaSemana(), c.tieneLicor(),
          c.getItems().stream().map(i -> new ComboItemVista(i.getProducto().getNombre(),
              i.getProducto().getPresentacion(), i.getCantidad())).toList());
    }
  }

  /** Todo el catálogo en una sola respuesta: lo que necesita el inicio de la tienda. */
  public record CatalogoVista(List<CategoriaVista> categorias, List<ComboVista> combos) {}
}
