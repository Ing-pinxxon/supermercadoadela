package co.adela.catalogo.comun;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Todos los errores salen con el mismo formato (Problem Details, RFC 7807) y en
 * español, para que la página los pueda mostrar sin traducir nada:
 *
 * <pre>{"status": 422, "title": "No se puede", "detail": "Ponle precio antes de publicarlo."}</pre>
 *
 * Los de validación traen además {@code errores}: campo → mensaje.
 */
@RestControllerAdvice
public class ManejoDeErrores extends ResponseEntityExceptionHandler {

  @ExceptionHandler(NoEncontrado.class)
  ProblemDetail noEncontrado(NoEncontrado e) {
    return problema(HttpStatus.NOT_FOUND, "No encontrado", e.getMessage());
  }

  @ExceptionHandler(ReglaDeNegocio.class)
  ProblemDetail reglaDeNegocio(ReglaDeNegocio e) {
    return problema(HttpStatus.UNPROCESSABLE_ENTITY, "No se puede", e.getMessage());
  }

  @ExceptionHandler(Conflicto.class)
  ProblemDetail conflicto(Conflicto e) {
    return problema(HttpStatus.CONFLICT, "Conflicto", e.getMessage());
  }

  /** Dos personas guardaron el mismo producto casi al tiempo. */
  @ExceptionHandler(OptimisticLockingFailureException.class)
  ProblemDetail bloqueoOptimista(OptimisticLockingFailureException e) {
    return problema(HttpStatus.CONFLICT, "Conflicto",
        "Alguien cambió esto mientras lo editabas. Recarga y vuelve a intentar.");
  }

  /** Lo que la base rechaza aunque la validación lo dejara pasar (un CHECK, una llave). */
  @ExceptionHandler(DataIntegrityViolationException.class)
  ProblemDetail integridad(DataIntegrityViolationException e) {
    logger.warn("La base rechazó un cambio", e);
    return problema(HttpStatus.CONFLICT, "Conflicto",
        "La base de datos no aceptó el cambio. Revisa que no esté repetido o en uso.");
  }

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException e, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
    Map<String, String> errores = new LinkedHashMap<>();
    e.getBindingResult().getFieldErrors()
        .forEach(f -> errores.putIfAbsent(f.getField(), f.getDefaultMessage()));
    e.getBindingResult().getGlobalErrors()
        .forEach(g -> errores.putIfAbsent(g.getObjectName(), g.getDefaultMessage()));
    ProblemDetail p = problema(HttpStatus.BAD_REQUEST, "Datos inválidos", "Revisa los datos marcados.");
    p.setProperty("errores", errores);
    return ResponseEntity.badRequest().body(p);
  }

  @Override
  protected ResponseEntity<Object> handleHttpMessageNotReadable(
      HttpMessageNotReadableException e, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
    return ResponseEntity.badRequest().body(problema(HttpStatus.BAD_REQUEST, "Datos inválidos",
        "No se entendió lo que se mandó: revisa que sea JSON y que los valores tengan el tipo correcto."));
  }

  private static ProblemDetail problema(HttpStatus estado, String titulo, String detalle) {
    ProblemDetail p = ProblemDetail.forStatusAndDetail(estado, detalle);
    p.setTitle(titulo);
    return p;
  }
}
