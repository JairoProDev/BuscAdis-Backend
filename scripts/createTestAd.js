const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

async function createTestAd() {
  try {
    const credentials = await fromNodeProviderChain();
    const client = new DynamoDBClient({
      region: "us-east-2", // Asegúrate de que esta región coincida con tu configuración
      credentials,
    });
    const docClient = DynamoDBDocumentClient.from(client);

    const ad = {
      id: uuidv4(),
      title: "Anuncio de prueba",
      description: "Descripción del anuncio de prueba",
      price: 100,
      location: { district: "Santiago", city: "Cusco", country: "Perú" },
      categoryId: "empleos", // Asegúrate de que esta categoría exista
      isActive: true,
    };

    await docClient.send(
      new PutCommand({
        TableName: "Classifiedads",
        Item: ad,
      })
    );
    console.log("Anuncio de prueba creado con éxito");
  } catch (error) {
    console.error("Error creando anuncio de prueba:", error);
  }
}

createTestAd();