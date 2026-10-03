package co.adela.catalogo.producto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

/** Una línea del historial: «precio de $ 50.000 a $ 52.000, por tienda, el 3 de dic.». */
@Entity
@Table(name = "cambio_producto")
public class CambioProducto {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "producto_id", nullable = false)
  private Long productoId;

  @Column(nullable = false)
  private String campo;

  private String antes;
  private String despues;

  @Column(nullable = false)
  private String quien;

  @Column(nullable = false)
  private OffsetDateTime cuando;

  protected CambioProducto() {}

  public CambioProducto(Long productoId, String campo, String antes, String despues, String quien) {
    this.productoId = productoId;
    this.campo = campo;
    this.antes = antes;
    this.despues = despues;
    this.quien = quien;
    this.cuando = OffsetDateTime.now();
  }

  public Long getId() { return id; }
  public Long getProductoId() { return productoId; }
  public String getCampo() { return campo; }
  public String getAntes() { return antes; }
  public String getDespues() { return despues; }
  public String getQuien() { return quien; }
  public OffsetDateTime getCuando() { return cuando; }
}
