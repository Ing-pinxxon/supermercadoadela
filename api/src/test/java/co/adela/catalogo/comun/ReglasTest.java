package co.adela.catalogo.comun;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Pruebas de unidad: sin Spring, sin base de datos. Corren en milisegundos. */
class ReglasTest {

  @ParameterizedTest(name = "stock {0} → {1}")
  @CsvSource(nullValues = "null", value = {
      "null, DISPONIBLE",
      "0,    AGOTADO",
      "1,    ULTIMAS",
      "5,    ULTIMAS",
      "6,    DISPONIBLE",
  })
  void disponibilidad(Integer stock, Disponibilidad esperada) {
    assertThat(Disponibilidad.de(stock)).isEqualTo(esperada);
  }

  @Test
  void laPeorDisponibilidadGana() {
    assertThat(Disponibilidad.DISPONIBLE.peor(Disponibilidad.ULTIMAS)).isEqualTo(Disponibilidad.ULTIMAS);
    assertThat(Disponibilidad.AGOTADO.peor(Disponibilidad.ULTIMAS)).isEqualTo(Disponibilidad.AGOTADO);
  }

  @Test
  void slugSinTildesNiEñes() {
    assertThat(Slugs.de("Ron Viejo de Caldas 3 años")).isEqualTo("ron-viejo-de-caldas-3-anos");
    assertThat(Slugs.de("  Buñuelos & Natilla!! ")).isEqualTo("bunuelos-natilla");
    assertThat(Slugs.de("Buchanan's Deluxe")).isEqualTo("buchanan-s-deluxe");
  }

  @Test
  void slugUnicoAgregaNumero() {
    Set<String> tomados = Set.of("sabajon", "sabajon-2");
    assertThat(Slugs.unico("Sabajón", tomados::contains)).isEqualTo("sabajon-3");
    assertThat(Slugs.unico("¡¡!!", s -> false)).isEqualTo("producto");
  }

  @Test
  void pesosConPuntoDeMiles() {
    assertThat(Pesos.de(0)).isEqualTo("$ 0");
    assertThat(Pesos.de(4000)).isEqualTo("$ 4.000");
    assertThat(Pesos.de(1230000)).isEqualTo("$ 1.230.000");
    assertThat(Pesos.de(-20000)).isEqualTo("-$ 20.000");
  }

  @Test
  void laCadenaDeNeonSeVuelveJdbc() {
    var props = UrlDeNeon.convertir(
        "postgresql://adela:cl%40ve@ep-algo-123-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
    assertThat(props.get("spring.datasource.url"))
        .isEqualTo("jdbc:postgresql://ep-algo-123.us-east-2.aws.neon.tech/neondb?sslmode=require");
    assertThat(props.get("spring.datasource.username")).isEqualTo("adela");
    assertThat(props.get("spring.datasource.password")).isEqualTo("cl@ve");
  }

  @Test
  void sinSslmodeSeAgrega() {
    var props = UrlDeNeon.convertir("postgres://u:p@localhost:5433/adela");
    assertThat(props.get("spring.datasource.url")).isEqualTo("jdbc:postgresql://localhost:5433/adela?sslmode=require");
  }
}
