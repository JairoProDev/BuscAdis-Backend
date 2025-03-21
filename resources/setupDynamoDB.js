const {
  DynamoDBClient,
  CreateTableCommand,
} = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "us-east-2" });

async function createProfilesTable() {
  const command = new CreateTableCommand({
    TableName: "Profiles",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  });

  try {
    await client.send(command);
    console.log("Tabla Profiles creada");
  } catch (error) {
    console.error("Error creando tabla Profiles:", error);
    throw error;
  }
}

async function createPublicationsTable() {
  const command = new CreateTableCommand({
    TableName: "Publications",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "category", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "UserIdIndex",
        KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: "CategoryIndex",
        KeySchema: [{ AttributeName: "category", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  });

  try {
    await client.send(command);
    console.log("Tabla Publications creada");
  } catch (error) {
    console.error("Error creando tabla Publications:", error);
    throw error;
  }
}

async function createTables() {
  await createProfilesTable();
  await createPublicationsTable();
}

module.exports = { createTables };
