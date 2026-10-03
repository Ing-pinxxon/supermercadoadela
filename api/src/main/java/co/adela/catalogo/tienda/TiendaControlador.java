package co.adela.catalogo.tienda;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Tienda", description = "Los datos del negocio: WhatsApp, dirección, horario, temporada.")
public class TiendaControlador {

  private final TiendaServicio servicio;

  public TiendaControlador(TiendaServicio servicio) {
    this.servicio = servicio;
  }

  @GetMapping("/api/v1/tienda")
  @Operation(summary = "Los datos del negocio (público)")
  public TiendaVista ver() {
    return servicio.ver();
  }

  @PutMapping("/api/v1/admin/tienda")
  @Operation(summary = "Guardar los datos del negocio (con API key)")
  public TiendaVista guardar(@Valid @RequestBody TiendaEntrada entrada) {
    return servicio.guardar(entrada);
  }
}
