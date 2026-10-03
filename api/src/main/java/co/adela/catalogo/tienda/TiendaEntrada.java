package co.adela.catalogo.tienda;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Lo que se guarda desde «Datos de la tienda». */
public record TiendaEntrada(
    @NotBlank(message = "Escribe el nombre del negocio.") @Size(max = 80) String nombre,
    @NotBlank(message = "Escribe el número de WhatsApp.")
    @Pattern(regexp = "[+\\d\\s()-]{10,20}", message = "Escribe el número con sus 10 dígitos, por ejemplo 314 716 7595.")
    String whatsapp,
    @NotBlank(message = "Escribe la dirección.") @Size(max = 120) String direccion,
    @Size(max = 80) String barrio,
    @NotBlank(message = "Escribe la ciudad.") @Size(max = 60) String ciudad,
    @NotBlank @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "Escribe la hora como 07:00.") String abre,
    @NotBlank @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "Escribe la hora como 22:00.") String cierra,
    @Size(max = 300) String notaHorario,
    @Size(max = 500) @Pattern(regexp = "^$|https://.+", message = "El enlace de Maps tiene que empezar por https://.") String mapsUrl,
    @PositiveOrZero(message = "El domicilio no puede ser negativo.") Integer valorDomicilio,
    boolean aceptaTransferencia,
    boolean temporada,
    @Size(max = 60) String bannerTitulo,
    @Size(max = 140) String bannerTexto,
    @Size(max = 30) String bannerSello,
    @Size(max = 100) @Pattern(regexp = "^$|[A-Za-z0-9_-]+", message = "Pega solo el código que va en content=\"…\".") String googleVerificacion,
    Long version) {}
