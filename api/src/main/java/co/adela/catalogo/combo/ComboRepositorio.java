package co.adela.catalogo.combo;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ComboRepositorio extends JpaRepository<Combo, Long> {

  /** El EntityGraph trae los ítems con su producto y categoría en la misma consulta. */
  @EntityGraph(attributePaths = {"items", "items.producto", "items.producto.categoria"})
  @Query("select c from Combo c where c.publicado = true order by c.deLaSemana desc, c.nombre")
  List<Combo> publicados();

  @EntityGraph(attributePaths = {"items", "items.producto", "items.producto.categoria"})
  @Query("select c from Combo c order by c.deLaSemana desc, c.nombre")
  List<Combo> todos();

  @EntityGraph(attributePaths = {"items", "items.producto", "items.producto.categoria"})
  @Query("select c from Combo c where c.id in :ids")
  List<Combo> porIds(Collection<Long> ids);

  boolean existsBySlug(String slug);

  /** Solo puede haber un «combo de la semana». */
  @Modifying
  @Query("update Combo c set c.deLaSemana = false where c.deLaSemana = true and c.id <> :id")
  void quitarDeLaSemanaMenos(Long id);

  @Query(value = "select count(*) > 0 from catalogo.combo_item where producto_id = :productoId", nativeQuery = true)
  boolean usaProducto(Long productoId);
}
