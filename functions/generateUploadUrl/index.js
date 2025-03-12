const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

const client = new S3Client({ region: "us-east-1" });
const BUCKET_NAME = "buscadis-images";

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { contentType } = body;

    if (!contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "contentType es requerido" }),
      };
    }

    // Obtener el usuario desde el token
    const userId = event.requestContext.authorizer.claims.sub;

    const key = `${userId}/${uuidv4()}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Generar URL presignada que expira en 5 minutos
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 300 });

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl: signedUrl,
        key: key,
        imageUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al generar URL de carga" }),
    };
  }
};
