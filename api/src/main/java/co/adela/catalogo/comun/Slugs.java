package co.adela.catalogo.comun;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

/**
 * El pedacito de la dirección web de cada producto: «Ron Viejo de Caldas 3 años»
 * → {@code ron-viejo-de-caldas-3-anos}. Sin tildes, sin «ñ», en minúsculas.
 *
 * <p>Google lee estas direcciones, así que conviene que digan qué es el producto.
 */
public final class Slugs {

  private Slugs() {}

  public static String de(String texto) {
    if (texto == null) return "";
    String sinTildes = Normalizer.normalize(texto, Normalizer.Form.NFD)
        .replaceAll("\\p{M}+", ""); // quita las marcas: á → a, ñ → n
    String slug = sinTildes.toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("(^-+|-+$)", "");
    return slug.length() > 80 ? slug.substring(0, 80).replaceAll("-+$", "") : slug;
  }

  /**
   * Un slug que todavía no exista: si «sabajon» ya está, prueba «sabajon-2»,
   * «sabajon-3»…
   *
   * @param existe dice si un slug ya está tomado.
   */
  public static String unico(String texto, Predicate<String> existe) {
    String base = de(texto);
    if (base.isEmpty()) base = "producto";
    String candidato = base;
    for (int n = 2; existe.test(candidato); n++) {
      candidato = base + "-" + n;
    }
    return candidato;
  }
}
