package co.adela.catalogo.seguridad;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reconoce al servidor de Next por la cabecera {@code X-Api-Key}.
 *
 * <p>Si la clave coincide, la petición queda autenticada con el rol ADMIN y el
 * nombre que diga {@code X-Usuario} («tienda» o «admin»: la clave con la que se
 * entró a la página), que es lo que queda en el historial de cambios. Si no
 * coincide, la petición sigue como anónima: lo público funciona igual y lo de
 * administración responde 401.
 *
 * <p>No es un {@code @Component} a propósito: así Spring Boot no lo registra
 * también como filtro suelto del servidor y solo corre dentro de la cadena de
 * seguridad.
 */
public class FiltroApiKey extends OncePerRequestFilter {

  static final String CABECERA = "X-Api-Key";
  static final String CABECERA_USUARIO = "X-Usuario";

  private final byte[] clave;

  public FiltroApiKey(String clave) {
    this.clave = clave == null ? new byte[0] : clave.getBytes(StandardCharsets.UTF_8);
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain cadena)
      throws ServletException, IOException {
    String enviada = req.getHeader(CABECERA);
    if (clave.length > 0 && enviada != null
        // Comparación de tiempo constante: no delata cuántos caracteres acertó.
        && MessageDigest.isEqual(clave, enviada.getBytes(StandardCharsets.UTF_8))) {
      var autenticacion = new UsernamePasswordAuthenticationToken(
          quien(req.getHeader(CABECERA_USUARIO)), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
      SecurityContextHolder.getContext().setAuthentication(autenticacion);
    }
    cadena.doFilter(req, res);
  }

  /** Solo letras minúsculas y cortas: lo que llega aquí termina guardado en la base. */
  static String quien(String cabecera) {
    if (cabecera != null && cabecera.matches("[a-z]{1,20}")) return cabecera;
    return "api";
  }
}
