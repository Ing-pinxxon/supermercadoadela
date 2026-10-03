package co.adela.catalogo.pedido;

import co.adela.catalogo.pedido.PedidoDtos.Carrito;
import co.adela.catalogo.pedido.PedidoDtos.PedidoEntrada;
import co.adela.catalogo.pedido.PedidoDtos.PedidoRespuesta;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** No se guarda ningún pedido: se revisa y se arma el mensaje de WhatsApp. */
@RestController
@RequestMapping("/api/v1/pedidos")
@Tag(name = "Pedidos", description = "Revisar el carrito y armar el mensaje de WhatsApp. Sin API key.")
public class PedidoControlador {

  private final PedidoServicio servicio;

  public PedidoControlador(PedidoServicio servicio) {
    this.servicio = servicio;
  }

  @PostMapping("/revisar")
  @Operation(summary = "Revisar el carrito con los precios y el stock de ahora")
  public PedidoRespuesta revisar(@Valid @RequestBody Carrito carrito) {
    return servicio.revisar(carrito.lineas());
  }

  @PostMapping("/whatsapp")
  @Operation(summary = "Armar el mensaje y el enlace de WhatsApp")
  public PedidoRespuesta whatsapp(@Valid @RequestBody PedidoEntrada pedido) {
    return servicio.paraWhatsApp(pedido.lineas(), pedido.datos());
  }
}
