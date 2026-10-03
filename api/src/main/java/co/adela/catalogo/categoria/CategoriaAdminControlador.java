package co.adela.catalogo.categoria;

import co.adela.catalogo.categoria.CategoriaDtos.CategoriaAdmin;
import co.adela.catalogo.categoria.CategoriaDtos.CategoriaEntrada;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/api/v1/admin/categorias")
@Tag(name = "Administración: categorías", description = "Con API key.")
public class CategoriaAdminControlador {

  private final CategoriaServicio servicio;

  public CategoriaAdminControlador(CategoriaServicio servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  @Operation(summary = "Todas las categorías, también las ocultas")
  public List<CategoriaAdmin> todas() {
    return servicio.todas();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CategoriaAdmin crear(@Valid @RequestBody CategoriaEntrada entrada) {
    return servicio.crear(entrada);
  }

  @PutMapping("/{id}")
  public CategoriaAdmin editar(@PathVariable long id, @Valid @RequestBody CategoriaEntrada entrada) {
    return servicio.editar(id, entrada);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Borrar una categoría vacía")
  public void borrar(@PathVariable long id) {
    servicio.borrar(id);
  }
}
