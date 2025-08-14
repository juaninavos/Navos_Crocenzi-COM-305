// src/app.ts
import 'reflect-metadata';
import express from 'express';
import { MikroORM } from '@mikro-orm/core';
import config from './mikro-orm.config';
import { Camiseta } from './entities/Camiseta';

async function main() {
  const orm = await MikroORM.init(config);
  const app = express();

  app.use(express.json());

  // Endpoint para listar camisetas
  app.get('/camisetas', async (req, res) => {
    try {
      const camisetas = await orm.em.find(Camiseta, {});
      res.json(camisetas);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener camisetas' });
    }
  });

  // Puerto del servidor
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

main().catch(console.error);
