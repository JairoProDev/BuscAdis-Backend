const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

async function insertSubcategory(subcategory) {
  try {
    const credentials = await fromNodeProviderChain();
    const client = new DynamoDBClient({
      region: "us-east-2", // Ya has confirmado que esta es tu región.
      credentials,
    });

    const params = {
      TableName: "Subcategories",
      Item: {
        id: { S: subcategory.id },
        categoryId: { S: subcategory.categoryId },
        name: { S: subcategory.name },
        description: { S: subcategory.description }, // Se agrega la descripción.
        createdAt: { S: new Date().toISOString() },
        updatedAt: { S: new Date().toISOString() },
      },
    };

    const command = new PutItemCommand(params);
    await client.send(command);
    console.log(`Subcategory ${subcategory.name} inserted successfully.`);
  } catch (error) {
    console.error("Error inserting subcategory:", error);
  }
}

async function insertSubcategories() {
  const subcategories = [
    // Empleos
    { id: "tecnologia-informatica", categoryId: "jobs", name: "Tecnología e informática", description: "Empleos relacionados con tecnología informática." },
    { id: "salud-medicina", categoryId: "jobs", name: "Salud y medicina", description: "Empleos del sector salud y medicina." },
    { id: "educacion-formacion", categoryId: "jobs", name: "Educación y formación", description: "Empleos en el ámbito de la enseñanza." },
    { id: "construccion-ingenieria", categoryId: "jobs", name: "Construcción e ingeniería", description: "Empleos de construcción e ingeniería civil." },
    { id: "ventas-marketing", categoryId: "jobs", name: "Ventas y marketing", description: "Oportunidades de empleo en ventas." },
    { id: "finanzas-contabilidad", categoryId: "jobs", name: "Finanzas y contabilidad", description: "Empleos del área económico-financiera." },
    { id: "transporte-logistica", categoryId: "jobs", name: "Transporte y logística", description: "Empleos relacionados con transporte." },
    { id: "hosteleria-turismo-gastronomia", categoryId: "jobs", name: "Hostelería, turismo y gastronomía", description: "Empleos en hostelería." },
    { id: "arte-diseno-multimedia", categoryId: "jobs", name: "Arte, diseño y multimedia", description: "Empleos creativos y artísticos." },
    { id: "agricultura-ganaderia", categoryId: "jobs", name: "Agricultura y ganadería", description: "Empleos del sector agrario." },
    { id: "servicios-domesticos-personales", categoryId: "jobs", name: "Servicios domésticos y personales", description: "Empleos del hogar y cuidado personal." },

    // Inmuebles
    { id: "habitaciones", categoryId: "realEstate", name: "Habitaciones", description: "Espacios para habitar." },
    { id: "apartamentos", categoryId: "realEstate", name: "Apartamentos", description: "Viviendas en edificios." },
    { id: "casas", categoryId: "realEstate", name: "Casas", description: "Viviendas unifamiliares." },
    { id: "terrenos", categoryId: "realEstate", name: "Terrenos", description: "Superficies de terreno." },
    { id: "locales", categoryId: "realEstate", name: "Locales", description: "Espacios comerciales." },
    { id: "oficinas", categoryId: "realEstate", name: "Oficinas", description: "Espacios de trabajo." },
    { id: "edificios", categoryId: "realEstate", name: "Edificios", description: "Construcciones de varios pisos." },
    { id: "almacenes", categoryId: "realEstate", name: "Almacenes", description: "Espacios para depósito." },

    // Vehículos
    { id: "motocicletas", categoryId: "vehicles", name: "Motocicletas", description: "Vehículos de dos ruedas." },
    { id: "automoviles", categoryId: "vehicles", name: "Automóviles", description: "Vehículos de cuatro ruedas." },
    { id: "camionetas", categoryId: "vehicles", name: "Camionetas", description: "Vehículos de carga ligeros." },
    { id: "camiones", categoryId: "vehicles", name: "Camiones", description: "Vehículos de carga pesada." },
    { id: "buses", categoryId: "vehicles", name: "Buses", description: "Vehículos de transporte de pasajeros." },
    { id: "maquinaria-pesada", categoryId: "vehicles", name: "Maquinaria pesada", description: "Vehículos para construcción." },
    { id: "vehiculos-personales", categoryId: "vehicles", name: "Vehículos personales", description: "Vehículos para uso particular." },
    { id: "vehiculos-especiales", categoryId: "vehicles", name: "Vehículos especiales", description: "Vehículos para usos específicos." },

    // Servicios
    { id: "profesionales", categoryId: "services", name: "Profesionales", description: "Servicios prestados por profesionales." },
    { id: "personales", categoryId: "services", name: "Personales", description: "Servicios para el cuidado personal." },
    { id: "hogar", categoryId: "services", name: "Hogar", description: "Servicios para el hogar." },
    { id: "transporte", categoryId: "services", name: "Transporte", description: "Servicios de traslado y envío." },
    { id: "tecnologia", categoryId: "services", name: "Tecnología", description: "Servicios relacionados con la tecnología." },
    { id: "educativos", categoryId: "services", name: "Educativos", description: "Servicios de enseñanza y formación." },
    { id: "salud-bienestar", categoryId: "services", name: "Salud y Bienestar", description: "Servicios para el cuidado de la salud." },
    { id: "creativos", categoryId: "services", name: "Creativos", description: "Servicios artísticos y de diseño." },

    // Productos
    { id: "electronica-tecnologia", categoryId: "products", name: "Electrónica y Tecnología", description: "Productos electrónicos." },
    { id: "hogar-jardin", categoryId: "products", name: "Hogar y Jardín", description: "Productos para la casa." },
    { id: "moda-accesorios", categoryId: "products", name: "Moda y Accesorios", description: "Ropa, calzado y complementos." },
    { id: "salud-bienestar", categoryId: "products", name: "Salud y Bienestar", description: "Productos para el cuidado." },
    { id: "cultura-entretenimiento", categoryId: "products", name: "Cultura y Entretenimiento", description: "Libros, música y películas." },
    { id: "vehiculos-repuestos", categoryId: "products", name: "Vehículos y Repuestos", description: "Partes para vehículos." },
    { id: "deportes-aventura", categoryId: "products", name: "Deportes y Aventura", description: "Equipamiento deportivo." },
    { id: "ninos-bebes", categoryId: "products", name: "Niños y Bebés", description: "Artículos para la infancia." },
    { id: "mascotas", categoryId: "products", name: "Mascotas", description: "Productos para animales." },

    // Eventos
    { id: "conciertos-festivales", categoryId: "events", name: "Conciertos y Festivales", description: "Espectáculos musicales." },
    { id: "conferencias-seminarios", categoryId: "events", name: "Conferencias y Seminarios", description: "Eventos académicos." },
    { id: "ferias-exposiciones", categoryId: "events", name: "Ferias y Exposiciones", description: "Eventos comerciales." },
    { id: "deportivos", categoryId: "events", name: "Deportivos", description: "Competiciones deportivas." },
    { id: "culturales", categoryId: "events", name: "Culturales", description: "Eventos artísticos." },
    { id: "academicos", categoryId: "events", name: "Académicos", description: "Eventos de educación." },
    { id: "religiosos", categoryId: "events", name: "Religiosos", description: "Celebraciones de fe." },
    { id: "politicos", categoryId: "events", name: "Políticos", description: "Eventos sobre política." },

    // Comunidad
    { id: "grupos", categoryId: "community", name: "Grupos", description: "Reuniones de personas." },
    { id: "clases", categoryId: "community", name: "Clases", description: "Cursos y talleres." },
    { id: "avisos", categoryId: "community", name: "Avisos", description: "Notificaciones a la comunidad." },
    { id: "voluntariado", categoryId: "community", name: "Voluntariado", description: "Actividades solidarias." },

    // Negocios
    { id: "venta-negocios", categoryId: "businesses", name: "Venta de Negocios", description: "Transacciones de empresas." },
    { id: "servicios-b2b", categoryId: "businesses", name: "Servicios B2B", description: "Servicios entre empresas." },
    { id: "equipamiento", categoryId: "businesses", name: "Equipamiento", description: "Maquinaria y mobiliario." },
    { id: "inversiones", categoryId: "businesses", name: "Inversiones", description: "Oportunidades de inversión." },
     { id: "asociaciones", categoryId: "businesses", name: "Asociaciones", description: "Agrupaciones empresariales." },
    { id: "alianzas", categoryId: "businesses", name: "Alianzas", description: "Acuerdos comerciales." },
  ];

  for (const subcategory of subcategories) {
    await insertSubcategory(subcategory);
  }
}

insertSubcategories();
