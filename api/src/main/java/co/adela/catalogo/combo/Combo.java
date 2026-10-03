package co.adela.catalogo.combo;

import co.adela.catalogo.comun.Disponibilidad;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/** Varios productos a un solo precio: «Combo novena». */
@Entity
@Table(name = "combo")
public class Combo {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(nullable = false)
  private String nombre;

  private String descripcion;

  @Column(nullable = false)
  private int precio;

  @Column(name = "foto_url")
  private String fotoUrl;

  @Column(nullable = false)
  private boolean publicado;

  @Column(name = "de_la_semana", nullable = false)
  private boolean deLaSemana;

  @Version
  private long version;

  @Column(name = "creado_en", nullable = false, updatable = false)
  private OffsetDateTime creadoEn;

  @Column(name = "actualizado_en", nullable = false)
  private OffsetDateTime actualizadoEn;

  @ElementCollection
  @CollectionTable(name = "combo_item", joinColumns = @JoinColumn(name = "combo_id"))
  private List<ComboItem> items = new ArrayList<>();

  protected Combo() {}

  public Combo(String slug, String nombre) {
    this.slug = slug;
    this.nombre = nombre;
  }

  @PrePersist
  void alCrear() {
    creadoEn = actualizadoEn = OffsetDateTime.now();
  }

  @PreUpdate
  void alCambiar() {
    actualizadoEn = OffsetDateTime.now();
  }

  /** Lo que costaría comprar todo por separado, para mostrar el ahorro. */
  public int precioPorSeparado() {
    return items.stream().mapToInt(i -> i.getProducto().getPrecio() * i.getCantidad()).sum();
  }

  /**
   * Un combo está tan disponible como su producto más escaso: si se acabó el
   * hielo, no hay combo.
   */
  public Disponibilidad disponibilidad() {
    Disponibilidad peor = Disponibilidad.DISPONIBLE;
    for (ComboItem i : items) {
      Integer stock = i.getProducto().getStock();
      Integer combosPosibles = stock == null ? null : stock / i.getCantidad();
      peor = peor.peor(Disponibilidad.de(combosPosibles));
    }
    return peor;
  }

  /** Cuántos combos alcanzan con el stock, o {@code null} si ningún producto lleva cuenta. */
  public Integer maximoPosible() {
    Integer maximo = null;
    for (ComboItem i : items) {
      Integer stock = i.getProducto().getStock();
      if (stock == null) continue;
      int posibles = stock / i.getCantidad();
      maximo = maximo == null ? posibles : Math.min(maximo, posibles);
    }
    return maximo;
  }

  public boolean tieneLicor() {
    return items.stream().anyMatch(i -> i.getProducto().getCategoria().isEsLicor());
  }

  public Long getId() { return id; }
  public String getSlug() { return slug; }
  public void setSlug(String slug) { this.slug = slug; }
  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }
  public String getDescripcion() { return descripcion; }
  public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
  public int getPrecio() { return precio; }
  public void setPrecio(int precio) { this.precio = precio; }
  public String getFotoUrl() { return fotoUrl; }
  public void setFotoUrl(String fotoUrl) { this.fotoUrl = fotoUrl; }
  public boolean isPublicado() { return publicado; }
  public void setPublicado(boolean publicado) { this.publicado = publicado; }
  public boolean isDeLaSemana() { return deLaSemana; }
  public void setDeLaSemana(boolean deLaSemana) { this.deLaSemana = deLaSemana; }
  public long getVersion() { return version; }
  public List<ComboItem> getItems() { return items; }
}
