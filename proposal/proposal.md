# Propuesta TP DSW

## Grupo
### Integrantes
*53169 - Navos, Juan Ignacio.
*52238 - Crocenzi, Mateo Santiago.

### Repositorios
* [fullstack app](https://github.com/juaninavos/Navos_Crocenzi-COM-305)

## Tema
### Descripción
Marketplace digital de venta de camisetas de fútbol retro donde usuarios actúan como compradores y vendedores. Los usuarios pueden publicar sus camisetas con precio fijo o subasta, comprar camisetas de otros usuarios y participar en ofertas. El administrador gestiona la plataforma, crea promociones y supervisa transacciones. El sistema incluye búsquedas avanzadas, filtros, sistema de ofertas competitivas y procesamiento de pagos.

**Tipos de usuarios:**
- **Usuario común:** Puede comprar y vender camisetas, participar en subastas, gestionar su perfil y historial de transacciones.
- **Administrador:** Puede hacer todo lo anterior y además gestionar usuarios, ver estadísticas, crear descuentos y categorías, generar reportes y supervisar la plataforma completa.

### Modelo
[![imagen del modelo]()]
https://drive.google.com/drive/folders/1uHB4GVj3cE49v5StdFB6z5nS-QJeoHe6?usp=sharing



## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Categoria<br>2. CRUD Usuario|
|CRUD dependiente|1. CRUD Camiseta {depende de} CRUD Categoria y CRUD Usuario|
|Listado<br>+<br>detalle| 1. Listado de camisetas filtrado por equipo, temporada y talle, muestra título, equipo, precio y estado => detalle CRUD Camiseta con información completa incluyendo vendedor y categoría|
|CUU/Epic|1. Publicar una camiseta para la venta con opción de precio fijo o subasta|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Categoria<br>2. CRUD Usuario<br>3. CRUD Camiseta<br>4. CRUD Descuento<br>5. CRUD Subasta<br>6. CRUD Oferta<br>7. CRUD Compra|
|CUU/Epic|1. Publicar una camiseta para la venta con opción de precio fijo o subasta<br>2. Realizar ofertas en subastas de camisetas<br>3. Procesar compra de camiseta con aplicación de descuentos|


### Alcance Adicional Voluntario

*Nota*: El Alcance Adicional Voluntario es opcional, pero ayuda a que la funcionalidad del sistema esté completa y será considerado en la nota en función de su complejidad y esfuerzo.

|Req|Detalle|
|:-|:-|
|Listados |1. Historial de compras por usuario mostrando camisetas adquiridas, fechas y montos <br>2. Ranking de camisetas más vendidas filtrado por categoría y período|
|CUU/Epic|1. Sistema de notificaciones por email para ofertas ganadoras en subastas<br>2. Gestión de métodos de pago y procesamiento de pagos|
|Otros|1. Sistema de valoraciones y comentarios en camisetas<br>2. Recomendaciones basadas en historial de compras|

