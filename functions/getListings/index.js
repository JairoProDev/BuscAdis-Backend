const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const category = queryParams.category;
    const query = queryParams.q;
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;

    let filterExpressions = [];
    let expressionAttributeValues = {};

    if (category) {
      filterExpressions.push("category = :category");
      expressionAttributeValues[":category"] = category;
    }

    if (query) {
      filterExpressions.push(
        "contains(title, :query) OR contains(description, :query)"
      );
      expressionAttributeValues[":query"] = query;
    }

    const command = new ScanCommand({
      TableName: "Listings",
      FilterExpression:
        filterExpressions.length > 0
          ? filterExpressions.join(" AND ")
          : undefined,
      ExpressionAttributeValues:
        Object.keys(expressionAttributeValues).length > 0
          ? expressionAttributeValues
          : undefined,
      Limit: limit,
    });

    const response = await docClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        listings: response.Items,
        total: response.Count,
        pages: Math.ceil((response.Count || 0) / limit),
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al obtener anuncios" }),
    };
  }
};


