package co.adela.catalogo.comun;

/**
 * Lo que el cliente ve del stock. Nunca el número exacto: solo si hay, si quedan
 * pocas o si se acabó.
 *
 * <p>Es la única regla de disponibilidad de toda la tienda: la usan la tarjeta
 * del producto, el carrito, los combos y lo que se le dice a Google.
 */
public enum Disponibilidad {
  DISPONIBLE,
  ULTIMAS,
  AGOTADO;

  /** Con esta cantidad o menos, la tarjeta dice «Últimas unidades». */
  public static final int UMBRAL_ULTIMAS = 5;

  /**
   * @param stock unidades que hay, o {@code null} si de ese producto no se lleva
   *     la cuenta (entonces siempre está disponible).
   */
  public static Disponibilidad de(Integer stock) {
    if (stock == null) return DISPONIBLE;
    if (stock <= 0) return AGOTADO;
    if (stock <= UMBRAL_ULTIMAS) return ULTIMAS;
    return DISPONIBLE;
  }

  /** La peor de las dos: un combo vale lo que su producto más escaso. */
  public Disponibilidad peor(Disponibilidad otra) {
    return this.ordinal() >= otra.ordinal() ? this : otra;
  }
}
