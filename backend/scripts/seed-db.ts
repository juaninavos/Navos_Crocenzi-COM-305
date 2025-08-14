// scripts/seed-db.ts
import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import config from '../src/mikro-orm.config';
import { Usuario, UsuarioRol } from '../src/entities/Usuario';
import { Categoria } from '../src/entities/Categoria';
import { MetodoPago } from '../src/entities/MetodoPago';
import { Camiseta, CondicionCamiseta, EstadoCamiseta } from '../src/entities/Camiseta';
import { Descuento, TipoDescuento } from '../src/entities/Descuento';

async function seedDatabase() {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();

  try {
    console.log('Iniciando la siembra de datos...');

    // 1. Crear usuarios
    const adminUser = new Usuario(
      'Juan',
      'Pérez',
      'admin@tiendaretro.com',
      'admin123',
      'Av. Corrientes 1234, Buenos Aires',
      '+54 11 1234-5678',
      UsuarioRol.ADMINISTRADOR
    );

    const user1 = new Usuario(
      'María',
      'González',
      'maria@email.com',
      'user123',
      'Calle San Martín 567, Rosario',
      '+54 341 9876-5432'
    );

    const user2 = new Usuario(
      'Carlos',
      'López',
      'carlos@email.com',
      'user456',
      'Av. Libertador 890, Córdoba',
      '+54 351 5555-4444'
    );

    em.persist([adminUser, user1, user2]);

    // 2. Crear categorías
    const categoriaClubs = new Categoria('Clubes Argentinos', 'Camisetas de clubes de fútbol argentino');
    const categoriaSelecciones = new Categoria('Selecciones', 'Camisetas de selecciones nacionales');
    const categoriaEuropa = new Categoria('Clubes Europeos', 'Camisetas de clubes europeos');
    const categoriaRetro = new Categoria('Retro/Vintage', 'Camisetas clásicas y vintage');

    em.persist([categoriaClubs, categoriaSelecciones, categoriaEuropa, categoriaRetro]);

    // 3. Crear métodos de pago
    const efectivo = new MetodoPago('Efectivo', 'Pago en efectivo contra entrega');
    const tarjeta = new MetodoPago('Tarjeta de Crédito', 'Pago con tarjeta de crédito/débito');
    const transferencia = new MetodoPago('Transferencia Bancaria', 'Transferencia bancaria');
    const mercadoPago = new MetodoPago('Mercado Pago', 'Pago a través de Mercado Pago');

    em.persist([efectivo, tarjeta, transferencia, mercadoPago]);

    // 4. Crear descuentos
    const descuentoVerano = new Descuento(
      'Descuento de Verano',
      'VERANO2025',
      '15% de descuento en todas las camisetas',
      TipoDescuento.PORCENTAJE,
      15,
      new Date('2025-01-01'),
      new Date('2025-03-31'),
      100
    );
    descuentoVerano.montoMinimo = 5000;

    const descuentoPrimeraCompra = new Descuento(
      'Primera Compra',
      'PRIMERA2025',
      '$2000 de descuento en tu primera compra',
      TipoDescuento.MONTO_FIJO,
      2000,
      new Date('2025-01-01'),
      new Date('2025-12-31'),
      50
    );
    descuentoPrimeraCompra.montoMinimo = 8000;

    em.persist([descuentoVerano, descuentoPrimeraCompra]);

    // Guardar todo hasta aquí
    await em.flush();

    // 5. Crear camisetas
    const camiseta1 = new Camiseta(
      'Camiseta Boca Juniors 1981 Retro',
      'Camiseta histórica de Boca Juniors utilizada en la temporada 1981. Excelente estado de conservación.',
      'Boca Juniors',
      '1981',
      'L',
      CondicionCamiseta.EXCELENTE,
      'https://example.com/boca1981.jpg',
      25000,
      adminUser
    );
    camiseta1.categoria = categoriaRetro;

    const camiseta2 = new Camiseta(
      'Camiseta Argentina Mundial 1986',
      'Réplica de la camiseta utilizada por la selección argentina en el Mundial de México 1986.',
      'Selección Argentina',
      '1986',
      'M',
      CondicionCamiseta.MUY_BUENA,
      'https://example.com/argentina1986.jpg',
      35000,
      adminUser
    );
    camiseta2.categoria = categoriaSelecciones;

    const camiseta3 = new Camiseta(
      'Camiseta Barcelona 1999-2000',
      'Camiseta del FC Barcelona temporada 1999-2000, época de Rivaldo y Guardiola.',
      'FC Barcelona',
      '1999-2000',
      'XL',
      CondicionCamiseta.BUENA,
      'https://example.com/barcelona99.jpg',
      18000,
      user1,
      true // Esta será para subasta
    );
    camiseta3.categoria = categoriaEuropa;
    camiseta3.estado = EstadoCamiseta.EN_SUBASTA;

    const camiseta4 = new Camiseta(
      'Camiseta River Plate 1996',
      'Camiseta de River Plate de la temporada 1996, época del equipo de Ramón Díaz.',
      'River Plate',
      '1996',
      'L',
      CondicionCamiseta.EXCELENTE,
      'https://example.com/river1996.jpg',
      22000,
      user2
    );
    camiseta4.categoria = categoriaClubs;

    const camiseta5 = new Camiseta(
      'Camiseta Independiente 1984',
      'Camiseta histórica de Independiente, campeón de la Copa Libertadores 1984.',
      'Independiente',
      '1984',
      'M',
      CondicionCamiseta.MUY_BUENA,
      'https://example.com/independiente1984.jpg',
      28000,
      adminUser
    );
    camiseta5.categoria = categoriaRetro;

    em.persist([camiseta1, camiseta2, camiseta3, camiseta4, camiseta5]);

    // Guardar las camisetas
    await em.flush();

    console.log('✅ Datos de ejemplo creados exitosamente:');
    console.log('👥 3 usuarios (1 admin, 2 usuarios regulares)');
    console.log('📂 4 categorías');
    console.log('💳 4 métodos de pago');
    console.log('🎯 2 descuentos activos');
    console.log('👕 5 camisetas (1 configurada para subasta)');
    console.log('');
    console.log('🔐 Credenciales de prueba:');
    console.log('Admin: admin@tiendaretro.com / admin123');
    console.log('Usuario 1: maria@email.com / user123');
    console.log('Usuario 2: carlos@email.com / user456');

  } catch (error) {
    console.error('❌ Error al sembrar la base de datos:', error);
  } finally {
    await orm.close();
  }
}

seedDatabase();
