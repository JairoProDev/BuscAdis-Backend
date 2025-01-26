import { ElasticsearchModuleOptions } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';

export const getElasticsearchConfig = (
  configService: ConfigService,
): ElasticsearchModuleOptions => ({
  node: configService.get('ELASTICSEARCH_NODE', 'http://localhost:9200'),
  auth: {
    username: configService.get('ELASTICSEARCH_USERNAME', ''),
    password: configService.get('ELASTICSEARCH_PASSWORD', ''),
  },
  maxRetries: 10,
  requestTimeout: 60000,
  sniffOnStart: true,
}); 