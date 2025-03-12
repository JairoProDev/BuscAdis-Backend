const {
  APIGatewayClient,
  CreateAuthorizerCommand,
} = require("@aws-sdk/client-api-gateway");

const client = new APIGatewayClient({ region: "us-east-1" });

async function createCognitoAuthorizer(apiId, userPoolId) {
  const command = new CreateAuthorizerCommand({
    restApiId: apiId,
    name: "CognitoAuthorizer",
    type: "COGNITO_USER_POOLS",
    providerARNs: [
      `arn:aws:cognito-idp:us-east-1:${process.env.AWS_ACCOUNT_ID}:userpool/${userPoolId}`,
    ],
    identitySource: "method.request.header.Authorization",
  });

  try {
    const response = await client.send(command);
    console.log(`Autorizador Cognito creado: ${response.id}`);
    return response.id;
  } catch (error) {
    console.error("Error creando autorizador Cognito:", error);
    throw error;
  }
}

module.exports = { createCognitoAuthorizer };
