const {
  S3Client,
  CreateBucketCommand,
  PutBucketCorsCommand,
} = require("@aws-sdk/client-s3");

const client = new S3Client({ region: "us-east-1" });

async function createImagesBucket() {
  const bucketName = "buscadis-images";

  const createBucketCommand = new CreateBucketCommand({
    Bucket: bucketName,
  });

  try {
    await client.send(createBucketCommand);
    console.log(`Bucket ${bucketName} creado`);

    // Configurar CORS para permitir solicitudes desde tu dominio
    const putCorsCommand = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
            AllowedOrigins: ["http://localhost:3000", "https://tu-dominio.com"],
            ExposeHeaders: ["ETag"],
          },
        ],
      },
    });

    await client.send(putCorsCommand);
    console.log(`CORS configurado para ${bucketName}`);

    return bucketName;
  } catch (error) {
    console.error("Error creando bucket:", error);
    throw error;
  }
}

module.exports = { createImagesBucket };
