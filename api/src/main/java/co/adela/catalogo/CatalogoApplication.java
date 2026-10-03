package co.adela.catalogo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * La API del catálogo de Supermercado Adela.
 *
 * <p>La tienda en línea (Next.js en Vercel) le pide aquí los productos, los
 * combos y los datos del negocio, y le manda el carrito para armar el pedido de
 * WhatsApp. Las escrituras llegan solo desde el servidor de Next, con la API key.
 *
 * <p>Se quita el usuario de prueba que Spring Security crea por defecto: aquí no
 * hay usuarios ni contraseñas, solo la API key (ver {@code seguridad}).
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class CatalogoApplication {

  public static void main(String[] args) {
    SpringApplication.run(CatalogoApplication.class, args);
  }
}
