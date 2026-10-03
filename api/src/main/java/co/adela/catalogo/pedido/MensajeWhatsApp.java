package co.adela.catalogo.pedido;

import co.adela.catalogo.comun.Pesos;
import co.adela.catalogo.pedido.PedidoDtos.DatosEntrega;
import co.adela.catalogo.pedido.PedidoDtos.Entrega;
import co.adela.catalogo.pedido.PedidoDtos.LineaRespuesta;
import co.adela.catalogo.pedido.PedidoDtos.Pago;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * El texto que le llega a la tienda por WhatsApp. Se arma aquí y no en la
 * página para que siempre salga con los precios reales, nunca con lo que el
 * navegador diga.
 *
 * <pre>
 * Hola, Supermercado Adela. Quiero pedir:
 * • 2 × Aguardiente Antioqueño sin azúcar (Botella 750 ml) — $ 104.000
 *
 * Total: $ 104.000
 * Entrega: domicilio a Calle 26 Sur #4-10
 * El valor del domicilio me lo confirman por aquí.
 * Pago: efectivo
 * Nombre: Laura
 * </pre>
 */
public final class MensajeWhatsApp {

  private MensajeWhatsApp() {}

  public static String texto(String tienda, List<LineaRespuesta> lineas, int subtotal, Integer domicilio,
      DatosEntrega datos) {
    StringBuilder m = new StringBuilder("Hola, ").append(tienda).append(". Quiero pedir:\n");
    for (LineaRespuesta l : lineas) {
      m.append("• ").append(l.cantidad()).append(" × ").append(l.nombre());
      if (l.presentacion() != null) m.append(" (").append(l.presentacion()).append(")");
      m.append(" — ").append(Pesos.de(l.total())).append('\n');
    }
    m.append('\n');

    boolean conDomicilioFijo = datos.entrega() == Entrega.DOMICILIO && domicilio != null;
    if (conDomicilioFijo) {
      m.append("Productos: ").append(Pesos.de(subtotal)).append('\n');
      m.append("Domicilio: ").append(Pesos.de(domicilio)).append('\n');
      m.append("Total: ").append(Pesos.de(subtotal + domicilio)).append('\n');
    } else {
      m.append("Total: ").append(Pesos.de(subtotal)).append('\n');
    }

    if (datos.entrega() == Entrega.DOMICILIO) {
      m.append("Entrega: domicilio a ").append(enUnaLinea(datos.direccion())).append('\n');
      if (domicilio == null) m.append("El valor del domicilio me lo confirman por aquí.\n");
    } else {
      m.append("Entrega: paso a recoger a la tienda\n");
    }
    m.append("Pago: ").append(datos.pago() == Pago.EFECTIVO ? "efectivo" : "Nequi o transferencia").append('\n');
    m.append("Nombre: ").append(enUnaLinea(datos.nombre()));
    if (datos.nota() != null && !datos.nota().isBlank()) {
      m.append("\nNota: ").append(enUnaLinea(datos.nota()));
    }
    return m.toString();
  }

  /** {@code https://wa.me/573147167595?text=…}: abre el chat con el mensaje ya escrito. */
  public static String enlace(String whatsapp, String texto) {
    // URLEncoder codifica el espacio como «+»; WhatsApp lo quiere como %20.
    return "https://wa.me/" + whatsapp + "?text=" + URLEncoder.encode(texto, StandardCharsets.UTF_8).replace("+", "%20");
  }

  /** Lo que escribe el cliente va en una sola línea, para que no desarme el mensaje. */
  static String enUnaLinea(String s) {
    return s == null ? "" : s.replaceAll("\\s+", " ").trim();
  }
}
