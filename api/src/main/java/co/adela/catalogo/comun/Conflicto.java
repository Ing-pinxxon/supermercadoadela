package co.adela.catalogo.comun;

/**
 * Lo que se quería hacer choca con el estado actual: alguien más editó el mismo
 * producto, o se quiere borrar una categoría que todavía tiene productos. Sale
 * como 409.
 */
public class Conflicto extends RuntimeException {
  public Conflicto(String mensaje) {
    super(mensaje);
  }
}
