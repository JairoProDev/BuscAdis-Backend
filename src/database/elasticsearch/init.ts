import { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';

export async function initializeElasticsearch(configService: ConfigService) {
    const client = new Client({
        node: configService.get('ELASTICSEARCH_NODE'),
        auth: {
            username: configService.get('ELASTICSEARCH_USERNAME'),
            password: configService.get('ELASTICSEARCH_PASSWORD'),
        },
    });

    try {
        // Create listings index
        await client.indices.create({
            index: 'listings',
            body: {
                settings: {
                    analysis: {
                        analyzer: {
                            spanish_analyzer: {
                                type: 'spanish',
                                stopwords: '_spanish_'
                            }
                        }
                    }
                },
                mappings: {
                    properties: {
                        id: { type: 'keyword' },
                        title: { 
                            type: 'text',
                            analyzer: 'spanish_analyzer',
                            fields: {
                                keyword: { type: 'keyword' }
                            }
                        },
                        description: { 
                            type: 'text',
                            analyzer: 'spanish_analyzer'
                        },
                        price: { type: 'float' },
                        priceType: { type: 'keyword' },
                        status: { type: 'keyword' },
                        condition: { type: 'keyword' },
                        location: {
                            type: 'geo_point'
                        },
                        categories: {
                            type: 'keyword'
                        },
                        attributes: {
                            type: 'object',
                            enabled: true
                        },
                        isActive: { type: 'boolean' },
                        isFeatured: { type: 'boolean' },
                        isVerified: { type: 'boolean' },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' },
                        publishedAt: { type: 'date' }
                    }
                }
            }
        });

        console.log('Elasticsearch indices created successfully');
    } catch (error) {
        if (error.message.includes('resource_already_exists_exception')) {
            console.log('Elasticsearch indices already exist');
        } else {
            console.error('Error creating Elasticsearch indices:', error);
            throw error;
        }
    }
} 