const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

async function insertCategory(category) {
  try {
    const credentials = await fromNodeProviderChain();
    const client = new DynamoDBClient({
      region: "us-east-2",
      credentials,
    });

    const params = {
      TableName: "Categories",
      Item: {
        id: { S: category.id },
        name: { S: category.name },
        description: { S: category.description },
        createdAt: { S: new Date().toISOString() },
        updatedAt: { S: new Date().toISOString() },
      },
    };

    const command = new PutItemCommand(params);
    await client.send(command);
    console.log(`Category ${category.name} inserted successfully.`);
  } catch (error) {
    console.error("Error inserting category:", error);
  }
}

async function insertCategories() {
  const categories = [
    { id: "jobs", name: "Empleos", description: "Encuentra oportunidades laborales en diversas industrias y sectores. Publica ofertas de empleo para atraer a los mejores talentos." },
    { id: "realEstate", name: "Inmuebles", description: "Descubre una amplia selección de propiedades en venta y alquiler. Publica anuncios de casas, apartamentos, terrenos y más." },
    { id: "vehicles", name: "Vehículos", description: "Compra y vende vehículos nuevos y usados. Encuentra automóviles, motocicletas, camiones y repuestos." },
    { id: "services", name: "Servicios", description: "Conecta con profesionales y proveedores de servicios locales. Ofrece o encuentra servicios de fontanería, electricidad, limpieza y más." },
    { id: "products", name: "Productos", description: "Compra y vende productos nuevos y usados de diversas categorías. Encuentra electrónica, ropa, hogar y jardín, y más." },
    { id: "events", name: "Eventos", description: "Descubre eventos y actividades en tu área. Encuentra conciertos, festivales, talleres y eventos deportivos." },
    { id: "community", name: "Comunidad", description: "Encuentra información local y anuncios de la comunidad. Publica anuncios de grupos, clases, eventos y más." },
    { id: "businesses", name: "Negocios", description: "Encuentra oportunidades para negocios y emprendedores. Publica anuncios de compra y venta de negocios, franquicias y más." },
  ];

  for (const category of categories) {
    await insertCategory(category);
  }
}

insertCategories();