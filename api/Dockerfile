# La imagen que corre Render.
#
# Dos etapas: la primera compila con Maven (pesada, con el JDK y todas las
# dependencias); la segunda solo lleva el JRE y el .jar, así la imagen final es
# pequeña y arranca más rápido.

FROM eclipse-temurin:21-jdk AS construir
WORKDIR /app
# Primero solo el pom: si no cambian las dependencias, Docker reusa esta capa.
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY src src
# Las pruebas corren en tu máquina y en CI (necesitan Docker); aquí no.
RUN ./mvnw -q -B package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 adela
COPY --from=construir /app/target/catalogo.jar catalogo.jar
USER adela
# El plan gratis de Render da 512 MB: se le deja a Java el 75 % para el heap.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "catalogo.jar"]
