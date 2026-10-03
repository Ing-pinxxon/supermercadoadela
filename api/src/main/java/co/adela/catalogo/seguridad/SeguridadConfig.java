package co.adela.catalogo.seguridad;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;

/**
 * Quién puede hacer qué:
 *
 * <ul>
 *   <li>{@code /api/v1/admin/**}: solo con la API key (las escrituras y lo oculto).
 *   <li>Todo lo demás (catálogo publicado, datos de la tienda, armar el pedido,
 *       salud, Swagger): abierto, porque es lo que ve cualquier cliente.
 * </ul>
 *
 * <p>Sin sesiones ni cookies: cada petición se autentica sola con la cabecera.
 * Por eso no hace falta protección CSRF. Tampoco se habilita CORS: un navegador
 * no puede llamar la API desde otra página; solo el servidor de Next la llama.
 */
@Configuration
public class SeguridadConfig {

  @Bean
  SecurityFilterChain cadena(HttpSecurity http, @Value("${catalogo.api-key:}") String clave,
      ObjectMapper json) throws Exception {
    return http
        .csrf(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable)
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
            .anyRequest().permitAll())
        .addFilterBefore(new FiltroApiKey(clave), AnonymousAuthenticationFilter.class)
        .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> {
          ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED,
              "Falta la API key o no es la correcta (cabecera X-Api-Key).");
          p.setTitle("Sin permiso");
          res.setStatus(HttpStatus.UNAUTHORIZED.value());
          res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
          json.writeValue(res.getOutputStream(), p);
        }))
        .build();
  }
}
