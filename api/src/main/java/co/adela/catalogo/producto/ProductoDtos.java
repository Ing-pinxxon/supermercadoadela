package co.adela.catalogo.producto;

import co.adela.catalogo.comun.Disponibilidad;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Lo que entra y sale de la administración de productos. Son records: datos
 * inmutables, sin lógica, que Jackson convierte a JSON y de vuelta.
 */
public final class ProductoDtos {

  private ProductoDtos() {}

  /** Un producto tal como lo ve la administración: con el stock exacto y lo oculto. */
  public record ProductoAdmin(
      long id, String slug, String nombre, String presentacion, String descripcion,
      long categoriaId, String categoria, int precio, Integer precioAntes, Integer stock,
      Disponibilidad disponibilidad, String fotoUrl, BigDecimal grados, String origen,
      boolean publicado, boolean destacado, int orden, long version,
      List<Long> relacionados, OffsetDateTime actualizadoEn) {

    public static ProductoAdmin de(Producto p) {
      return new ProductoAdmin(p.getId(), p.getSlug(), p.getNombre(), p.getPresentacion(), p.getDescripcion(),
          p.getCategoria().getId(), p.getCategoria().getNombre(), p.getPrecio(), p.getPrecioAntes(), p.getStock(),
          p.disponibilidad(), p.getFotoUrl(), p.getGrados(), p.getOrigen(), p.isPublicado(), p.isDestacado(),
          p.getOrden(), p.getVersion(), p.getRelacionados().stream().map(Producto::getId).toList(),
          p.getActualizadoEn());
    }
  }

  public record ProductoEntrada(
      @NotBlank(message = "Escribe el nombre del producto.") @Size(max = 120) String nombre,
      @Size(max = 60) String presentacion,
      @Size(max = 2000) String descripcion,
      @NotNull(message = "Elige la categoría.") Long categoriaId,
      @PositiveOrZero(message = "El precio no puede ser negativo.") int precio,
      @Positive(message = "El precio de antes tiene que ser mayor que cero.") Integer precioAntes,
      @PositiveOrZero(message = "El stock no puede ser negativo.") Integer stock,
      @Size(max = 500) @Pattern(regexp = "^$|https://.+", message = "La foto tiene que ser un enlace https.") String fotoUrl,
      @DecimalMin(value = "0", message = "Los grados van de 0 a 100.")
      @DecimalMax(value = "100", message = "Los grados van de 0 a 100.") BigDecimal grados,
      @Size(max = 60) String origen,
      boolean publicado,
      boolean destacado,
      Integer orden,
      /** La versión que se estaba editando; si otro guardó después, se avisa. */
      Long version) {}

  /** Mandar uno de los dos: {@code delta} (+1, −1) o {@code valor} (el número exacto). */
  public record CambioStock(Integer delta, @PositiveOrZero(message = "El stock no puede ser negativo.") Integer valor,
      /** {@code true} para dejar de llevar la cuenta de este producto. */
      boolean sinControl) {}

  public record CambioPrecio(
      @PositiveOrZero(message = "El precio no puede ser negativo.") int precio,
      @Positive(message = "El precio de antes tiene que ser mayor que cero.") Integer precioAntes) {}

  public record CambioPublicado(boolean publicado) {}

  public record CambioFoto(
      @Size(max = 500) @Pattern(regexp = "^$|https://.+", message = "La foto tiene que ser un enlace https.") String fotoUrl) {}

  public record Relacionados(@NotNull @Size(max = 3, message = "Máximo tres productos en «Va bien con…».") List<Long> ids) {}

  public record CambioVista(String campo, String antes, String despues, String quien, OffsetDateTime cuando) {
    static CambioVista de(CambioProducto c) {
      return new CambioVista(c.getCampo(), c.getAntes(), c.getDespues(), c.getQuien(), c.getCuando());
    }
  }
}
