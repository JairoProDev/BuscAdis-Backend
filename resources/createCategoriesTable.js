require("dotenv").config(); // Cargar variables de entorno

const {
  DynamoDBClient,
  CreateTableCommand,
} = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

async function createCategoriesTable() {
  const command = new CreateTableCommand({
    TableName: "Categories",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }], // id como clave primaria
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }, // id de tipo String
      // No necesitas definir "name" aquí a menos que lo uses como parte de una clave secundaria
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  });

  try {
    await client.send(command);
    console.log("Tabla Categories creada");
  } catch (error) {
    console.error("Error creando tabla Categories:", error);
    throw error;
  }
}

createCategoriesTable();
