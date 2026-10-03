package co.adela.catalogo.pedido;

import co.adela.catalogo.comun.Disponibilidad;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class PedidoDtos {

  private PedidoDtos() {}

  public enum TipoLinea { PRODUCTO, COMBO }

  public enum Entrega { DOMICILIO, RECOGER }

  public enum Pago { EFECTIVO, TRANSFERENCIA }

  /**
   * Una línea del carrito como la manda el navegador. {@code precioVisto} es el
   * precio que el cliente tenía en pantalla: si cambió, se le avisa.
   */
  public record LineaEntrada(
      @NotNull TipoLinea tipo,
      @NotNull Long id,
      @Min(value = 1, message = "La cantidad mínima es 1.") @Max(value = 99, message = "Máximo 99 de cada uno.") int cantidad,
      Integer precioVisto) {}

  public record DatosEntrega(
      @NotNull(message = "Elige domicilio o recoger.") Entrega entrega,
      @NotBlank(message = "Escribe tu nombre.") @Size(max = 60, message = "El nombre es muy largo.") String nombre,
      @Size(max = 200, message = "La dirección es muy larga.") String direccion,
      @Size(max = 300, message = "La nota es muy larga.") String nota,
      @NotNull(message = "Elige cómo vas a pagar.") Pago pago) {}

  /** Para revisar el carrito basta con las líneas. */
  public record Carrito(
      @NotEmpty(message = "El carrito está vacío.") @Size(max = 50, message = "Máximo 50 productos distintos.")
      List<@Valid LineaEntrada> lineas) {}

  /** Para armar el mensaje de WhatsApp hacen falta también los datos de entrega. */
  public record PedidoEntrada(
      @NotEmpty(message = "El carrito está vacío.") @Size(max = 50, message = "Máximo 50 productos distintos.")
      List<@Valid LineaEntrada> lineas,
      @NotNull(message = "Faltan los datos de entrega.") @Valid DatosEntrega datos) {}

  public record LineaRespuesta(
      TipoLinea tipo, long id, String nombre, String presentacion, int cantidad, int precio, int total,
      Disponibilidad disponibilidad) {}

  /**
   * El carrito ya revisado: lo que de verdad se puede pedir, con los precios de
   * hoy. {@code mensaje} y {@code enlace} solo vienen al pedir por WhatsApp.
   */
  public record PedidoRespuesta(
      List<LineaRespuesta> lineas, int subtotal, Integer domicilio, int total, List<String> avisos,
      String mensaje, String enlace) {}
}
