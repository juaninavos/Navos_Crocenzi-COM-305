-- Script para crear las tablas de la tienda retro
-- Ejecutar este script en MySQL después de crear la base de datos

USE tienda_retro;

-- Tabla Usuario
CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    email_normalized VARCHAR(150) UNIQUE NOT NULL,  -- ✅ AGREGAR ESTA LÍNEA
    contrasena VARCHAR(255) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    rol ENUM('usuario', 'administrador') DEFAULT 'usuario',
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_normalized (email_normalized)  -- ✅ AGREGAR ÍNDICE
);

-- Tabla Categoria
CREATE TABLE IF NOT EXISTS categoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true
);

-- Tabla Camiseta
CREATE TABLE IF NOT EXISTS camiseta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    equipo VARCHAR(100) NOT NULL,
    temporada VARCHAR(20) NOT NULL,
    talle VARCHAR(10) NOT NULL,
    condicion ENUM('Nueva', 'Usada', 'Vintage') NOT NULL,
    imagen VARCHAR(255),
    precio_inicial DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 1,
    es_subasta BOOLEAN DEFAULT false,
    estado ENUM('disponible', 'vendida', 'en_subasta', 'inactiva') DEFAULT 'disponible',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- ✅ ESTA LÍNEA
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendedor_id INT NOT NULL,
    categoria_id INT,
    FOREIGN KEY (vendedor_id) REFERENCES usuario(id),
    FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);

-- Tabla Subasta
CREATE TABLE IF NOT EXISTS subasta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    precio_actual DECIMAL(10,2) NOT NULL,
    activa BOOLEAN DEFAULT true,
    camiseta_id INT NOT NULL,
    ganador_id INT,
    FOREIGN KEY (camiseta_id) REFERENCES camiseta(id),
    FOREIGN KEY (ganador_id) REFERENCES usuario(id)
);

-- Tabla Oferta
CREATE TABLE IF NOT EXISTS oferta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    monto DECIMAL(10,2) NOT NULL,
    fecha_oferta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT true,
    subasta_id INT NOT NULL,
    usuario_id INT NOT NULL,
    FOREIGN KEY (subasta_id) REFERENCES subasta(id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Tabla MetodoPago
CREATE TABLE IF NOT EXISTS metodo_pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- Tabla Compra
CREATE TABLE IF NOT EXISTS compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total DECIMAL(10,2) NOT NULL,  -- ✅ CAMBIAR de precio_final a total
    cantidad INT DEFAULT 1,
    estado ENUM('pendiente', 'confirmada', 'pagada', 'enviada', 'entregada', 'cancelada') DEFAULT 'pendiente',  -- ✅ AJUSTAR
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    direccion_envio TEXT,  -- ✅ AGREGAR
    notas TEXT,  -- ✅ AGREGAR
    camiseta_id INT NOT NULL,
    comprador_id INT NOT NULL,  -- ✅ Cambiar de comprador_id a mantener consistencia
    metodo_pago_id INT NOT NULL,  -- ✅ AGREGAR
    FOREIGN KEY (camiseta_id) REFERENCES camiseta(id),
    FOREIGN KEY (comprador_id) REFERENCES usuario(id),
    FOREIGN KEY (metodo_pago_id) REFERENCES metodo_pago(id)  -- ✅ AGREGAR FK
);

-- Tabla CompraItem
CREATE TABLE IF NOT EXISTS compra_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    camiseta_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES compra(id) ON DELETE CASCADE,
    FOREIGN KEY (camiseta_id) REFERENCES camiseta(id) ON DELETE RESTRICT,
    INDEX idx_compra_item_compra (compra_id),
    INDEX idx_compra_item_camiseta (camiseta_id)
);

-- Tabla Pago
CREATE TABLE IF NOT EXISTS pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    monto DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'procesando', 'completado', 'fallido', 'cancelado') DEFAULT 'pendiente',  -- ✅ AJUSTAR
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    numero_transaccion VARCHAR(255),  -- ✅ CAMBIAR de transaccion_id
    notas TEXT,  -- ✅ CAMBIAR de detalles
    compra_id INT NOT NULL,
    metodo_pago_id INT NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compra(id),
    FOREIGN KEY (metodo_pago_id) REFERENCES metodo_pago(id)
);

-- Tabla Descuento
CREATE TABLE IF NOT EXISTS descuento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    porcentaje DECIMAL(5,2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    usos_maximos INT,
    usos_actuales INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_descuento_fechas CHECK (fecha_fin > fecha_inicio),
    INDEX idx_descuento_codigo (codigo),
    INDEX idx_descuento_activo (activo)
);

-- Insertar datos iniciales

-- Categorías iniciales
INSERT INTO categoria (nombre, descripcion) VALUES
('Clubes Argentinos', 'Camisetas de clubes de fútbol argentino'),
('Selección Argentina', 'Camisetas de la selección nacional argentina'),
('Clubes Europeos', 'Camisetas de clubes europeos'),
('Selecciones Internacionales', 'Camisetas de selecciones de otros países'),
('Clásicas', 'Camisetas retro y vintage');

-- Métodos de pago iniciales
INSERT INTO metodo_pago (nombre, descripcion) VALUES
('Tarjeta de Crédito', 'Pago con tarjeta de crédito VISA, MasterCard, etc.'),
('Tarjeta de Débito', 'Pago con tarjeta de débito'),
('Transferencia Bancaria', 'Pago por transferencia bancaria'),
('MercadoPago', 'Pago a través de MercadoPago'),
('Efectivo', 'Pago en efectivo al momento de la entrega');

-- Usuario administrador inicial (contraseña: admin123)
INSERT INTO usuario (nombre, apellido, email, contrasena, direccion, telefono, rol) VALUES
('Admin', 'Sistema', 'admin@tiendaretro.com', '$2b$10$hash_aqui', 'Dirección Admin', '1234567890', 'administrador');

SELECT 'Base de datos inicializada correctamente' as mensaje;
