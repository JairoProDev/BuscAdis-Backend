const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({ region: "us-east-2" });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const {
      title,
      description,
      price,
      priceType,
      category,
      location,
      contact,
      media,
    } = body;

    // Validación
    if (!title || !description) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "El título y la descripción son obligatorios",
        }),
      };
    }

    // Obtener el usuario desde el token
    const userId = event.requestContext.authorizer.claims.sub;

    const classifiedadId = uuidv4();

    const command = new PutCommand({
      TableName: "Classifiedads",
      Item: {
        id: classifiedadId,
        userId,
        title,
        description,
        price: price || 0,
        priceType: priceType || "fixed",
        category: category || "otros",
        location,
        contact,
        media: media || [],
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return {
      statusCode: 201,
      body: JSON.stringify({ id: classifiedadId }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al crear el anuncio" }),
    };
  }
};
