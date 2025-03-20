const {
  CognitoIdentityProviderClient,
  CreateUserPoolClientCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({ region: "us-east-2" });

async function createAppClient(userPoolId) {
  const command = new CreateUserPoolClientCommand({
    UserPoolId: userPoolId,
    ClientName: "BuscadisWebApp",
    GenerateSecret: false,
    RefreshTokenValidity: 30,
    AccessTokenValidity: 1,
    IdTokenValidity: 1,
    ExplicitAuthFlows: [
      "ALLOW_USER_SRP_AUTH",
      "ALLOW_REFRESH_TOKEN_AUTH",
      "ALLOW_USER_PASSWORD_AUTH",
    ],
    PreventUserExistenceErrors: "ENABLED",
  });

  try {
    const response = await client.send(command);
    console.log(`App Client creado: ${response.UserPoolClient.ClientId}`);
    return response.UserPoolClient.ClientId;
  } catch (error) {
    console.error("Error creando App Client:", error);
    throw error;
  }
}

module.exports = { createAppClient };
