const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");
const { v4: uuidv4 } = require("uuid");

async function uploadTestPublication() {
  try {
    const credentials = await fromNodeProviderChain();
    const client = new DynamoDBClient({
      region: "us-east-2", // o tu región
      credentials,
    });

    const testPublication = {
      id: { S: uuidv4() }, // Genera un ID único para la publicación
      user_id: { S: "test-user-id" }, // ID del usuario de prueba
      category_id: { S: "test-category-id" },
      subcategory_id: { S: "test-subcategory-id" },
      title: { S: "Anuncio de Prueba" },
      description: { S: "Esta es una descripción de prueba del anuncio." },
      price: { N: "100" }, // Precio en centavos
      currency: { S: "USD" },
      country: { S: "USA" },
      city: { S: "Test City" },
      images: {
        L: [
          { S: "https://example.com/image1.jpg" },
          { S: "https://example.com/image2.jpg" },
        ],
      },
      status: { S: "active" }, // Puede ser "active", "pending", "sold", etc.
      created_at: { S: new Date().toISOString() },
      updated_at: { S: new Date().toISOString() },
      location: {
        M: {
          latitude: { N: "37.7749" }, // Ejemplo de latitud
          longitude: { N: "-122.4194" }, // Ejemplo de longitud
        },
      },
    };

    const params = {
      TableName: "Publications", // Asegúrate de que el nombre de la tabla es correcto
      Item: testPublication,
    };

    const command = new PutItemCommand(params);
    const result = await client.send(command);
    console.log("Anuncio de prueba subido exitosamente:", result);
  } catch (error) {
    console.error("Error al subir el anuncio de prueba:", error);
    throw error; // Importante para que sepas si hay un error
  }
}

uploadTestPublication();
