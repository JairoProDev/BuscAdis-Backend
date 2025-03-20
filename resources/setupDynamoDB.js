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

async function createClassifiedadsTable() {
  const command = new CreateTableCommand({
    TableName: "Classifiedads",
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
    console.log("Tabla Classifiedads creada");
  } catch (error) {
    console.error("Error creando tabla Classifiedads:", error);
    throw error;
  }
}

async function createTables() {
  await createProfilesTable();
  await createClassifiedadsTable();
}

module.exports = { createTables };
