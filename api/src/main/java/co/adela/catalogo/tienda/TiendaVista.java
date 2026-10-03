package co.adela.catalogo.tienda;

/**
 * Los datos del negocio como los lee la página: horas en «HH:mm», WhatsApp en
 * dígitos. Es pública: todo esto sale en la tienda y en Google.
 */
public record TiendaVista(
    String nombre,
    String whatsapp,
    String direccion,
    String barrio,
    String ciudad,
    String abre,
    String cierra,
    String notaHorario,
    String mapsUrl,
    Integer valorDomicilio,
    boolean aceptaTransferencia,
    boolean temporada,
    String bannerTitulo,
    String bannerTexto,
    String bannerSello,
    String googleVerificacion,
    long version) {

  static TiendaVista de(Tienda t) {
    return new TiendaVista(t.getNombre(), t.getWhatsapp(), t.getDireccion(), t.getBarrio(), t.getCiudad(),
        t.getAbre().toString(), t.getCierra().toString(), t.getNotaHorario(), t.getMapsUrl(),
        t.getValorDomicilio(), t.isAceptaTransferencia(), t.isTemporada(), t.getBannerTitulo(),
        t.getBannerTexto(), t.getBannerSello(), t.getGoogleVerificacion(), t.getVersion());
  }
}
