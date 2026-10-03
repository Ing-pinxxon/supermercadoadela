package co.adela.catalogo.categoria;

import co.adela.catalogo.categoria.CategoriaDtos.CategoriaAdmin;
import co.adela.catalogo.categoria.CategoriaDtos.CategoriaEntrada;
import co.adela.catalogo.comun.Conflicto;
import co.adela.catalogo.comun.NoEncontrado;
import co.adela.catalogo.comun.Slugs;
import co.adela.catalogo.producto.ProductoRepositorio;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoriaServicio {

  private final CategoriaRepositorio repo;
  private final ProductoRepositorio productos;

  public CategoriaServicio(CategoriaRepositorio repo, ProductoRepositorio productos) {
    this.repo = repo;
    this.productos = productos;
  }

  @Transactional(readOnly = true)
  public List<CategoriaAdmin> todas() {
    return repo.findAllByOrderByOrdenAscNombreAsc().stream()
        .map(c -> CategoriaAdmin.de(c, productos.countByCategoriaId(c.getId())))
        .toList();
  }

  @Transactional(readOnly = true)
  public Categoria buscar(long id) {
    return repo.findById(id).orElseThrow(() -> new NoEncontrado("Esa categoría no existe."));
  }

  @Transactional
  public CategoriaAdmin crear(CategoriaEntrada e) {
    Categoria c = new Categoria(Slugs.unico(e.nombre(), repo::existsBySlug), e.nombre().trim());
    aplicar(c, e);
    if (e.orden() == null) {
      // Al final de la lista, después de la última.
      c.setOrden(repo.findAllByOrderByOrdenAscNombreAsc().stream().mapToInt(Categoria::getOrden).max().orElse(0) + 10);
    }
    return CategoriaAdmin.de(repo.save(c), 0);
  }

  /** Cambiar el nombre no cambia el slug: la dirección que ya conoce Google sigue igual. */
  @Transactional
  public CategoriaAdmin editar(long id, CategoriaEntrada e) {
    Categoria c = buscar(id);
    c.setNombre(e.nombre().trim());
    aplicar(c, e);
    return CategoriaAdmin.de(c, productos.countByCategoriaId(id));
  }

  @Transactional
  public void borrar(long id) {
    Categoria c = buscar(id);
    long cuantos = productos.countByCategoriaId(id);
    if (cuantos > 0) {
      throw new Conflicto("La categoría «" + c.getNombre() + "» tiene " + cuantos
          + " producto(s). Pásalos a otra categoría u ocúltala en vez de borrarla.");
    }
    repo.delete(c);
  }

  private static void aplicar(Categoria c, CategoriaEntrada e) {
    c.setDescripcion(e.descripcion() == null || e.descripcion().isBlank() ? null : e.descripcion().trim());
    if (e.icono() != null) c.setIcono(e.icono());
    if (e.orden() != null) c.setOrden(e.orden());
    c.setEsLicor(e.esLicor());
    c.setVisible(e.visible());
  }
}
