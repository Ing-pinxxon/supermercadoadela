package co.adela.catalogo.comun;

/**
 * Los datos están bien escritos pero el negocio no lo permite: publicar sin
 * precio, un precio «de antes» más bajo que el de ahora… Sale como 422, con el
 * mensaje listo para mostrarlo tal cual en la pantalla.
 */
public class ReglaDeNegocio extends RuntimeException {
  public ReglaDeNegocio(String mensaje) {
    super(mensaje);
  }
}
