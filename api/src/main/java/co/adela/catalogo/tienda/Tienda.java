package co.adela.catalogo.tienda;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.LocalTime;
import java.time.OffsetDateTime;

/** Los datos del negocio. Hay una sola fila (id = 1). */
@Entity
@Table(name = "tienda")
public class Tienda {

  public static final short ID = 1;

  @Id
  private Short id = ID;

  @Column(nullable = false)
  private String nombre;

  /** Solo dígitos, con el indicativo: 573147167595. */
  @Column(nullable = false)
  private String whatsapp;

  @Column(nullable = false)
  private String direccion;

  private String barrio;

  @Column(nullable = false)
  private String ciudad;

  @Column(nullable = false)
  private LocalTime abre;

  @Column(nullable = false)
  private LocalTime cierra;

  @Column(name = "nota_horario")
  private String notaHorario;

  @Column(name = "maps_url")
  private String mapsUrl;

  /** {@code null}: el valor del domicilio se confirma por WhatsApp. */
  @Column(name = "valor_domicilio")
  private Integer valorDomicilio;

  @Column(name = "acepta_transferencia", nullable = false)
  private boolean aceptaTransferencia = true;

  @Column(nullable = false)
  private boolean temporada;

  @Column(name = "banner_titulo")
  private String bannerTitulo;

  @Column(name = "banner_texto")
  private String bannerTexto;

  @Column(name = "banner_sello")
  private String bannerSello;

  @Column(name = "google_verificacion")
  private String googleVerificacion;

  @Version
  private long version;

  @Column(name = "actualizado_en", nullable = false)
  private OffsetDateTime actualizadoEn;

  protected Tienda() {}

  @PrePersist
  @PreUpdate
  void alGuardar() {
    actualizadoEn = OffsetDateTime.now();
  }

  public Short getId() { return id; }
  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }
  public String getWhatsapp() { return whatsapp; }
  public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }
  public String getDireccion() { return direccion; }
  public void setDireccion(String direccion) { this.direccion = direccion; }
  public String getBarrio() { return barrio; }
  public void setBarrio(String barrio) { this.barrio = barrio; }
  public String getCiudad() { return ciudad; }
  public void setCiudad(String ciudad) { this.ciudad = ciudad; }
  public LocalTime getAbre() { return abre; }
  public void setAbre(LocalTime abre) { this.abre = abre; }
  public LocalTime getCierra() { return cierra; }
  public void setCierra(LocalTime cierra) { this.cierra = cierra; }
  public String getNotaHorario() { return notaHorario; }
  public void setNotaHorario(String notaHorario) { this.notaHorario = notaHorario; }
  public String getMapsUrl() { return mapsUrl; }
  public void setMapsUrl(String mapsUrl) { this.mapsUrl = mapsUrl; }
  public Integer getValorDomicilio() { return valorDomicilio; }
  public void setValorDomicilio(Integer valorDomicilio) { this.valorDomicilio = valorDomicilio; }
  public boolean isAceptaTransferencia() { return aceptaTransferencia; }
  public void setAceptaTransferencia(boolean aceptaTransferencia) { this.aceptaTransferencia = aceptaTransferencia; }
  public boolean isTemporada() { return temporada; }
  public void setTemporada(boolean temporada) { this.temporada = temporada; }
  public String getBannerTitulo() { return bannerTitulo; }
  public void setBannerTitulo(String bannerTitulo) { this.bannerTitulo = bannerTitulo; }
  public String getBannerTexto() { return bannerTexto; }
  public void setBannerTexto(String bannerTexto) { this.bannerTexto = bannerTexto; }
  public String getBannerSello() { return bannerSello; }
  public void setBannerSello(String bannerSello) { this.bannerSello = bannerSello; }
  public String getGoogleVerificacion() { return googleVerificacion; }
  public void setGoogleVerificacion(String googleVerificacion) { this.googleVerificacion = googleVerificacion; }
  public long getVersion() { return version; }
  public OffsetDateTime getActualizadoEn() { return actualizadoEn; }
}
