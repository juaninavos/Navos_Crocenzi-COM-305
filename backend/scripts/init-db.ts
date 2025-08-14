// scripts/init-db.ts
import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import config from '../src/mikro-orm.config';

async function initDatabase() {
  const orm = await MikroORM.init(config);
  
  try {
    // Generar el esquema
    const generator = orm.getSchemaGenerator();
    
    // Crear las tablas
    await generator.createSchema();
    
    console.log(' Base de datos inicializada correctamente');
    console.log(' Tablas creadas para todas las entidades');
    
  } catch (error) {
    console.error(' Error al inicializar la base de datos:', error);
  } finally {
    await orm.close();
  }
}

initDatabase();
