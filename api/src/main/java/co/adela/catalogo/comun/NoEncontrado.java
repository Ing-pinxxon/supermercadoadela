package co.adela.catalogo.comun;

/** Se pidió algo que no existe (o que no está publicado). Sale como 404. */
public class NoEncontrado extends RuntimeException {
  public NoEncontrado(String mensaje) {
    super(mensaje);
  }
}
