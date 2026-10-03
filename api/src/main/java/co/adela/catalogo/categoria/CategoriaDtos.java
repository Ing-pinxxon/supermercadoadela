package co.adela.catalogo.categoria;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Lo que entra y sale de la administración de categorías. */
public final class CategoriaDtos {

  private CategoriaDtos() {}

  public record CategoriaAdmin(
      long id, String slug, String nombre, String descripcion, String icono,
      int orden, boolean esLicor, boolean visible, long productos) {

    static CategoriaAdmin de(Categoria c, long productos) {
      return new CategoriaAdmin(c.getId(), c.getSlug(), c.getNombre(), c.getDescripcion(), c.getIcono(),
          c.getOrden(), c.isEsLicor(), c.isVisible(), productos);
    }
  }

  public record CategoriaEntrada(
      @NotBlank(message = "Escribe el nombre de la categoría.") @Size(max = 60) String nombre,
      @Size(max = 300) String descripcion,
      @Pattern(regexp = "[a-z0-9-]{1,30}", message = "Elige un dibujo de la lista.") String icono,
      Integer orden,
      boolean esLicor,
      boolean visible) {}
}
