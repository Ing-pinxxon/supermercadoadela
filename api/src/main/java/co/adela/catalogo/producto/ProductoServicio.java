package co.adela.catalogo.producto;

import co.adela.catalogo.categoria.CategoriaServicio;
import co.adela.catalogo.combo.ComboRepositorio;
import co.adela.catalogo.comun.Conflicto;
import co.adela.catalogo.comun.NoEncontrado;
import co.adela.catalogo.comun.Pesos;
import co.adela.catalogo.comun.ReglaDeNegocio;
import co.adela.catalogo.comun.Slugs;
import co.adela.catalogo.producto.ProductoDtos.CambioPrecio;
import co.adela.catalogo.producto.ProductoDtos.CambioStock;
import co.adela.catalogo.producto.ProductoDtos.CambioVista;
import co.adela.catalogo.producto.ProductoDtos.ProductoAdmin;
import co.adela.catalogo.producto.ProductoDtos.ProductoEntrada;
import co.adela.catalogo.seguridad.Usuario;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Las reglas del catálogo. Los controladores solo reciben y devuelven; todo lo
 * que el negocio permite o no se decide aquí.
 */
@Service
public class ProductoServicio {

  private final ProductoRepositorio repo;
  private final CambioProductoRepositorio cambios;
  private final CategoriaServicio categorias;
  private final ComboRepositorio combos;

  public ProductoServicio(ProductoRepositorio repo, CambioProductoRepositorio cambios,
      CategoriaServicio categorias, ComboRepositorio combos) {
    this.repo = repo;
    this.cambios = cambios;
    this.categorias = categorias;
    this.combos = combos;
  }

  @Transactional(readOnly = true)
  public List<ProductoAdmin> todos() {
    return repo.todos().stream().map(ProductoAdmin::de).toList();
  }

  @Transactional(readOnly = true)
  public ProductoAdmin ver(long id) {
    return ProductoAdmin.de(buscar(id));
  }

  Producto buscar(long id) {
    return repo.findById(id).orElseThrow(() -> new NoEncontrado("Ese producto no existe."));
  }

  @Transactional
  public ProductoAdmin crear(ProductoEntrada e) {
    String base = e.presentacion() == null ? e.nombre() : e.nombre() + " " + e.presentacion();
    Producto p = new Producto(Slugs.unico(base, repo::existsBySlug), e.nombre().trim(),
        categorias.buscar(e.categoriaId()));
    aplicar(p, e);
    validar(p);
    repo.save(p);
    anotar(p, "creado", null, p.getNombre());
    return ProductoAdmin.de(p);
  }

  @Transactional
  public ProductoAdmin editar(long id, ProductoEntrada e) {
    Producto p = buscar(id);
    exigirVersion(p, e.version());
    Map<String, String> antes = foto(p);
    p.setNombre(e.nombre().trim());
    p.setCategoria(categorias.buscar(e.categoriaId()));
    aplicar(p, e);
    validar(p);
    anotarDiferencias(p, antes);
    return ProductoAdmin.de(repo.saveAndFlush(p));
  }

  /** Lo que más se usa en la tienda: sumar o restar del stock sin abrir el producto. */
  @Transactional
  public ProductoAdmin cambiarStock(long id, CambioStock c) {
    Producto p = buscar(id);
    Integer antes = p.getStock();
    Integer nuevo;
    if (c.sinControl()) {
      nuevo = null;
    } else if (c.valor() != null) {
      nuevo = c.valor();
    } else if (c.delta() != null) {
      int base = antes == null ? 0 : antes;
      nuevo = base + c.delta();
      if (nuevo < 0) throw new ReglaDeNegocio("No hay tantas unidades para restar: quedan " + base + ".");
    } else {
      throw new ReglaDeNegocio("Manda cuánto sumar o restar (delta) o el número exacto (valor).");
    }
    p.setStock(nuevo);
    anotar(p, "stock", texto(antes), texto(nuevo));
    return ProductoAdmin.de(repo.saveAndFlush(p));
  }

  @Transactional
  public ProductoAdmin cambiarPrecio(long id, CambioPrecio c) {
    Producto p = buscar(id);
    Map<String, String> antes = foto(p);
    p.setPrecio(c.precio());
    p.setPrecioAntes(c.precioAntes());
    validar(p);
    anotarDiferencias(p, antes);
    return ProductoAdmin.de(repo.saveAndFlush(p));
  }

  @Transactional
  public ProductoAdmin cambiarPublicado(long id, boolean publicado) {
    Producto p = buscar(id);
    boolean antes = p.isPublicado();
    p.setPublicado(publicado);
    validar(p);
    if (antes != publicado) anotar(p, "publicado", si(antes), si(publicado));
    return ProductoAdmin.de(repo.saveAndFlush(p));
  }

  @Transactional
  public ProductoAdmin cambiarFoto(long id, String fotoUrl) {
    Producto p = buscar(id);
    String antes = p.getFotoUrl();
    p.setFotoUrl(fotoUrl == null || fotoUrl.isBlank() ? null : fotoUrl);
    if (!Objects.equals(antes, p.getFotoUrl())) anotar(p, "foto", antes == null ? "sin foto" : "otra", p.getFotoUrl() == null ? "sin foto" : "nueva");
    return ProductoAdmin.de(repo.saveAndFlush(p));
  }

  @Transactional
  public ProductoAdmin cambiarRelacionados(long id, List<Long> ids) {
    Producto p = buscar(id);
    List<Long> unicos = new ArrayList<>(new LinkedHashSet<>(ids));
    if (unicos.contains(id)) throw new ReglaDeNegocio("Un producto no puede ir bien consigo mismo.");
    if (unicos.size() > 3) throw new ReglaDeNegocio("Máximo tres productos en «Va bien con…».");
    Map<Long, Producto> encontrados = repo.porIds(unicos).stream()
        .collect(Collectors.toMap(Producto::getId, Function.identity()));
    p.getRelacionados().clear();
    for (Long r : unicos) {
      Producto rel = encontrados.get(r);
      if (rel == null) throw new NoEncontrado("El producto " + r + " no existe.");
      p.getRelacionados().add(rel);
    }
    return ProductoAdmin.de(repo.saveAndFlush(p));
  }

  @Transactional
  public void borrar(long id) {
    Producto p = buscar(id);
    if (combos.usaProducto(id)) {
      throw new Conflicto("«" + p.getNombre() + "» está en un combo. Sácalo del combo primero, o mejor ocúltalo.");
    }
    repo.delete(p);
  }

  @Transactional(readOnly = true)
  public List<CambioVista> historial(long id) {
    buscar(id);
    return cambios.findByProductoIdOrderByCuandoDescIdDesc(id, Limit.of(50)).stream().map(CambioVista::de).toList();
  }

  // --- Reglas -----------------------------------------------------------

  /** Lo que el negocio no deja guardar, con el mensaje para la pantalla. */
  static void validar(Producto p) {
    if (p.isPublicado() && p.getPrecio() <= 0) {
      throw new ReglaDeNegocio("Ponle precio a «" + p.getNombre() + "» antes de publicarlo.");
    }
    if (p.getPrecioAntes() != null && p.getPrecioAntes() <= p.getPrecio()) {
      throw new ReglaDeNegocio("El precio de antes (" + Pesos.de(p.getPrecioAntes())
          + ") tiene que ser mayor que el de ahora (" + Pesos.de(p.getPrecio()) + ") para que se vea como oferta.");
    }
  }

  private static void exigirVersion(Producto p, Long version) {
    if (version != null && version != p.getVersion()) {
      throw new Conflicto("Alguien cambió «" + p.getNombre() + "» mientras lo editabas. Recarga y vuelve a intentar.");
    }
  }

  private static void aplicar(Producto p, ProductoEntrada e) {
    p.setPresentacion(limpio(e.presentacion()));
    p.setDescripcion(limpio(e.descripcion()));
    p.setPrecio(e.precio());
    p.setPrecioAntes(e.precioAntes());
    p.setStock(e.stock());
    p.setFotoUrl(limpio(e.fotoUrl()));
    p.setGrados(e.grados());
    p.setOrigen(limpio(e.origen()));
    p.setPublicado(e.publicado());
    p.setDestacado(e.destacado());
    if (e.orden() != null) p.setOrden(e.orden());
  }

  // --- Historial --------------------------------------------------------

  /** Los campos que vale la pena seguir, en texto, para comparar antes y después. */
  private static Map<String, String> foto(Producto p) {
    var m = new java.util.LinkedHashMap<String, String>();
    m.put("nombre", p.getNombre());
    m.put("precio", Pesos.de(p.getPrecio()));
    m.put("precio de antes", p.getPrecioAntes() == null ? "—" : Pesos.de(p.getPrecioAntes()));
    m.put("stock", texto(p.getStock()));
    m.put("publicado", si(p.isPublicado()));
    m.put("categoría", p.getCategoria().getNombre());
    return m;
  }

  private void anotarDiferencias(Producto p, Map<String, String> antes) {
    foto(p).forEach((campo, ahora) -> {
      String era = antes.get(campo);
      if (!Objects.equals(era, ahora)) anotar(p, campo, era, ahora);
    });
  }

  private void anotar(Producto p, String campo, String antes, String despues) {
    cambios.save(new CambioProducto(p.getId(), campo, antes, despues, Usuario.actual()));
  }

  private static String texto(Integer stock) {
    return stock == null ? "sin control" : stock.toString();
  }

  private static String si(boolean b) {
    return b ? "sí" : "no";
  }

  private static String limpio(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}
