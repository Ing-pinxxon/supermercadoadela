package co.adela.catalogo.seguridad;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Quién está haciendo el cambio, para el historial. */
public final class Usuario {

  private Usuario() {}

  public static String actual() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    return a == null || a.getName() == null ? "api" : a.getName();
  }
}
