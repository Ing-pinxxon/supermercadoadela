package co.adela.catalogo.combo;

import co.adela.catalogo.comun.Disponibilidad;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class ComboDtos {

  private ComboDtos() {}

  public record ComboItemAdmin(long productoId, String nombre, String presentacion, int cantidad, int precio,
      boolean publicado) {}

  public record ComboAdmin(
      long id, String slug, String nombre, String descripcion, int precio, int precioPorSeparado,
      String fotoUrl, boolean publicado, boolean deLaSemana, Disponibilidad disponibilidad, long version,
      List<ComboItemAdmin> items) {

    static ComboAdmin de(Combo c) {
      return new ComboAdmin(c.getId(), c.getSlug(), c.getNombre(), c.getDescripcion(), c.getPrecio(),
          c.precioPorSeparado(), c.getFotoUrl(), c.isPublicado(), c.isDeLaSemana(), c.disponibilidad(),
          c.getVersion(), c.getItems().stream().map(i -> new ComboItemAdmin(i.getProducto().getId(),
              i.getProducto().getNombre(), i.getProducto().getPresentacion(), i.getCantidad(),
              i.getProducto().getPrecio(), i.getProducto().isPublicado())).toList());
    }
  }

  public record ItemEntrada(
      @NotNull(message = "Elige el producto.") Long productoId,
      @Min(value = 1, message = "La cantidad mínima es 1.") @Max(value = 24, message = "Máximo 24 de cada uno.") int cantidad) {}

  public record ComboEntrada(
      @NotBlank(message = "Escribe el nombre del combo.") @Size(max = 80) String nombre,
      @Size(max = 300) String descripcion,
      @PositiveOrZero(message = "El precio no puede ser negativo.") int precio,
      @Size(max = 500) @Pattern(regexp = "^$|https://.+", message = "La foto tiene que ser un enlace https.") String fotoUrl,
      boolean publicado,
      boolean deLaSemana,
      @NotEmpty(message = "Un combo necesita al menos un producto.")
      @Size(max = 8, message = "Máximo 8 productos por combo.") List<@Valid ItemEntrada> items,
      Long version) {}
}
