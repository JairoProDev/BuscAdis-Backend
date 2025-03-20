const {
  CognitoIdentityProviderClient,
  CreateUserPoolCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({ region: "us-east-2" });

async function createUserPool() {
  const command = new CreateUserPoolCommand({
    PoolName: "BuscadisUserPool",
    Policies: {
      PasswordPolicy: {
        MinimumLength: 8,
        RequireUppercase: true,
        RequireLowercase: true,
        RequireNumbers: true,
        RequireSymbols: false,
      },
    },
    AutoVerifiedAttributes: ["email"],
    Schema: [
      {
        Name: "name",
        AttributeDataType: "String",
        Mutable: true,
        Required: true,
      },
      {
        Name: "phone_number",
        AttributeDataType: "String",
        Mutable: true,
        Required: true,
      },
    ],
  });

  try {
    const response = await client.send(command);
    console.log(`User Pool creado: ${response.UserPool.Id}`);
    return response.UserPool.Id;
  } catch (error) {
    console.error("Error creando User Pool:", error);
    throw error;
  }
}

module.exports = { createUserPool };
