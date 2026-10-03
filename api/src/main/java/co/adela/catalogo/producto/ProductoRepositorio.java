package co.adela.catalogo.producto;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProductoRepositorio extends JpaRepository<Producto, Long> {

  /** Todo lo que ve el cliente, en el orden de los estantes. Un solo viaje a la base. */
  @Query("""
      select p from Producto p join fetch p.categoria c
      where p.publicado = true and c.visible = true
      order by c.orden, p.orden, p.nombre, p.id
      """)
  List<Producto> publicados();

  /** Para la administración: todo, también lo oculto. */
  @Query("select p from Producto p join fetch p.categoria c order by c.orden, p.orden, p.nombre, p.id")
  List<Producto> todos();

  @Query("select p from Producto p join fetch p.categoria where p.slug = :slug")
  Optional<Producto> porSlug(String slug);

  @Query("select p from Producto p join fetch p.categoria where p.id in :ids")
  List<Producto> porIds(Collection<Long> ids);

  boolean existsBySlug(String slug);

  long countByCategoriaId(Long categoriaId);
}
