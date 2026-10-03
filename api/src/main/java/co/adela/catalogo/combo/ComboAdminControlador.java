package co.adela.catalogo.combo;

import co.adela.catalogo.combo.ComboDtos.ComboAdmin;
import co.adela.catalogo.combo.ComboDtos.ComboEntrada;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/combos")
@Tag(name = "Administración: combos", description = "Con API key.")
public class ComboAdminControlador {

  private final ComboServicio servicio;

  public ComboAdminControlador(ComboServicio servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  public List<ComboAdmin> todos() {
    return servicio.todos();
  }

  @GetMapping("/{id}")
  public ComboAdmin ver(@PathVariable long id) {
    return servicio.ver(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ComboAdmin crear(@Valid @RequestBody ComboEntrada entrada) {
    return servicio.crear(entrada);
  }

  @PutMapping("/{id}")
  public ComboAdmin editar(@PathVariable long id, @Valid @RequestBody ComboEntrada entrada) {
    return servicio.editar(id, entrada);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void borrar(@PathVariable long id) {
    servicio.borrar(id);
  }
}
