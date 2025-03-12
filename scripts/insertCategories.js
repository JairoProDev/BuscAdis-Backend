require("dotenv").config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

async function insertTestData() {
  const categories = [
    { id: "1", name: "Empleos" },
    { id: "2", name: "Inmuebles" },
    { id: "3", name: "Vehículos" },
    { id: "4", name: "Servicios" },
    { id: "5", name: "Productos" },
    { id: "6", name: "Eventos" },
  ];

  for (const category of categories) {
    const command = new PutCommand({
      TableName: "Categories",
      Item: category,
    });

    try {
      await client.send(command);
      console.log(`Inserted category: ${category.name}`);
    } catch (error) {
      console.error(`Error inserting category ${category.name}:`, error);
    }
  }
}

insertTestData();
