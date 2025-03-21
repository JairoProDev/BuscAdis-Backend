const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

async function createTestAd() {
    try {
        const credentials = await fromNodeProviderChain();
        const client = new DynamoDBClient({
            region: "us-east-2", // Asegúrate de que esta región coincida con tu configuración de AWS
            credentials,
        });
        const docClient = DynamoDBDocumentClient.from(client);

        const ad = {
            id: uuidv4(),
            user_id: "test-user-id", // Un ID de usuario de prueba
            category_id: "test-category-id", // Un ID de categoría de prueba
            subcategory_id: "test-subcategory-id", // Un ID de subcategoría de prueba
            title: "Anuncio de Prueba Unificado",
            description: "Descripción del anuncio de prueba unificado. Este anuncio se creó con el código unificado.",
            price: 125, // Un precio de prueba
            currency: "PEN",
            country: "Peru",
            city: "Test City",
            images: [
                "https://example.com/image1.jpg",
                "https://example.com/image2.jpg",
            ],
            status: "active", // El estado debe ser "active" para que aparezca en tu app
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            location: {
                latitude: 37.7749,
                longitude: -122.4194,
            },
        };

        const params = {
            TableName: "Publications", // Asegúrate de que el nombre de la tabla es correcto
            Item: ad,
        };

        const command = new PutCommand(params);
        const result = await docClient.send(command);
        console.log("Anuncio de prueba creado con éxito (unificado):", result);
    } catch (error) {
        console.error("Error creando anuncio de prueba (unificado):", error);
        throw error; // Importante para que sepas si hay un error
    }
}

createTestAd();
