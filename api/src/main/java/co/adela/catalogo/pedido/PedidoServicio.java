package co.adela.catalogo.pedido;

import co.adela.catalogo.combo.Combo;
import co.adela.catalogo.combo.ComboRepositorio;
import co.adela.catalogo.comun.Disponibilidad;
import co.adela.catalogo.comun.Pesos;
import co.adela.catalogo.comun.ReglaDeNegocio;
import co.adela.catalogo.pedido.PedidoDtos.DatosEntrega;
import co.adela.catalogo.pedido.PedidoDtos.Entrega;
import co.adela.catalogo.pedido.PedidoDtos.LineaEntrada;
import co.adela.catalogo.pedido.PedidoDtos.LineaRespuesta;
import co.adela.catalogo.pedido.PedidoDtos.Pago;
import co.adela.catalogo.pedido.PedidoDtos.PedidoRespuesta;
import co.adela.catalogo.pedido.PedidoDtos.TipoLinea;
import co.adela.catalogo.producto.Producto;
import co.adela.catalogo.producto.ProductoRepositorio;
import co.adela.catalogo.tienda.Tienda;
import co.adela.catalogo.tienda.TiendaServicio;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Revisa el carrito contra la base y arma el pedido.
 *
 * <p>El navegador manda ids y cantidades; los nombres, los precios y la
 * disponibilidad salen siempre de aquí. Lo que ya no se puede pedir se quita y
 * se explica en {@code avisos}, para que el cliente sepa qué cambió antes de
 * mandar el mensaje.
 */
@Service
@Transactional(readOnly = true)
public class PedidoServicio {

  private final ProductoRepositorio productos;
  private final ComboRepositorio combos;
  private final TiendaServicio tiendas;

  public PedidoServicio(ProductoRepositorio productos, ComboRepositorio combos, TiendaServicio tiendas) {
    this.productos = productos;
    this.combos = combos;
    this.tiendas = tiendas;
  }

  public PedidoRespuesta revisar(List<LineaEntrada> lineas) {
    Tienda tienda = tiendas.entidad();
    Revision r = revisarLineas(lineas);
    return new PedidoRespuesta(r.lineas, r.subtotal, tienda.getValorDomicilio(), r.subtotal, r.avisos, null, null);
  }

  public PedidoRespuesta paraWhatsApp(List<LineaEntrada> lineas, DatosEntrega datos) {
    if (datos.entrega() == Entrega.DOMICILIO && (datos.direccion() == null || datos.direccion().isBlank())) {
      throw new ReglaDeNegocio("Escribe la dirección para el domicilio.");
    }
    Tienda tienda = tiendas.entidad();
    if (datos.pago() == Pago.TRANSFERENCIA && !tienda.isAceptaTransferencia()) {
      throw new ReglaDeNegocio("Por ahora solo recibimos efectivo.");
    }
    Revision r = revisarLineas(lineas);
    if (r.lineas.isEmpty()) {
      throw new ReglaDeNegocio("Nada de lo que tenías en el carrito se puede pedir ahora. " + String.join(" ", r.avisos));
    }
    Integer domicilio = datos.entrega() == Entrega.DOMICILIO ? tienda.getValorDomicilio() : null;
    int total = r.subtotal + (domicilio == null ? 0 : domicilio);
    String texto = MensajeWhatsApp.texto(tienda.getNombre(), r.lineas, r.subtotal, domicilio, datos);
    return new PedidoRespuesta(r.lineas, r.subtotal, domicilio, total, r.avisos, texto,
        MensajeWhatsApp.enlace(tienda.getWhatsapp(), texto));
  }

  private record Revision(List<LineaRespuesta> lineas, int subtotal, List<String> avisos) {}

  private Revision revisarLineas(List<LineaEntrada> entrada) {
    Map<Long, Producto> porId = productos.porIds(ids(entrada, TipoLinea.PRODUCTO)).stream()
        .collect(Collectors.toMap(Producto::getId, Function.identity()));
    Map<Long, Combo> combosPorId = combos.porIds(ids(entrada, TipoLinea.COMBO)).stream()
        .collect(Collectors.toMap(Combo::getId, Function.identity()));

    List<LineaRespuesta> lineas = new ArrayList<>();
    List<String> avisos = new ArrayList<>();
    for (LineaEntrada l : entrada) {
      LineaRespuesta lr = l.tipo() == TipoLinea.PRODUCTO
          ? lineaDeProducto(l, porId.get(l.id()), avisos)
          : lineaDeCombo(l, combosPorId.get(l.id()), avisos);
      if (lr != null) lineas.add(lr);
    }
    int subtotal = lineas.stream().mapToInt(LineaRespuesta::total).sum();
    return new Revision(lineas, subtotal, avisos);
  }

  private static LineaRespuesta lineaDeProducto(LineaEntrada l, Producto p, List<String> avisos) {
    if (p == null || !p.esVisibleEnTienda()) {
      avisos.add("Un producto que tenías ya no está en la tienda y se quitó del pedido.");
      return null;
    }
    int cantidad = ajustar(l.cantidad(), p.getStock(), p.getNombre(), avisos);
    if (cantidad == 0) return null;
    avisarPrecio(l, p.getNombre(), p.getPrecio(), avisos);
    return new LineaRespuesta(TipoLinea.PRODUCTO, p.getId(), p.getNombre(), p.getPresentacion(), cantidad,
        p.getPrecio(), p.getPrecio() * cantidad, p.disponibilidad());
  }

  private static LineaRespuesta lineaDeCombo(LineaEntrada l, Combo c, List<String> avisos) {
    if (c == null || !c.isPublicado()
        || c.getItems().stream().anyMatch(i -> !i.getProducto().esVisibleEnTienda())) {
      avisos.add("Un combo que tenías ya no está disponible y se quitó del pedido.");
      return null;
    }
    int cantidad = ajustar(l.cantidad(), c.maximoPosible(), c.getNombre(), avisos);
    if (cantidad == 0) return null;
    avisarPrecio(l, c.getNombre(), c.getPrecio(), avisos);
    String contenido = c.getItems().stream()
        .map(i -> (i.getCantidad() > 1 ? i.getCantidad() + " × " : "") + i.getProducto().getNombre())
        .collect(Collectors.joining(" + "));
    return new LineaRespuesta(TipoLinea.COMBO, c.getId(), c.getNombre(), contenido, cantidad, c.getPrecio(),
        c.getPrecio() * cantidad, c.disponibilidad());
  }

  /** Si piden más de lo que hay, se deja lo que hay y se avisa. */
  private static int ajustar(int pedida, Integer hay, String nombre, List<String> avisos) {
    if (hay == null || pedida <= hay) return pedida;
    if (hay <= 0 || Disponibilidad.de(hay) == Disponibilidad.AGOTADO) {
      avisos.add("Se acabó «" + nombre + "» y se quitó del pedido.");
      return 0;
    }
    avisos.add("De «" + nombre + "» solo nos quedan " + hay + ": te dejamos esas.");
    return hay;
  }

  private static void avisarPrecio(LineaEntrada l, String nombre, int precio, List<String> avisos) {
    if (l.precioVisto() != null && l.precioVisto() != precio) {
      avisos.add("«" + nombre + "» ahora cuesta " + Pesos.de(precio) + ".");
    }
  }

  private static List<Long> ids(List<LineaEntrada> lineas, TipoLinea tipo) {
    return lineas.stream().filter(l -> l.tipo() == tipo).map(LineaEntrada::id).distinct().toList();
  }
}
