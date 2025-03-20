const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

async function createCategoriesTable() {
  try {
    const credentials = await fromNodeProviderChain();
    const client = new DynamoDBClient({
      region: "us-east-2", // Reemplaza con tu región
      credentials,
    });

    const params = {
      TableName: "Categories",
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };

    const command = new CreateTableCommand(params);
    const response = await client.send(command);
    console.log("Table Categories created successfully:", response);
  } catch (error) {
    console.error("Error creating table Categories:", error);
  }
}

createCategoriesTable();