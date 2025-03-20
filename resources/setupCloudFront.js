const {
  CloudFrontClient,
  CreateDistributionCommand,
} = require("@aws-sdk/client-cloudfront");

const client = new CloudFrontClient({ region: "us-east-2" });

async function createCloudFrontDistribution(bucketName) {
  const originId = `S3-${bucketName}`;

  const command = new CreateDistributionCommand({
    DistributionConfig: {
      CallerReference: Date.now().toString(),
      Comment: "Distribución para imágenes de Buscadis",
      DefaultCacheBehavior: {
        TargetOriginId: originId,
        ViewerProtocolPolicy: "redirect-to-https",
        AllowedMethods: {
          Quantity: 2,
          Items: ["GET", "HEAD"],
          CachedMethods: {
            Quantity: 2,
            Items: ["GET", "HEAD"],
          },
        },
        ForwardedValues: {
          QueryString: false,
          Cookies: {
            Forward: "none",
          },
        },
        MinTTL: 0,
        DefaultTTL: 86400,
        MaxTTL: 31536000,
      },
      Enabled: true,
      Origins: {
        Quantity: 1,
        Items: [
          {
            Id: originId,
            DomainName: `${bucketName}.s3.amazonaws.com`,
            S3OriginConfig: {
              OriginAccessIdentity: "",
            },
          },
        ],
      },
    },
  });

  try {
    const response = await client.send(command);
    console.log(`Distribución CloudFront creada: ${response.Distribution.Id}`);
    console.log(`URL de la distribución: ${response.Distribution.DomainName}`);
    return response.Distribution.DomainName;
  } catch (error) {
    console.error("Error creando distribución CloudFront:", error);
    throw error;
  }
}

module.exports = { createCloudFrontDistribution };
