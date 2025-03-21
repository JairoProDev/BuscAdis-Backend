const {
  APIGatewayClient,
  CreateRestApiCommand,
  CreateResourceCommand,
  PutMethodCommand,
  PutIntegrationCommand,
} = require("@aws-sdk/client-api-gateway");

const client = new APIGatewayClient({ region: "us-east-2" });

async function createApi() {
  const createApiCommand = new CreateRestApiCommand({
    name: "BuscadisAPI",
    description: "API para Buscadis",
    endpointConfiguration: {
      types: ["REGIONAL"],
    },
  });

  try {
    const api = await client.send(createApiCommand);
    console.log(`API creada: ${api.id}`);
    return api.id;
  } catch (error) {
    console.error("Error creando API:", error);
    throw error;
  }
}

async function createPublicationsResource(apiId, rootResourceId, lambdaArn) {
  // Crear recurso /publications
  const createResourceCommand = new CreateResourceCommand({
    restApiId: apiId,
    parentId: rootResourceId,
    pathPart: "publications",
  });

  const resource = await client.send(createResourceCommand);

  // Configurar método POST
  const putMethodCommand = new PutMethodCommand({
    restApiId: apiId,
    resourceId: resource.id,
    httpMethod: "POST",
    authorizationType: "COGNITO_USER_POOLS",
    authorizerId: "tu-autorizador-id",
  });

  await client.send(putMethodCommand);

  // Configurar integración con Lambda
  const putIntegrationCommand = new PutIntegrationCommand({
    restApiId: apiId,
    resourceId: resource.id,
    httpMethod: "POST",
    type: "AWS_PROXY",
    integrationHttpMethod: "POST",
    uri: `arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`,
  });

  await client.send(putIntegrationCommand);

  console.log("Recurso /publications creado y configurado");
}

async function setupApiGateway(lambdaArns) {
  const apiId = await createApi();

  // Obtener el ID del recurso raíz
  const getResourcesCommand = new GetResourcesCommand({
    restApiId: apiId,
  });

  const resources = await client.send(getResourcesCommand);
  const rootResourceId = resources.items.find((item) => item.path === "/").id;

  // Crear recursos para diferentes endpoints
  await createPublicationsResource(
    apiId,
    rootResourceId,
    lambdaArns.createPublication
  );

  // Crear el resto de endpoints según sea necesario...

  console.log("API Gateway configurado");
  return apiId;
}

module.exports = { setupApiGateway };
