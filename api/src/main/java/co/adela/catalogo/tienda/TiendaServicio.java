package co.adela.catalogo.tienda;

import co.adela.catalogo.comun.Conflicto;
import co.adela.catalogo.comun.NoEncontrado;
import java.time.LocalTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TiendaServicio {

  private final TiendaRepositorio repo;

  public TiendaServicio(TiendaRepositorio repo) {
    this.repo = repo;
  }

  @Transactional(readOnly = true)
  public TiendaVista ver() {
    return TiendaVista.de(entidad());
  }

  @Transactional(readOnly = true)
  public Tienda entidad() {
    return repo.findById(Tienda.ID)
        .orElseThrow(() -> new NoEncontrado("Faltan los datos de la tienda: ¿corrieron las migraciones?"));
  }

  @Transactional
  public TiendaVista guardar(TiendaEntrada e) {
    Tienda t = entidad();
    if (e.version() != null && e.version() != t.getVersion()) {
      throw new Conflicto("Alguien cambió los datos de la tienda mientras los editabas. Recarga y vuelve a intentar.");
    }
    t.setNombre(e.nombre().trim());
    t.setWhatsapp(normalizarWhatsapp(e.whatsapp()));
    t.setDireccion(e.direccion().trim());
    t.setBarrio(vacioANull(e.barrio()));
    t.setCiudad(e.ciudad().trim());
    t.setAbre(LocalTime.parse(e.abre()));
    t.setCierra(LocalTime.parse(e.cierra()));
    t.setNotaHorario(vacioANull(e.notaHorario()));
    t.setMapsUrl(vacioANull(e.mapsUrl()));
    t.setValorDomicilio(e.valorDomicilio());
    t.setAceptaTransferencia(e.aceptaTransferencia());
    t.setTemporada(e.temporada());
    t.setBannerTitulo(vacioANull(e.bannerTitulo()));
    t.setBannerTexto(vacioANull(e.bannerTexto()));
    t.setBannerSello(vacioANull(e.bannerSello()));
    t.setGoogleVerificacion(vacioANull(e.googleVerificacion()));
    return TiendaVista.de(repo.saveAndFlush(t));
  }

  /** «314 716 7595» → «573147167595». Un número de 10 dígitos es colombiano. */
  static String normalizarWhatsapp(String escrito) {
    String digitos = escrito.replaceAll("\\D", "");
    return digitos.length() == 10 ? "57" + digitos : digitos;
  }

  static String vacioANull(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}
