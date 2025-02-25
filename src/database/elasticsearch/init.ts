import { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common'; // Importa Logger

export async function initializeElasticsearch(configService: ConfigService) {
  const logger = new Logger('ElasticsearchInit'); // Crea una instancia de Logger

  const node = configService.get<string>('ELASTICSEARCH_NODE');
  const username = configService.get<string>('ELASTICSEARCH_USERNAME');
  const password = configService.get<string>('ELASTICSEARCH_PASSWORD');

  // Validación de configuración *antes* de crear el cliente
  if (!node) {
    logger.error('ELASTICSEARCH_NODE is not defined in environment variables.');
    //Considerar si la app puede funcionar sin elasticsearch, si no:
    throw new Error('ELASTICSEARCH_NODE is not defined in environment variables.'); // Detiene la app
    //Si puede funcionar, no lanzar el error, y usar un try/catch más abajo.
  }
  if (!username || !password) {
      logger.warn('ELASTICSEARCH_USERNAME or ELASTICSEARCH_PASSWORD are not defined.  Elasticsearch might not work correctly.');
      //Considerar si se puede conectar sin credenciales. Si *necesita* credenciales, lanzar un error:
      // throw new Error('ELASTICSEARCH_USERNAME and ELASTICSEARCH_PASSWORD are required.');
  }


  const client = new Client({
    node: node,
    auth: {
      username: username || 'elastic', //Valor por defecto en caso de que no este definido
      password: password || 'changeme',//Valor por defecto en caso de que no este definido
    },
  });

  try {
    // Prueba de conexión *antes* de intentar crear índices.
    await client.ping();
    logger.log('Successfully connected to Elasticsearch.');

    // Create listings index
        // Comprueba si el índice existe *antes* de intentar crearla.
        const indexExists = await client.indices.exists({ index: 'listings' });

    if (!indexExists.valueOf) { // Usa .value para obtener el booleano
      await client.indices.create({
        index: 'listings',
        body: {
          settings: {
            analysis: {
              analyzer: {
                spanish_analyzer: {
                  type: 'standard', // Usa 'standard' como analizador, el analizador spanish ya existe por default en elastic
                  stopwords: '_spanish_', //Usar el default de spanish
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: {
                type: 'text',
                analyzer: 'spanish_analyzer', //Usa el analizador custom
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              description: {
                type: 'text',
                analyzer: 'spanish_analyzer',//Usa el analizador custom
              },
              price: { type: 'float' },
              priceType: { type: 'keyword' },
              status: { type: 'keyword' },
              condition: { type: 'keyword' },
              location: {
                type: 'geo_point',
              },
              categories: {
                type: 'keyword', // Si solo almacenas IDs de categorías, usa keyword
              },
              attributes: {
                type: 'object',
                dynamic: true, // Permite añadir campos dinámicamente, o "enabled: true"
              },
              isActive: { type: 'boolean' },
              isFeatured: { type: 'boolean' },
              isVerified: { type: 'boolean' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
              publishedAt: { type: 'date' },
            },
          },
        },
      });
      logger.log('Elasticsearch index "listings" created successfully.');
    } else {
        logger.log('Elasticsearch index "listings" already exists.');
    }



  } catch (error) {
    //Manejo de errores mejorado:
    if (error instanceof Error) {
      if (error.message.includes('resource_already_exists_exception')) {
        // Ya no es necesario este log, porque comprobamos la existencia antes.
      } else {
          logger.error(`Error initializing Elasticsearch: ${error.message}`, error.stack);
          //Opcional, si quieres que la app no se ejecute si falla elasticsearch
          // throw error;
        }

    } else {
      logger.error('An unknown error occurred during Elasticsearch initialization:', error);
        //Opcional, si quieres que la app no se ejecute si falla elasticsearch
      //   throw error;
    }
     // Instrucciones para el usuario (si es un error que el usuario puede solucionar)
     logger.warn(`
            Please check the following to resolve Elasticsearch errors:
            1. Ensure Elasticsearch is running and accessible at the configured node (${node}).
            2. Verify your Elasticsearch credentials (username: ${username}, password: [provided]).
            3. If you are using a cloud provider (like Elastic Cloud), make sure your connection string is correct.
            4. Check for any network issues or firewalls blocking the connection.
            5. Review the Elasticsearch logs for more detailed error messages.
        `);
  }
}