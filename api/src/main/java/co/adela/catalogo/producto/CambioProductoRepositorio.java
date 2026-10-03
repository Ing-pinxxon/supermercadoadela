package co.adela.catalogo.producto;

import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CambioProductoRepositorio extends JpaRepository<CambioProducto, Long> {

  List<CambioProducto> findByProductoIdOrderByCuandoDescIdDesc(Long productoId, Limit limite);
}
