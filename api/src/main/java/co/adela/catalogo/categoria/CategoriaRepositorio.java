package co.adela.catalogo.categoria;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data arma las consultas a partir del nombre de cada método. */
public interface CategoriaRepositorio extends JpaRepository<Categoria, Long> {

  List<Categoria> findAllByOrderByOrdenAscNombreAsc();

  List<Categoria> findByVisibleTrueOrderByOrdenAscNombreAsc();

  Optional<Categoria> findBySlug(String slug);

  boolean existsBySlug(String slug);
}
