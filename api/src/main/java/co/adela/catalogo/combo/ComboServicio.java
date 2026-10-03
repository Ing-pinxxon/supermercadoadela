package co.adela.catalogo.combo;

import co.adela.catalogo.combo.ComboDtos.ComboAdmin;
import co.adela.catalogo.combo.ComboDtos.ComboEntrada;
import co.adela.catalogo.combo.ComboDtos.ItemEntrada;
import co.adela.catalogo.comun.Conflicto;
import co.adela.catalogo.comun.NoEncontrado;
import co.adela.catalogo.comun.Pesos;
import co.adela.catalogo.comun.ReglaDeNegocio;
import co.adela.catalogo.comun.Slugs;
import co.adela.catalogo.producto.Producto;
import co.adela.catalogo.producto.ProductoRepositorio;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComboServicio {

  private final ComboRepositorio repo;
  private final ProductoRepositorio productos;

  public ComboServicio(ComboRepositorio repo, ProductoRepositorio productos) {
    this.repo = repo;
    this.productos = productos;
  }

  @Transactional(readOnly = true)
  public List<ComboAdmin> todos() {
    return repo.todos().stream().map(ComboAdmin::de).toList();
  }

  @Transactional(readOnly = true)
  public ComboAdmin ver(long id) {
    return ComboAdmin.de(buscar(id));
  }

  private Combo buscar(long id) {
    return repo.porIds(List.of(id)).stream().findFirst()
        .orElseThrow(() -> new NoEncontrado("Ese combo no existe."));
  }

  @Transactional
  public ComboAdmin crear(ComboEntrada e) {
    Combo c = new Combo(Slugs.unico(e.nombre(), repo::existsBySlug), e.nombre().trim());
    aplicar(c, e);
    repo.save(c);
    if (c.isDeLaSemana()) repo.quitarDeLaSemanaMenos(c.getId());
    return ComboAdmin.de(c);
  }

  @Transactional
  public ComboAdmin editar(long id, ComboEntrada e) {
    Combo c = buscar(id);
    if (e.version() != null && e.version() != c.getVersion()) {
      throw new Conflicto("Alguien cambió el combo mientras lo editabas. Recarga y vuelve a intentar.");
    }
    c.setNombre(e.nombre().trim());
    aplicar(c, e);
    repo.saveAndFlush(c);
    if (c.isDeLaSemana()) repo.quitarDeLaSemanaMenos(c.getId());
    return ComboAdmin.de(c);
  }

  @Transactional
  public void borrar(long id) {
    repo.delete(buscar(id));
  }

  private void aplicar(Combo c, ComboEntrada e) {
    Set<Long> vistos = new HashSet<>();
    for (ItemEntrada i : e.items()) {
      if (!vistos.add(i.productoId())) {
        throw new ReglaDeNegocio("Un producto está repetido en el combo: súmale a la cantidad.");
      }
    }
    Map<Long, Producto> encontrados = productos.porIds(vistos).stream()
        .collect(Collectors.toMap(Producto::getId, Function.identity()));

    c.setDescripcion(e.descripcion() == null || e.descripcion().isBlank() ? null : e.descripcion().trim());
    c.setPrecio(e.precio());
    c.setFotoUrl(e.fotoUrl() == null || e.fotoUrl().isBlank() ? null : e.fotoUrl());
    c.setPublicado(e.publicado());
    c.setDeLaSemana(e.deLaSemana());
    c.getItems().clear();
    for (ItemEntrada i : e.items()) {
      Producto p = encontrados.get(i.productoId());
      if (p == null) throw new NoEncontrado("El producto " + i.productoId() + " no existe.");
      c.getItems().add(new ComboItem(p, i.cantidad()));
    }
    validar(c);
  }

  static void validar(Combo c) {
    if (c.isPublicado() && c.getPrecio() <= 0) {
      throw new ReglaDeNegocio("Ponle precio al combo antes de publicarlo.");
    }
    if (c.isPublicado()) {
      for (ComboItem i : c.getItems()) {
        if (!i.getProducto().isPublicado()) {
          throw new ReglaDeNegocio("«" + i.getProducto().getNombre()
              + "» está oculto: publícalo antes de publicar el combo.");
        }
      }
      int separado = c.precioPorSeparado();
      if (separado > 0 && c.getPrecio() > separado) {
        throw new ReglaDeNegocio("El combo (" + Pesos.de(c.getPrecio()) + ") sale más caro que comprar todo por separado ("
            + Pesos.de(separado) + ").");
      }
    }
  }
}
