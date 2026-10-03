package co.adela.catalogo.comun;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Deja pegar en {@code DATABASE_URL} la cadena de Neon tal como la da Neon
 * ({@code postgresql://usuario:clave@host/base?sslmode=require}), la misma que
 * usa la app de Next, y la convierte al formato JDBC que necesita Java.
 *
 * <p>Además usa el host directo y no el «-pooler»: Flyway toma un candado de
 * sesión para migrar, y el pooler de Neon (PgBouncer en modo transacción) no
 * garantiza que la sesión sea la misma de una consulta a otra.
 *
 * <p>Corre antes de que Spring arme la conexión; se registra en
 * {@code META-INF/spring.factories}.
 */
public class UrlDeNeon implements EnvironmentPostProcessor, Ordered {

  @Override
  public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication app) {
    String cruda = env.getProperty("DATABASE_URL");
    if (cruda == null || !(cruda.startsWith("postgres://") || cruda.startsWith("postgresql://"))) {
      return; // ya viene en formato JDBC, o no hay: se usa tal cual
    }
    Map<String, Object> props = convertir(cruda);
    env.getPropertySources().addFirst(new MapPropertySource("urlDeNeon", props));
  }

  /** Separado para poder probarlo sin levantar Spring. */
  static Map<String, Object> convertir(String cruda) {
    URI uri = URI.create(cruda);
    String host = uri.getHost().replace("-pooler.", ".");
    String puerto = uri.getPort() > 0 ? ":" + uri.getPort() : "";
    String parametros = uri.getRawQuery() == null ? "" : Arrays.stream(uri.getRawQuery().split("&"))
        // channel_binding es de libpq; el driver de Java no lo usa con ese nombre.
        .filter(p -> !p.startsWith("channel_binding="))
        .collect(Collectors.joining("&"));
    if (!parametros.contains("sslmode=")) {
      parametros = parametros.isEmpty() ? "sslmode=require" : parametros + "&sslmode=require";
    }

    Map<String, Object> props = new HashMap<>();
    props.put("spring.datasource.url", "jdbc:postgresql://" + host + puerto + uri.getRawPath() + "?" + parametros);
    String usuario = uri.getRawUserInfo();
    if (usuario != null) {
      String[] partes = usuario.split(":", 2);
      props.put("spring.datasource.username", URLDecoder.decode(partes[0], StandardCharsets.UTF_8));
      if (partes.length > 1) {
        props.put("spring.datasource.password", URLDecoder.decode(partes[1], StandardCharsets.UTF_8));
      }
    }
    return props;
  }

  @Override
  public int getOrder() {
    return Ordered.LOWEST_PRECEDENCE;
  }
}
