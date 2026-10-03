-- Lo que trae la tienda el primer día.
--
-- Todos los productos quedan OCULTOS y en $ 0: el negocio les pone precio,
-- stock y foto desde la administración, y los publica cuando estén listos.
-- Sin cigarrillos: la Ley 1335 de 2009 prohíbe promocionarlos en cualquier medio.

INSERT INTO categoria (slug, nombre, icono, orden, es_licor, descripcion) VALUES
  ('aguardiente',      'Aguardiente',           'botella-azul',   10, TRUE,  'Aguardiente con domicilio en San Inés Sur, Bogotá: Antioqueño, Néctar y más, en botella y media.'),
  ('ron',              'Ron',                   'botella-ambar',  20, TRUE,  'Ron Viejo de Caldas, Medellín y otros, con domicilio en el sur oriente de Bogotá.'),
  ('whisky',           'Whisky',                'botella-whisky', 30, TRUE,  'Whisky para regalar y para la fiesta, con domicilio en San Inés Sur, Bogotá.'),
  ('vinos',            'Vinos y espumosos',     'vino',           40, TRUE,  'Vino tinto, blanco y espumoso para la cena de Navidad y Año Nuevo.'),
  ('cervezas',         'Cervezas',              'lata',           50, TRUE,  'Cerveza fría en lata y botella, por unidad y en six pack.'),
  ('otros-licores',    'Otros licores',         'licor-crema',    60, TRUE,  'Tequila, vodka, cremas de whisky y sabajón.'),
  ('gaseosas',         'Gaseosas y mezcladores','gaseosa',        70, FALSE, 'Gaseosas, soda, ginger y agua para acompañar.'),
  ('hielo',            'Hielo',                 'hielo',          80, FALSE, 'Hielo en bolsa para la fiesta.'),
  ('navidad',          'Navidad',               'bunuelo',        90, FALSE, 'Todo para la novena: natilla, buñuelos, galletas y velitas.'),
  ('mecato',           'Mecato',                'bolsa',         100, FALSE, 'Papas, maní, platanitos y pasabocas.'),
  ('desechables',      'Desechables',           'vaso',          110, FALSE, 'Vasos, platos y servilletas para la reunión.');

INSERT INTO producto (slug, nombre, presentacion, categoria_id, orden, destacado)
SELECT p.slug, p.nombre, p.presentacion, c.id, p.orden, p.destacado
FROM (VALUES
  ('aguardiente-antioqueno-sin-azucar-750',  'Aguardiente Antioqueño sin azúcar',   'Botella 750 ml',             'aguardiente',   10, TRUE),
  ('aguardiente-antioqueno-sin-azucar-375',  'Aguardiente Antioqueño sin azúcar',   'Media 375 ml',               'aguardiente',   20, FALSE),
  ('aguardiente-antioqueno-tradicional-750', 'Aguardiente Antioqueño tradicional',  'Botella 750 ml',             'aguardiente',   30, FALSE),
  ('aguardiente-nectar-750',                 'Aguardiente Néctar',                  'Botella 750 ml',             'aguardiente',   40, FALSE),
  ('aguardiente-amarillo-de-manzanares-750', 'Aguardiente Amarillo de Manzanares',  'Botella 750 ml',             'aguardiente',   50, FALSE),
  ('ron-viejo-de-caldas-3-anos-750',         'Ron Viejo de Caldas 3 años',          'Botella 750 ml',             'ron',           10, TRUE),
  ('ron-viejo-de-caldas-3-anos-375',         'Ron Viejo de Caldas 3 años',          'Media 375 ml',               'ron',           20, FALSE),
  ('ron-medellin-anejo-3-anos-750',          'Ron Medellín añejo 3 años',           'Botella 750 ml',             'ron',           30, FALSE),
  ('whisky-old-parr-12-anos-750',            'Whisky Old Parr 12 años',             'Botella 750 ml',             'whisky',        10, TRUE),
  ('whisky-buchanans-deluxe-12-anos-750',    'Whisky Buchanan''s Deluxe 12 años',   'Botella 750 ml',             'whisky',        20, FALSE),
  ('whisky-johnnie-walker-red-label-700',    'Whisky Johnnie Walker Red Label',     'Botella 700 ml',             'whisky',        30, FALSE),
  ('vino-tinto-gato-negro-750',              'Vino tinto Gato Negro',               'Botella 750 ml',             'vinos',         10, FALSE),
  ('vino-tinto-casillero-del-diablo-750',    'Vino tinto Casillero del Diablo',     'Botella 750 ml',             'vinos',         20, FALSE),
  ('vino-espumoso-750',                      'Vino espumoso',                       'Botella 750 ml',             'vinos',         30, FALSE),
  ('cerveza-aguila-lata-six-pack',           'Cerveza Águila',                      'Six pack · lata 330 ml',     'cervezas',      10, TRUE),
  ('cerveza-poker-lata-six-pack',            'Cerveza Poker',                       'Six pack · lata 330 ml',     'cervezas',      20, FALSE),
  ('cerveza-club-colombia-dorada-six-pack',  'Cerveza Club Colombia Dorada',        'Six pack · lata 330 ml',     'cervezas',      30, FALSE),
  ('cerveza-corona-six-pack',                'Cerveza Corona',                      'Six pack · botella 355 ml',  'cervezas',      40, FALSE),
  ('tequila-jose-cuervo-especial-750',       'Tequila José Cuervo Especial',        'Botella 750 ml',             'otros-licores', 10, FALSE),
  ('vodka-smirnoff-700',                     'Vodka Smirnoff',                      'Botella 700 ml',             'otros-licores', 20, FALSE),
  ('crema-de-whisky-baileys-750',            'Crema de whisky Baileys',             'Botella 750 ml',             'otros-licores', 30, FALSE),
  ('sabajon-750',                            'Sabajón',                             'Botella 750 ml',             'otros-licores', 40, TRUE),
  ('gaseosa-coca-cola-1-5-l',                'Gaseosa Coca-Cola',                   'Botella 1,5 L',              'gaseosas',      10, FALSE),
  ('ginger-ale-1-5-l',                       'Ginger ale',                          'Botella 1,5 L',              'gaseosas',      20, FALSE),
  ('soda-1-5-l',                             'Soda',                                'Botella 1,5 L',              'gaseosas',      30, FALSE),
  ('agua-600-ml',                            'Agua',                                'Botella 600 ml',             'gaseosas',      40, FALSE),
  ('hielo-2-kg',                             'Hielo',                               'Bolsa 2 kg',                 'hielo',         10, TRUE),
  ('hielo-5-kg',                             'Hielo',                               'Bolsa 5 kg',                 'hielo',         20, FALSE),
  ('natilla-mezcla',                         'Natilla',                             'Caja de mezcla',             'navidad',       10, TRUE),
  ('bunuelos-mezcla',                        'Mezcla para buñuelos',                'Bolsa',                      'navidad',       20, FALSE),
  ('galletas-surtidas-lata',                 'Galletas surtidas',                   'Lata',                       'navidad',       30, FALSE),
  ('velitas-7-de-diciembre',                 'Velitas para el 7 de diciembre',      'Paquete',                    'navidad',       40, FALSE),
  ('papas-fritas-grandes',                   'Papas fritas',                        'Bolsa grande',               'mecato',        10, FALSE),
  ('mani-salado',                            'Maní salado',                         'Bolsa',                      'mecato',        20, FALSE),
  ('platanitos',                             'Platanitos',                          'Bolsa',                      'mecato',        30, FALSE),
  ('vasos-desechables-x50',                  'Vasos desechables',                   'Paquete x 50',               'desechables',   10, FALSE),
  ('platos-desechables-x20',                 'Platos desechables',                  'Paquete x 20',               'desechables',   20, FALSE),
  ('servilletas',                            'Servilletas',                         'Paquete',                    'desechables',   30, FALSE)
) AS p (slug, nombre, presentacion, categoria, orden, destacado)
JOIN categoria c ON c.slug = p.categoria;

-- «Va bien con…» para los que más se venden. El orden arranca en 0 (así lo
-- espera @OrderColumn en la entidad Producto).
INSERT INTO producto_relacionado (producto_id, relacionado_id, orden)
SELECT a.id, b.id, r.orden
FROM (VALUES
  ('aguardiente-antioqueno-sin-azucar-750', 'hielo-2-kg',              0),
  ('aguardiente-antioqueno-sin-azucar-750', 'gaseosa-coca-cola-1-5-l', 1),
  ('aguardiente-antioqueno-sin-azucar-750', 'vasos-desechables-x50',   2),
  ('ron-viejo-de-caldas-3-anos-750',        'gaseosa-coca-cola-1-5-l', 0),
  ('ron-viejo-de-caldas-3-anos-750',        'hielo-2-kg',              1),
  ('whisky-old-parr-12-anos-750',           'soda-1-5-l',              0),
  ('whisky-old-parr-12-anos-750',           'hielo-2-kg',              1),
  ('natilla-mezcla',                        'bunuelos-mezcla',         0)
) AS r (producto, relacionado, orden)
JOIN producto a ON a.slug = r.producto
JOIN producto b ON b.slug = r.relacionado;

-- El combo de ejemplo: oculto y sin precio, como los productos.
INSERT INTO combo (slug, nombre, descripcion, de_la_semana)
VALUES ('combo-novena', 'Combo novena', 'Aguardiente, hielo y gaseosa para la novena.', TRUE);

INSERT INTO combo_item (combo_id, producto_id, cantidad)
SELECT c.id, p.id, 1
FROM combo c, producto p
WHERE c.slug = 'combo-novena'
  AND p.slug IN ('aguardiente-antioqueno-sin-azucar-750', 'hielo-2-kg', 'gaseosa-coca-cola-1-5-l');

INSERT INTO tienda (nombre, whatsapp, direccion, barrio, ciudad, abre, cierra, nota_horario,
                    temporada, banner_titulo, banner_texto, banner_sello)
VALUES ('Supermercado Adela', '573147167595', 'Calle 27A Sur #5-21 Este', 'San Inés Sur', 'Bogotá',
        '07:00', '22:00',
        'Pedidos grandes: escríbenos y despachamos fuera de horario. En temporada de fiestas ampliamos el horario.',
        TRUE, '¡Llegó diciembre, vecino!', 'Lo de la novena y la fiesta, con domicilio en San Inés Sur.',
        'hasta el 6 de ene.');
