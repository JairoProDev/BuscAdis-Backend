const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Importar módulos de configuración
const {
  createUserPool,
  createAppClient,
} = require("../resources/setupCognito");
const { createTables } = require("../resources/setupDynamoDB");
const { createImagesBucket } = require("../resources/setupS3");
const {
  createCloudFrontDistribution,
} = require("../resources/setupCloudFront");
const { setupApiGateway } = require("../resources/setupApiGateway");
const {
  createCognitoAuthorizer,
} = require("../resources/setupCognitoAuthorizer");

async function deployLambdaFunctions() {
  console.log("Desplegando funciones Lambda...");

  const functionsDir = path.resolve(__dirname, "../functions");
  const functionFolders = fs
    .readdirSync(functionsDir)
    .filter((folder) =>
      fs.statSync(path.join(functionsDir, folder)).isDirectory()
    );

  const lambdaArns = {};

  for (const folder of functionFolders) {
    console.log(`Desplegando función ${folder}...`);

    // Preparar el paquete de despliegue
    const functionDir = path.join(functionsDir, folder);

    // Instalar dependencias
    spawnSync("npm", ["install", "--production"], {
      cwd: functionDir,
      stdio: "inherit",
    });

    // Crear archivo ZIP
    const zipFile = path.join(functionDir, `${folder}.zip`);
    spawnSync("zip", ["-r", zipFile, "."], {
      cwd: functionDir,
      stdio: "inherit",
    });

    // Desplegar la función
    const createFunctionResult = spawnSync(
      "aws",
      [
        "lambda",
        "create-function",
        "--function-name",
        `buscadis-${folder}`,
        "--runtime",
        "nodejs16.x",
        "--handler",
        "index.handler",
        "--role",
        process.env.LAMBDA_EXECUTION_ROLE_ARN,
        "--zip-file",
        `fileb://${zipFile}`,
      ],
      { encoding: "utf8" }
    );

    if (createFunctionResult.status !== 0) {
      console.error(
        `Error desplegando función ${folder}:`,
        createFunctionResult.stderr
      );
      // Intentar actualizar la función por si ya existe
      const updateFunctionResult = spawnSync(
        "aws",
        [
          "lambda",
          "update-function-code",
          "--function-name",
          `buscadis-${folder}`,
          "--zip-file",
          `fileb://${zipFile}`,
        ],
        { encoding: "utf8" }
      );

      if (updateFunctionResult.status !== 0) {
        console.error(
          `Error actualizando función ${folder}:`,
          updateFunctionResult.stderr
        );
        continue;
      }
    }

    // Obtener ARN de la función
    const getFunctionResult = spawnSync(
      "aws",
      [
        "lambda",
        "get-function",
        "--function-name",
        `buscadis-${folder}`,
        "--query",
        "Configuration.FunctionArn",
        "--output",
        "text",
      ],
      { encoding: "utf8" }
    );

    if (getFunctionResult.status === 0) {
      lambdaArns[folder] = getFunctionResult.stdout.trim();
      console.log(`Función ${folder} desplegada: ${lambdaArns[folder]}`);
    }
  }

  return lambdaArns;
}

async function deploy() {
  try {
    // Crear recursos de AWS
    console.log("Iniciando despliegue de infraestructura...");

    // 1. Crear User Pool y App Client
    const userPoolId = await createUserPool();
    const clientId = await createAppClient(userPoolId);

    // Guardar IDs para uso en el frontend
    const envFile = path.resolve(__dirname, "../../frontend/.env.local");
    fs.appendFileSync(envFile, `\nNEXT_PUBLIC_USER_POOL_ID=${userPoolId}\n`);
    fs.appendFileSync(envFile, `NEXT_PUBLIC_USER_POOL_CLIENT_ID=${clientId}\n`);

    // 2. Crear tablas en DynamoDB
    await createTables();

    // 3. Crear bucket de S3
    const bucketName = await createImagesBucket();

    // 4. Crear distribución CloudFront
    const distributionDomain = await createCloudFrontDistribution(bucketName);
    fs.appendFileSync(
      envFile,
      `NEXT_PUBLIC_CLOUDFRONT_DOMAIN=${distributionDomain}\n`
    );

    // 5. Desplegar funciones Lambda
    const lambdaArns = await deployLambdaFunctions();

    // 6. Configurar API Gateway
    const apiId = await setupApiGateway(lambdaArns);

    // 7. Crear autorizador Cognito
    const authorizerId = await createCognitoAuthorizer(apiId, userPoolId);

    // 8. Desplegar la API
    const deployApiResult = spawnSync(
      "aws",
      [
        "apigateway",
        "create-deployment",
        "--rest-api-id",
        apiId,
        "--stage-name",
        "prod",
      ],
      { encoding: "utf8" }
    );

    if (deployApiResult.status !== 0) {
      console.error("Error desplegando API:", deployApiResult.stderr);
    } else {
      console.log("API desplegada correctamente");

      // Guardar URL de la API para uso en el frontend
      const apiUrl = `https://${apiId}.execute-api.${process.env.AWS_REGION}.amazonaws.com/prod`;
      fs.appendFileSync(envFile, `NEXT_PUBLIC_API_URL=${apiUrl}\n`);
    }

    console.log("Despliegue completado exitosamente");
    console.log("Variables de entorno guardadas en", envFile);
  } catch (error) {
    console.error("Error durante el despliegue:", error);
    process.exit(1);
  }
}

deploy();
