const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

async function testCredentials() {
  try {
    const credentials = await fromNodeProviderChain();
    const client = new DynamoDBClient({
      region: "us-east-2", // Asegúrate de que esta región coincida con tu configuración
      credentials,
    });

    const command = new ListTablesCommand({});
    const response = await client.send(command);
    console.log("Tables:", response.TableNames);
    console.log("Credentials test successful!");
  } catch (error) {
    console.error("Error testing credentials:", error);
  }
}

testCredentials();