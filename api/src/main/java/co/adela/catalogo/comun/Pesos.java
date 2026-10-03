package co.adela.catalogo.comun;

/** Plata como la escribe la tienda: {@code $ 52.000}. Sin centavos. */
public final class Pesos {

  private Pesos() {}

  public static String de(long monto) {
    String signo = monto < 0 ? "-" : "";
    StringBuilder cifras = new StringBuilder(Long.toString(Math.abs(monto)));
    for (int i = cifras.length() - 3; i > 0; i -= 3) {
      cifras.insert(i, '.');
    }
    return signo + "$ " + cifras;
  }
}
