package co.adela.catalogo.categoria;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Un «estante» de la tienda: Aguardiente, Cervezas, Navidad… */
@Entity
@Table(name = "categoria")
public class Categoria {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String slug;

  @Column(nullable = false)
  private String nombre;

  private String descripcion;

  /** Qué dibujo pinta la tienda para este estante (lo interpreta la página). */
  @Column(nullable = false)
  private String icono = "todo";

  @Column(nullable = false)
  private int orden;

  @Column(name = "es_licor", nullable = false)
  private boolean esLicor;

  @Column(nullable = false)
  private boolean visible = true;

  protected Categoria() {} // para JPA

  public Categoria(String slug, String nombre) {
    this.slug = slug;
    this.nombre = nombre;
  }

  public Long getId() { return id; }
  public String getSlug() { return slug; }
  public void setSlug(String slug) { this.slug = slug; }
  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }
  public String getDescripcion() { return descripcion; }
  public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
  public String getIcono() { return icono; }
  public void setIcono(String icono) { this.icono = icono; }
  public int getOrden() { return orden; }
  public void setOrden(int orden) { this.orden = orden; }
  public boolean isEsLicor() { return esLicor; }
  public void setEsLicor(boolean esLicor) { this.esLicor = esLicor; }
  public boolean isVisible() { return visible; }
  public void setVisible(boolean visible) { this.visible = visible; }
}
