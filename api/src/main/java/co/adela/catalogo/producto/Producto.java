package co.adela.catalogo.producto;

import co.adela.catalogo.categoria.Categoria;
import co.adela.catalogo.comun.Disponibilidad;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/** Lo que se vende: una botella, un six pack, una bolsa de hielo. */
@Entity
@Table(name = "producto")
public class Producto {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(nullable = false)
  private String nombre;

  private String presentacion;
  private String descripcion;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "categoria_id")
  private Categoria categoria;

  @Column(nullable = false)
  private int precio;

  @Column(name = "precio_antes")
  private Integer precioAntes;

  /** {@code null}: no se lleva la cuenta de este producto. */
  private Integer stock;

  @Column(name = "foto_url")
  private String fotoUrl;

  @Column(precision = 4, scale = 1)
  private BigDecimal grados;

  private String origen;

  @Column(nullable = false)
  private boolean publicado;

  @Column(nullable = false)
  private boolean destacado;

  @Column(nullable = false)
  private int orden;

  /**
   * Bloqueo optimista: Hibernate suma 1 en cada guardado y, si otro guardó
   * primero, el segundo falla en vez de pisar el cambio sin avisar.
   */
  @Version
  private long version;

  @Column(name = "creado_en", nullable = false, updatable = false)
  private OffsetDateTime creadoEn;

  @Column(name = "actualizado_en", nullable = false)
  private OffsetDateTime actualizadoEn;

  /** «Va bien con…». La posición en la lista es el orden en que se muestran. */
  @ManyToMany
  @JoinTable(name = "producto_relacionado",
      joinColumns = @JoinColumn(name = "producto_id"),
      inverseJoinColumns = @JoinColumn(name = "relacionado_id"))
  @OrderColumn(name = "orden")
  private List<Producto> relacionados = new ArrayList<>();

  protected Producto() {}

  public Producto(String slug, String nombre, Categoria categoria) {
    this.slug = slug;
    this.nombre = nombre;
    this.categoria = categoria;
  }

  @PrePersist
  void alCrear() {
    creadoEn = actualizadoEn = OffsetDateTime.now();
  }

  @PreUpdate
  void alCambiar() {
    actualizadoEn = OffsetDateTime.now();
  }

  public Disponibilidad disponibilidad() {
    return Disponibilidad.de(stock);
  }

  /** Lo que ve el cliente: publicado y en un estante que se muestra. */
  public boolean esVisibleEnTienda() {
    return publicado && categoria.isVisible();
  }

  public Long getId() { return id; }
  public String getSlug() { return slug; }
  public void setSlug(String slug) { this.slug = slug; }
  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }
  public String getPresentacion() { return presentacion; }
  public void setPresentacion(String presentacion) { this.presentacion = presentacion; }
  public String getDescripcion() { return descripcion; }
  public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
  public Categoria getCategoria() { return categoria; }
  public void setCategoria(Categoria categoria) { this.categoria = categoria; }
  public int getPrecio() { return precio; }
  public void setPrecio(int precio) { this.precio = precio; }
  public Integer getPrecioAntes() { return precioAntes; }
  public void setPrecioAntes(Integer precioAntes) { this.precioAntes = precioAntes; }
  public Integer getStock() { return stock; }
  public void setStock(Integer stock) { this.stock = stock; }
  public String getFotoUrl() { return fotoUrl; }
  public void setFotoUrl(String fotoUrl) { this.fotoUrl = fotoUrl; }
  public BigDecimal getGrados() { return grados; }
  public void setGrados(BigDecimal grados) { this.grados = grados; }
  public String getOrigen() { return origen; }
  public void setOrigen(String origen) { this.origen = origen; }
  public boolean isPublicado() { return publicado; }
  public void setPublicado(boolean publicado) { this.publicado = publicado; }
  public boolean isDestacado() { return destacado; }
  public void setDestacado(boolean destacado) { this.destacado = destacado; }
  public int getOrden() { return orden; }
  public void setOrden(int orden) { this.orden = orden; }
  public long getVersion() { return version; }
  public OffsetDateTime getCreadoEn() { return creadoEn; }
  public OffsetDateTime getActualizadoEn() { return actualizadoEn; }
  public List<Producto> getRelacionados() { return relacionados; }
}
