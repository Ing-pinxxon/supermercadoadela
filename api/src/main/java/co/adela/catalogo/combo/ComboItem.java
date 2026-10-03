package co.adela.catalogo.combo;

import co.adela.catalogo.producto.Producto;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

/** Una línea del combo: «1 × Hielo 2 kg». Vive dentro del combo, no tiene id propio. */
@Embeddable
public class ComboItem {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "producto_id")
  private Producto producto;

  @Column(nullable = false)
  private int cantidad;

  protected ComboItem() {}

  public ComboItem(Producto producto, int cantidad) {
    this.producto = producto;
    this.cantidad = cantidad;
  }

  public Producto getProducto() { return producto; }
  public int getCantidad() { return cantidad; }
}
