import { ConfigService } from '@nestjs/config';

export async function initializeElasticsearch(configService: ConfigService) {
  // const logger = new Logger('ElasticsearchInit'); // Crea una instancia de Logger

  const node = configService.get<string>('ELASTICSEARCH_NODE');
  const username = configService.get<string>('ELASTICSEARCH_USERNAME');
  const password = configService.get<string>('ELASTICSEARCH_PASSWORD');

  // Validación de configuración *antes* de crear el cliente
  if (!node) {
    // logger.error('ELASTICSEARCH_NODE is not defined in environment variables.');
    //Considerar si la app puede funcionar sin elasticsearch, si no:
    throw new Error('ELASTICSEARCH_NODE is not defined in environment variables.'); // Detiene la app
    //Si puede funcionar, no lanzar el error, y usar un try/catch más abajo.
  }
  if (!username || !password) {
      // logger.warn('ELASTICSEARCH_USERNAME or ELASTICSEARCH_PASSWORD are not defined.  Elasticsearch might not work correctly.');
      //Considerar si se puede conectar sin credenciales. Si *necesita* credenciales, lanzar un error:
      // throw new Error('ELASTICSEARCH_USERNAME and ELASTICSEARCH_PASSWORD are required.');
  }

  // try {
  //     await client.ping();
  //     logger.log('Successfully connected to Elasticsearch.');
  //     // ... existing code ...
  // } catch (error) {
  //     // ... existing error handling ...
  // }
}