const { DynamoDBClient, CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

async function createPublicationsTable() {
    try {
        const credentials = await fromNodeProviderChain();
        const client = new DynamoDBClient({
            region: "us-east-2", // o tu región
            credentials,
        });

        // 1. Crear tabla con atributos mínimos
        const baseParams = {
            TableName: "Publications",
            KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
            AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
        };

        const baseCommand = new CreateTableCommand(baseParams);
        const baseResult = await client.send(baseCommand);
        console.log("Tabla Publications creada exitosamente (base):", baseResult);

        // 2. Añadir GSIs uno por uno (descomentar y ejecutar en pasos)
        // 2.1 UserPublicationsIndex
        const userIndexParams = {
            TableName: "Publications",
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        IndexName: "UserPublicationsIndex",
                        KeySchema: [
                            { AttributeName: "user_id", KeyType: "HASH" },
                            { AttributeName: "created_at", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
                    },
                },
            ],
            AttributeDefinitions: [
                { AttributeName: "id", AttributeType: "S" },
                { AttributeName: "user_id", AttributeType: "S" },  // Agregado aquí
                { AttributeName: "created_at", AttributeType: "S" }, // Agregado aquí
            ]

        };
        //console.log("Intentando crear UserPublicationsIndex", userIndexParams)
        //const userIndexCommand = new UpdateTableCommand(userIndexParams);
        //const userIndexResult = await client.send(userIndexCommand);
        //console.log("UserPublicationsIndex creado:", userIndexResult);



        // 2.2 CategorySubcategorySubcategoryIndex
        const categoryIndexParams = {
            TableName: "Publications",
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        IndexName: "CategorySubcategorySubcategoryIndex",
                        KeySchema: [
                            { AttributeName: "category_id", KeyType: "HASH" },
                            { AttributeName: "subcategory_id", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
                    },
                },
            ],
             AttributeDefinitions: [
                { AttributeName: "id", AttributeType: "S" },
                { AttributeName: "category_id", AttributeType: "S" },
                { AttributeName: "subcategory_id", AttributeType: "S" },
            ]
        };

       // console.log("Intentando crear CategorySubcategorySubcategoryIndex", categoryIndexParams);
        //const categoryIndexCommand = new UpdateTableCommand(categoryIndexParams);
        //const categoryIndexResult = await client.send(categoryIndexCommand);
        //console.log("CategorySubcategorySubcategoryIndex creado:", categoryIndexResult);



        // 2.3 LocationIndex
        const locationIndexParams = {
            TableName: "Publications",
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        IndexName: "LocationIndex",
                        KeySchema: [
                            { AttributeName: "country", KeyType: "HASH" },
                            { AttributeName: "city", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
                    },
                },
            ],
            AttributeDefinitions: [
                { AttributeName: "id", AttributeType: "S" },
                { AttributeName: "country", AttributeType: "S" },
                { AttributeName: "city", AttributeType: "S" },
            ]
        };
        //console.log("Intentando crear LocationIndex", locationIndexParams);
        //const locationIndexCommand = new UpdateTableCommand(locationIndexParams);
        //const locationIndexResult = await client.send(locationIndexCommand);
        //console.log("LocationIndex creado:", locationIndexResult);


        // 2.4 StatusIndex
        const statusIndexParams = {
            TableName: "Publications",
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        IndexName: "StatusIndex",
                        KeySchema: [
                            { AttributeName: "status", KeyType: "HASH" },
                            { AttributeName: "created_at", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
                    },
                },
            ],
            AttributeDefinitions: [
                { AttributeName: "id", AttributeType: "S" },
                 { AttributeName: "status", AttributeType: "S" },
                { AttributeName: "created_at", AttributeType: "S" },
            ]
        };
        //console.log("Intentando crear StatusIndex", statusIndexParams);
        //const statusIndexCommand = new UpdateTableCommand(statusIndexParams);
        //const statusIndexResult = await client.send(statusIndexCommand);
        //console.log("StatusIndex creado:", statusIndexResult);

        // 2.5 PriceRangeIndex
          const priceIndexParams = {
            TableName: "Publications",
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        IndexName: "PriceRangeIndex",
                        KeySchema: [
                            { AttributeName: "price", KeyType: "HASH" },
                            { AttributeName: "created_at", KeyType: "RANGE" },
                        ],
                        Projection: { ProjectionType: "ALL" },
                        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
                    },
                },
            ],
            AttributeDefinitions: [
                { AttributeName: "id", AttributeType: "S" },
                { AttributeName: "price", AttributeType: "N" },
                { AttributeName: "created_at", AttributeType: "S" },
            ]
        };
       // console.log("Intentando crear PriceRangeIndex", priceIndexParams);
        //const priceIndexCommand = new UpdateTableCommand(priceIndexParams);
        //const priceIndexResult = await client.send(priceIndexCommand);
       // console.log("PriceRangeIndex creado:", priceIndexResult);



    } catch (error) {
        console.error("Error al crear la tabla Publications:", error);
        throw error;
    }
}

createPublicationsTable();
