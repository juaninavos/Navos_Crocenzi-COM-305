# 🏪 Tienda Retro - Camisetas de Fútbol

## 👥 Integrantes
- **Navos, Juan Ignacio** - 53169
- **Crocenzi, Mateo Santiago** - 52238

## 📝 Descripción
Emprendimiento digital de venta de camisetas de fútbol retro. El administrador del negocio puede publicar artículos para la venta, gestionar stock y ofrecer descuentos y promociones a los usuarios. Las publicaciones pueden tener dos opciones de precios: fijos o subastados.

## 🏗️ Arquitectura
- **Backend**: Node.js + TypeScript + Express + MikroORM + MySQL
- **Frontend**: Por implementar (React/Angular/Vue)
- **Base de datos**: MySQL

## 📋 Estado del Proyecto

### ✅ Completado para Regularidad
- **CRUDs Simples**: Usuario, Categoría
- **CRUD Dependiente**: Camiseta (depende de Usuario y Categoría)  
- **Listado con Filtro**: Camisetas filtrable por equipo, temporada, talle, condición
- **Caso de Uso**: Publicar camiseta para venta (precio fijo o subasta)

### 🔄 Para Aprobación
- Autenticación y autorización
- Tests automatizados
- CRUDs adicionales (Subasta, Oferta, Compra, Pago)
- Frontend completo

## 🚀 Instalación y Ejecución

### Prerequisitos
- Node.js (v18 o superior)
- MySQL (v8 o superior)
- npm o pnpm

### 1. Clonar el repositorio
```bash
git clone https://github.com/juaninavos/Navos_Crocenzi-COM-305.git
cd Navos_Crocenzi-COM-305
```

### 2. Configurar Base de Datos
```bash
# Crear base de datos en MySQL
mysql -u root -p
CREATE DATABASE tienda_retro;
exit;

# Ejecutar script de inicialización
mysql -u root -p tienda_retro < backend/database_init.sql
```

### 3. Configurar Backend
```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# Inicializar base de datos con ORM
npm run init-db

# Poblar con datos de prueba (opcional)
npm run seed-db
```

### 4. Ejecutar Backend
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm run build
npm start
```

El servidor estará disponible en: `http://localhost:3001`

## 📚 Documentación de la API

### Endpoints principales:
- `GET /api/health` - Health check
- `GET /api/usuarios` - Listar usuarios
- `GET /api/categorias` - Listar categorías  
- `GET /api/camisetas` - Listar camisetas con filtros
- `POST /api/camisetas/publicar` - Publicar camiseta (caso de uso)

Ver documentación completa: [API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

## 🧪 Testing

### Herramientas recomendadas:
- **Postman**: Colección completa de endpoints
- **Thunder Client**: Extensión de VS Code
- **curl**: Línea de comandos

### Ejemplos de uso:
```bash
# Listar todas las camisetas
curl http://localhost:3001/api/camisetas

# Filtrar por equipo
curl "http://localhost:3001/api/camisetas?equipo=Boca"

# Publicar nueva camiseta
curl -X POST http://localhost:3001/api/camisetas/publicar \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Camiseta Boca 2023","equipo":"Boca","temporada":"2023","talle":"L","condicion":"Nueva","precioInicial":12000,"vendedorId":1}'
```

## 📁 Estructura del Proyecto

```
Navos_Crocenzi-COM-305/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── entities/        # Modelos de datos (ORM)
│   │   ├── routes/          # Definición de endpoints
│   │   ├── middleware/      # Middlewares (errores, etc.)
│   │   ├── app.ts          # Configuración principal
│   │   └── mikro-orm.config.ts # Configuración DB
│   ├── scripts/            # Scripts de inicialización
│   ├── database_init.sql   # SQL de inicialización
│   ├── package.json        # Dependencias
│   └── .env               # Variables de entorno
├── frontend/              # Por implementar
├── proposal/              # Documentación del proyecto
└── README.md             # Este archivo
```

## 🛠️ Scripts Disponibles

```bash
# Backend
npm run dev         # Servidor en modo desarrollo
npm run build       # Compilar TypeScript
npm start          # Servidor en modo producción
npm run init-db    # Recrear base de datos
npm run seed-db    # Poblar con datos de prueba
```

## 🔧 Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **TypeScript** - Tipado estático
- **Express** - Framework web
- **MikroORM** - ORM para base de datos
- **MySQL** - Base de datos relacional
- **dotenv** - Variables de entorno

### Desarrollo
- **ts-node** - Ejecución directa de TypeScript
- **nodemon** - Recarga automática en desarrollo

## 📊 Base de Datos

### Entidades principales:
- **Usuario**: Información de usuarios/vendedores
- **Categoria**: Clasificación de camisetas
- **Camiseta**: Productos en venta
- **Subasta**: Subastas de camisetas (futuro)
- **Oferta**: Ofertas en subastas (futuro)
- **Compra**: Historial de compras (futuro)

## 🚧 Roadmap

### Próximas funcionalidades:
1. **Frontend** con framework moderno
2. **Autenticación** JWT
3. **Sistema de subastas** completo
4. **Proceso de compra** completo
5. **Tests automatizados**
6. **Deploy** en producción

## 🤝 Contribución

Este es un proyecto académico para la materia Desarrollo de Software (DSW).

## 📄 Licencia

Proyecto académico - UTN FRRO
