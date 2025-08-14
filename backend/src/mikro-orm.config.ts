import { defineConfig } from '@mikro-orm/mysql';
import { Camiseta } from './entities/Camiseta';

export default defineConfig({
  dbName: 'tienda_retro',
  user: 'root',
  password: 'root',
  host: 'localhost',
  port: 3306,
  entities: [Camiseta],
  debug: true,
});
