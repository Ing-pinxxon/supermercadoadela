package co.adela.catalogo.pedido;

import static org.assertj.core.api.Assertions.assertThat;

import co.adela.catalogo.comun.Disponibilidad;
import co.adela.catalogo.pedido.PedidoDtos.DatosEntrega;
import co.adela.catalogo.pedido.PedidoDtos.Entrega;
import co.adela.catalogo.pedido.PedidoDtos.LineaRespuesta;
import co.adela.catalogo.pedido.PedidoDtos.Pago;
import co.adela.catalogo.pedido.PedidoDtos.TipoLinea;
import java.util.List;
import org.junit.jupiter.api.Test;

class MensajeWhatsAppTest {

  private final List<LineaRespuesta> lineas = List.of(
      new LineaRespuesta(TipoLinea.PRODUCTO, 1, "Aguardiente Antioqueño sin azúcar", "Botella 750 ml", 2, 52000,
          104000, Disponibilidad.DISPONIBLE),
      new LineaRespuesta(TipoLinea.PRODUCTO, 2, "Hielo", "Bolsa 2 kg", 2, 4000, 8000, Disponibilidad.DISPONIBLE));

  @Test
  void domicilioSinValorFijo() {
    var datos = new DatosEntrega(Entrega.DOMICILIO, "Laura", "Calle 26 Sur #4-10", null, Pago.EFECTIVO);
    assertThat(MensajeWhatsApp.texto("Supermercado Adela", lineas, 112000, null, datos)).isEqualTo("""
        Hola, Supermercado Adela. Quiero pedir:
        • 2 × Aguardiente Antioqueño sin azúcar (Botella 750 ml) — $ 104.000
        • 2 × Hielo (Bolsa 2 kg) — $ 8.000

        Total: $ 112.000
        Entrega: domicilio a Calle 26 Sur #4-10
        El valor del domicilio me lo confirman por aquí.
        Pago: efectivo
        Nombre: Laura""");
  }

  @Test
  void domicilioConValorFijoSumaAlTotal() {
    var datos = new DatosEntrega(Entrega.DOMICILIO, "Laura", "Calle 26 Sur", null, Pago.TRANSFERENCIA);
    String texto = MensajeWhatsApp.texto("Supermercado Adela", lineas, 112000, 3000, datos);
    assertThat(texto).contains("Productos: $ 112.000\nDomicilio: $ 3.000\nTotal: $ 115.000")
        .contains("Pago: Nequi o transferencia")
        .doesNotContain("me lo confirman");
  }

  @Test
  void recogerNoPideDireccionYLaNotaVaEnUnaLinea() {
    var datos = new DatosEntrega(Entrega.RECOGER, "  Don\nPedro ", null, "Bien fría,\n por favor", Pago.EFECTIVO);
    String texto = MensajeWhatsApp.texto("Supermercado Adela", lineas, 112000, 3000, datos);
    assertThat(texto).contains("Total: $ 112.000\nEntrega: paso a recoger a la tienda")
        .contains("Nombre: Don Pedro")
        .endsWith("Nota: Bien fría, por favor");
  }

  @Test
  void enlaceConEspaciosComoPorcentaje20() {
    assertThat(MensajeWhatsApp.enlace("573147167595", "Hola, Adela"))
        .isEqualTo("https://wa.me/573147167595?text=Hola%2C%20Adela");
  }
}
