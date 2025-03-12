require("dotenv").config();
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

async function testCategoriesTable() {
  const command = new ScanCommand({
    TableName: "Categories",
  });

  try {
    const response = await client.send(command);
    console.log("Categories:", response.Items);
  } catch (error) {
    console.error("Error accessing Categories table:", error);
  }
}

testCategoriesTable();
