const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { fromNodeProviderChain } = require("@aws-sdk/credential-providers");

async function insertSubSubcategory(subSubcategory) {
  try {
    const credentials = await fromNodeProviderChain();
    const client = new DynamoDBClient({
      region: "us-east-2",
      credentials,
    });

    const params = {
      TableName: "SubSubcategories",
      Item: {
        id: { S: subSubcategory.id },
        subcategoryId: { S: subSubcategory.subcategoryId },
        name: { S: subSubcategory.name },
        description: { S: subSubcategory.description },
        createdAt: { S: new Date().toISOString() },
        updatedAt: { S: new Date().toISOString() },
      },
    };

    const command = new PutItemCommand(params);
    await client.send(command);
    console.log(`Sub-subcategoría ${subSubcategory.name} insertada con éxito.`);
  } catch (error) {
    console.error("Error al insertar sub-subcategoría:", error);
  }
}

async function insertSubSubcategories() {
  const subSubcategories = [
    // Empleos - Tecnología e Informática
    { id: "desarrollo-software", subcategoryId: "tecnologia-informatica", name: "Desarrollo de Software", description: "Empleos en desarrollo de software." },
    { id: "ciberseguridad", subcategoryId: "tecnologia-informatica", name: "Ciberseguridad", description: "Empleos en ciberseguridad." },
    { id: "analisis-datos", subcategoryId: "tecnologia-informatica", name: "Análisis de Datos", description: "Empleos en análisis de datos." },
    { id: "inteligencia-artificial", subcategoryId: "tecnologia-informatica", name: "Inteligencia Artificial y Machine Learning", description: "Empleos en IA y ML." },
    { id: "soporte-tecnico", subcategoryId: "tecnologia-informatica", name: "Soporte Técnico", description: "Empleos en soporte técnico." },
    { id: "gestion-proyectos-ti", subcategoryId: "tecnologia-informatica", name: "Gestión de Proyectos de TI", description: "Empleos en gestión de proyectos." },
    { id: "redes-sistemas", subcategoryId: "tecnologia-informatica", name: "Redes y Sistemas", description: "Empleos en redes." },

    // Empleos - Salud y Medicina
    { id: "medicina-general", subcategoryId: "salud-medicina", name: "Medicina General", description: "Empleos en medicina general." },
    { id: "especialidades-medicas", subcategoryId: "salud-medicina", name: "Especialidades Médicas", description: "Empleos en especialidades médicas." },
    { id: "enfermeria", subcategoryId: "salud-medicina", name: "Enfermería", description: "Empleos en enfermería." },
    { id: "farmacia", subcategoryId: "salud-medicina", name: "Farmacia", description: "Empleos en farmacia." },
    { id: "odontologia", subcategoryId: "salud-medicina", name: "Odontología", description: "Empleos en odontología." },
    { id: "psicologia", subcategoryId: "salud-medicina", name: "Psicología", description: "Empleos en psicología." },
    { id: "terapia", subcategoryId: "salud-medicina", name: "Terapia", description: "Empleos en terapia." },

    // Empleos - Educación y Formación
    { id: "educacion-primaria-secundaria", subcategoryId: "educacion-formacion", name: "Educación Primaria/Secundaria", description: "Empleos en educación primaria." },
    { id: "educacion-superior", subcategoryId: "educacion-formacion", name: "Educación Superior", description: "Empleos en educación superior." },
    { id: "formacion-profesional", subcategoryId: "educacion-formacion", name: "Formación Profesional", description: "Empleos en formación." },
    { id: "idiomas", subcategoryId: "educacion-formacion", name: "Idiomas", description: "Empleos en enseñanza de idiomas." },
     { id: "educacion-en-linea", subcategoryId: "educacion-formacion", name: "Educación en línea", description: "Empleos en educación en línea." },

    // Empleos - Construcción e Ingeniería
    { id: "ingenieria-civil", subcategoryId: "construccion-ingenieria", name: "Ingeniería Civil", description: "Empleos en ingeniería civil." },
    { id: "arquitectura", subcategoryId: "construccion-ingenieria", name: "Arquitectura", description: "Empleos en arquitectura." },
    { id: "ingenieria-mecanica", subcategoryId: "construccion-ingenieria", name: "Ingeniería Mecánica", description: "Empleos en ingeniería mecánica." },
    { id: "ingenieria-electrica", subcategoryId: "construccion-ingenieria", name: "Ingeniería Eléctrica", description: "Empleos en ingeniería eléctrica." },
     { id: "diseno-interiores", subcategoryId: "construccion-ingenieria", name: "Diseño de interiores", description: "Empleos en diseño de interiores." },

    // Empleos - Ventas y Marketing
    { id: "ventas-directas", subcategoryId: "ventas-marketing", name: "Ventas Directas", description: "Empleos en ventas directas." },
    { id: "marketing-digital", subcategoryId: "ventas-marketing", name: "Marketing Digital", description: "Empleos en marketing digital." },
    { id: "marketing-contenidos", subcategoryId: "ventas-marketing", name: "Marketing de Contenidos", description: "Empleos en marketing de contenidos." },
    { id: "marketing-producto", subcategoryId: "ventas-marketing", name: "Marketing de Producto", description: "Empleos en marketing de producto." },
    { id: "telemarketing", subcategoryId: "ventas-marketing", name: "Telemarketing", description: "Empleos en telemarketing." },
    { id: "ventas-b2b", subcategoryId: "ventas-marketing", name: "Ventas B2B", description: "Empleos en ventas B2B." },
    { id: "ventas-b2c", subcategoryId: "ventas-marketing", name: "Ventas B2C", description: "Empleos en ventas B2C." },

    // Empleos - Finanzas y Contabilidad
    { id: "contabilidad-general", subcategoryId: "finanzas-contabilidad", name: "Contabilidad General", description: "Empleos en contabilidad." },
    { id: "auditoria", subcategoryId: "finanzas-contabilidad", name: "Auditoría", description: "Empleos en auditoría." },
    { id: "finanzas-corporativas", subcategoryId: "finanzas-contabilidad", name: "Finanzas Corporativas", description: "Empleos en finanzas corporativas." },
    { id: "analisis-financiero", subcategoryId: "finanzas-contabilidad", name: "Análisis Financiero", description: "Empleos en análisis financiero." },
    { id: "impuestos", subcategoryId: "finanzas-contabilidad", name: "Impuestos", description: "Empleos en impuestos." },

    // Empleos - Transporte y Logística
    { id: "transporte-carga", subcategoryId: "transporte-logistica", name: "Transporte de Carga", description: "Empleos en transporte de carga." },
    { id: "logistica-almacenamiento", subcategoryId: "transporte-logistica", name: "Logística de Almacenamiento", description: "Empleos en logística." },
    { id: "distribucion", subcategoryId: "transporte-logistica", name: "Distribución", description: "Empleos en distribución." },
    { id: "transporte-pasajeros", subcategoryId: "transporte-logistica", name: "Transporte de Pasajeros", description: "Empleos en transporte de pasajeros." },
    { id: "cadena-suministro", subcategoryId: "transporte-logistica", name: "Cadena de Suministro", description: "Empleos en cadena de suministro." },

    // Empleos - Hostelería, Turismo y Gastronomía
    { id: "hoteleria", subcategoryId: "hosteleria-turismo-gastronomia", name: "Hotelería", description: "Empleos en hotelería." },
    { id: "restaurantes", subcategoryId: "hosteleria-turismo-gastronomia", name: "Restaurantes", description: "Empleos en restaurantes." },
    { id: "turismo", subcategoryId: "hosteleria-turismo-gastronomia", name: "Turismo", description: "Empleos en turismo." },
    { id: "organizacion-eventos", subcategoryId: "hosteleria-turismo-gastronomia", name: "Organización de Eventos", description: "Empleos en organización de eventos." },
     { id: "ecoturismo", subcategoryId: "hosteleria-turismo-gastronomia", name: "Ecoturismo", description: "Empleos en ecoturismo." },

    // Empleos - Arte, Diseño y Multimedia
    { id: "diseno-grafico", subcategoryId: "arte-diseno-multimedia", name: "Diseño Gráfico", description: "Empleos en diseño gráfico." },
    { id: "diseno-web", subcategoryId: "arte-diseno-multimedia", name: "Diseño Web", description: "Empleos en diseño web." },
    { id: "diseno-interiores", subcategoryId: "arte-diseno-multimedia", name: "Diseño de Interiores", description: "Empleos en diseño de interiores." },
    { id: "fotografia", subcategoryId: "arte-diseno-multimedia", name: "Fotografía", description: "Empleos en fotografía." },
    { id: "produccion-audiovisual", subcategoryId: "arte-diseno-multimedia", name: "Producción Audiovisual", description: "Empleos en producción audiovisual." },
    { id: "diseno-moda", subcategoryId: "arte-diseno-multimedia", name: "Diseño de Moda", description: "Empleos en diseño de moda." },

    // Empleos - Agricultura y Ganadería
    { id: "cultivo", subcategoryId: "agricultura-ganaderia", name: "Cultivo", description: "Empleos en agricultura." },
    { id: "ganaderia", subcategoryId: "agricultura-ganaderia", name: "Ganadería", description: "Empleos en ganadería." },
    { id: "agroindustria", subcategoryId: "agricultura-ganaderia", name: "Agroindustria", description: "Empleos en agroindustria." },
    { id: "pesca", subcategoryId: "agricultura-ganaderia", name: "Pesca", description: "Empleos en pesca." },
    { id: "silvicultura", subcategoryId: "agricultura-ganaderia", name: "Silvicultura", description: "Empleos en silvicultura." },

    // Empleos - Servicios Domésticos y Personales
    { id: "cuidado-ninos", subcategoryId: "servicios-domesticos-personales", name: "Cuidado de Niños", description: "Empleos en cuidado de niños." },
    { id: "cuidado-adultos-mayores", subcategoryId: "servicios-domesticos-personales", name: "Cuidado de Adultos Mayores", description: "Empleos en cuidado de adultos mayores." },
    { id: "limpieza-hogar", subcategoryId: "servicios-domesticos-personales", name: "Limpieza del Hogar", description: "Empleos en limpieza del hogar." },
    { id: "jardineria", subcategoryId: "servicios-domesticos-personales", name: "Jardinería", description: "Empleos en jardinería." },
    { id: "cocina", subcategoryId: "servicios-domesticos-personales", name: "Cocina", description: "Empleos en cocina." },
    { id: "asistencia-personal", subcategoryId: "servicios-domesticos-personales", name: "Asistencia Personal", description: "Empleos en asistencia personal." },

    // Inmuebles - Habitaciones
    { id: "habitacion-individual", subcategoryId: "habitaciones", name: "Individual", description: "Habitaciones individuales." },
    { id: "habitacion-compartida", subcategoryId: "habitaciones", name: "Compartida", description: "Habitaciones compartidas." },
    { id: "habitacion-amoblada", subcategoryId: "habitaciones", name: "Amoblada", description: "Habitaciones amobladas." },
    { id: "habitacion-sin-amoblar", subcategoryId: "habitaciones", name: "Sin amoblar", description: "Habitaciones sin amoblar." },

    // Inmuebles - Apartamentos
    { id: "apartamento-estudio", subcategoryId: "apartamentos", name: "Estudio", description: "Apartamentos tipo estudio." },
    { id: "apartamento-1-dormitorio", subcategoryId: "apartamentos", name: "De 1 dormitorio", description: "Apartamentos de una habitación." },
    { id: "apartamento-2-dormitorios", subcategoryId: "apartamentos", name: "De 2 dormitorios", description: "Apartamentos de dos habitaciones." },
    { id: "apartamento-3-mas-dormitorios", subcategoryId: "apartamentos", name: "De 3+ dormitorios", description: "Apartamentos de tres o más habitaciones." },
    { id: "apartamento-duplex", subcategoryId: "apartamentos", name: "Dúplex", description: "Apartamentos dúplex." },

    // Inmuebles - Casas
    { id: "casa-1-piso", subcategoryId: "casas", name: "De 1 piso", description: "Casas de una planta." },
    { id: "casa-2-pisos", subcategoryId: "casas", name: "De 2 pisos", description: "Casas de dos plantas." },
    { id: "casa-3-mas-pisos", subcategoryId: "casas", name: "De 3+ pisos", description: "Casas de tres o más plantas." },
    { id: "casa-con-jardin", subcategoryId: "casas", name: "Con jardín", description: "Casas con jardín." },
    { id: "casa-con-piscina", subcategoryId: "casas", name: "Con piscina", description: "Casas con piscina." },

    // Inmuebles - Terrenos
    { id: "terreno-residencial", subcategoryId: "terrenos", name: "Residencial", description: "Terrenos residenciales." },
    { id: "terreno-comercial", subcategoryId: "terrenos", name: "Comercial", description: "Terrenos comerciales." },
    { id: "terreno-agricola", subcategoryId: "terrenos", name: "Agrícola", description: "Terrenos agrícolas." },
     { id: "terreno-industrial", subcategoryId: "terrenos", name: "Industrial", description: "Terrenos industriales." },
      { id: "terreno-urbanizable", subcategoryId: "terrenos", name: "Urbanizable", description: "Terrenos urbanizables." },

    // Inmuebles - Locales
    { id: "local-oficina", subcategoryId: "locales", name: "Oficina", description: "Locales para oficina." },
    { id: "local-tienda", subcategoryId: "locales", name: "Tienda", description: "Locales para tienda." },
    { id: "local-restaurante", subcategoryId: "locales", name: "Restaurante", description: "Locales para restaurante." },
    { id: "local-almacen", subcategoryId: "locales", name: "Almacén", description: "Locales para almacén." },
     { id: "local-consultorio", subcategoryId: "locales", name: "Consultorio", description: "Locales para consultorio." },

    // Inmuebles - Oficinas
     { id: "oficina-coworking", subcategoryId: "oficinas", name: "Coworking", description: "Oficinas para Coworking." },
    { id: "oficina-privada", subcategoryId: "oficinas", name: "Privada", description: "Oficinas Privadas." },
    { id: "oficina-amoblada", subcategoryId: "oficinas", name: "Amoblada", description: "Oficinas Amobladas." },
    { id: "oficina-edificio-oficinas", subcategoryId: "oficinas", name: "Edificio de Oficinas", description: "Oficinas en Edificio de Oficinas." },

    // Inmuebles - Edificios
    { id: "edificio-residencial", subcategoryId: "edificios", name: "Residencial", description: "Edificios residenciales." },
    { id: "edificio-comercial", subcategoryId: "edificios", name: "Comercial", description: "Edificios comerciales." },
    { id: "edificio-mixto", subcategoryId: "edificios", name: "Mixto", description: "Edificios de uso mixto." },
     { id: "edificio-corporativo", subcategoryId: "edificios", name: "Corporativo", description: "Edificios corporativos." },

    // Inmuebles - Almacenes
    { id: "almacen-pequeno", subcategoryId: "almacenes", name: "Pequeño", description: "Almacenes pequeños." },
    { id: "almacen-mediano", subcategoryId: "almacenes", name: "Mediano", description: "Almacenes medianos." },
    { id: "almacen-grande", subcategoryId: "almacenes", name: "Grande", description: "Almacenes grandes." },
     { id: "almacen-industrial", subcategoryId: "almacenes", name: "Industrial", description: "Almacenes industriales." },

    // Vehículos - Motocicletas
    { id: "motocicleta-lineal", subcategoryId: "motocicletas", name: "Lineal", description: "Motocicletas lineales." },
    { id: "motocicleta-deportiva", subcategoryId: "motocicletas", name: "Deportiva", description: "Motocicletas deportivas." },
    { id: "motocicleta-scooter", subcategoryId: "motocicletas", name: "Scooter", description: "Motocicletas scooter." },
    { id: "motocicleta-todoterreno", subcategoryId: "motocicletas", name: "Todoterreno", description: "Motocicletas todoterreno." },
    { id: "motocicleta-electrica", subcategoryId: "motocicletas", name: "Eléctrica", description: "Motocicletas eléctricas." },

    // Vehículos - Automóviles
    { id: "automovil-sedan", subcategoryId: "automoviles", name: "Sedán", description: "Automóviles sedán." },
    { id: "automovil-hatchback", subcategoryId: "automoviles", name: "Hatchback", description: "Automóviles hatchback." },
    { id: "automovil-suv", subcategoryId: "automoviles", name: "SUV", description: "Automóviles SUV." },
    { id: "automovil-cupe", subcategoryId: "automoviles", name: "Cupé", description: "Automóviles cupé." },
    { id: "automovil-convertible", subcategoryId: "automoviles", name: "Convertible", description: "Automóviles convertibles." },
    { id: "automovil-electrico", subcategoryId: "automoviles", name: "Eléctrico", description: "Automóviles eléctricos." },
    { id: "automovil-hibrido", subcategoryId: "automoviles", name: "Híbrido", description: "Automóviles híbridos." },

    // Vehículos - Camionetas
    { id: "camioneta-pick-up", subcategoryId: "camionetas", name: "Pick-up", description: "Camionetas pick-up." },
    { id: "camioneta-suv", subcategoryId: "camionetas", name: "SUV", description: "Camionetas SUV." },

    // Vehículos - Camiones
    { id: "camion-de-carga", subcategoryId: "camiones", name: "De carga", description: "Camiones de carga." },
    { id: "camion-volquete", subcategoryId: "camiones", name: "Volquete", description: "Camiones volquete." },
    { id: "camion-cisterna", subcategoryId: "camiones", name: "Cisterna", description: "Camiones cisterna." },

    // Vehículos - Buses
    { id: "bus-urbano", subcategoryId: "buses", name: "Urbano", description: "Buses urbanos." },
    { id: "bus-interprovincial", subcategoryId: "buses", name: "Interprovincial", description: "Buses interprovinciales." },
    { id: "bus-escolar", subcategoryId: "buses", name: "Escolar", description: "Buses escolares." },

    // Vehículos - Maquinaria Pesada
    { id: "maquinaria-excavadora", subcategoryId: "maquinaria-pesada", name: "Excavadora", description: "Excavadoras." },
    { id: "maquinaria-retroexcavadora", subcategoryId: "maquinaria-pesada", name: "Retroexcavadora", description: "Retroexcavadoras." },
    { id: "maquinaria-grua", subcategoryId: "maquinaria-pesada", name: "Grúa", description: "Grúas." },
     { id: "maquinaria-tractor", subcategoryId: "maquinaria-pesada", name: "Tractor", description: "Tractores." },

    // Vehículos - Vehículos Personales
    { id: "vehiculo-bicicleta", subcategoryId: "vehiculos-personales", name: "Bicicleta", description: "Bicicletas." },
    { id: "vehiculo-scooter-electrico", subcategoryId: "vehiculos-personales", name: "Scooter Eléctrico", description: "Scooters eléctricos." },
    { id: "vehiculo-patineta-electrica", subcategoryId: "vehiculos-personales", name: "Patineta Eléctrica", description: "Patinetas eléctricas." },

    // Vehículos - Vehículos Especiales
    { id: "vehiculo-ambulancia", subcategoryId: "vehiculos-especiales", name: "Ambulancia", description: "Ambulancias." },
    { id: "vehiculo-bomberos", subcategoryId: "vehiculos-especiales", name: "Bomberos", description: "Vehículos de bomberos." },
    { id: "vehiculo-policia", subcategoryId: "vehiculos-especiales", name: "Policía", description: "Vehículos de policía." },
    { id: "vehiculo-limpieza", subcategoryId: "vehiculos-especiales", name: "Limpieza", description: "Vehículos de limpieza." },

    // Servicios - Servicios Profesionales
    { id: "servicio-abogacia", subcategoryId: "profesionales", name: "Abogacía", description: "Servicios de abogacía." },
    { id: "servicio-contabilidad", subcategoryId: "profesionales", name: "Contabilidad", description: "Servicios de contabilidad." },
    { id: "servicio-consultoria", subcategoryId: "profesionales", name: "Consultoría", description: "Servicios de consultoría." },
    { id: "servicio-diseno-grafico", subcategoryId: "profesionales", name: "Diseño Gráfico", description: "Servicios de diseño gráfico." },
    { id: "servicio-marketing-digital", subcategoryId: "profesionales", name: "Marketing Digital", description: "Servicios de marketing digital." },
     { id: "servicio-arquitectura", subcategoryId: "profesionales", name: "Arquitectura", description: "Servicios de arquitectura." },
      { id: "servicio-ingenieria", subcategoryId: "profesionales", name: "Ingeniería", description: "Servicios de ingeniería." },

    // Servicios - Servicios Personales
    { id: "servicio-belleza", subcategoryId: "personales", name: "Belleza", description: "Servicios de belleza." },
    { id: "servicio-salud", subcategoryId: "personales", name: "Salud", description: "Servicios de salud." },
    { id: "servicio-eventos", subcategoryId: "personales", name: "Eventos", description: "Servicios para eventos." },
    { id: "servicio-cuidado-mascotas", subcategoryId: "personales", name: "Cuidado de Mascotas", description: "Servicios de cuidado de mascotas." },
     { id: "servicio-fotografia", subcategoryId: "personales", name: "Fotografía", description: "Servicios de Fotografía." },

    // Servicios - Servicios para el Hogar
    { id: "servicio-reparacion", subcategoryId: "servicios-hogar", name: "Reparación", description: "Servicios de reparación para el hogar." },
    { id: "servicio-mantenimiento", subcategoryId: "servicios-hogar", name: "Mantenimiento", description: "Servicios de mantenimiento para el hogar." },
    { id: "servicio-instalacion", subcategoryId: "servicios-hogar", name: "Instalación", description: "Servicios de instalación para el hogar." },
    { id: "servicio-mudanza", subcategoryId: "servicios-hogar", name: "Mudanza", description: "Servicios de mudanza." },
    { id: "servicio-fumigacion", subcategoryId: "servicios-hogar", name: "Fumigación", description: "Servicios de fumigación." },

    // Productos - Tecnología
    { id: "producto-computadoras", subcategoryId: "tecnologia", name: "Computadoras", description: "Productos de computadoras." },
    { id: "producto-celulares", subcategoryId: "tecnologia", name: "Celulares", description: "Productos de celulares." },
    { id: "producto-televisiones", subcategoryId: "tecnologia", name: "Televisiones", description: "Productos de televisiones." },
    { id: "producto-audio", subcategoryId: "tecnologia", name: "Audio", description: "Productos de audio." },
    { id: "producto-videojuegos", subcategoryId: "tecnologia", name: "Videojuegos", description: "Productos de videojuegos." },
    { id: "producto-accesorios-computacion", subcategoryId: "tecnologia", name: "Accesorios de Computación", description: "Productos de accesorios de computación." },
    { id: "producto-electrodomesticos", subcategoryId: "tecnologia", name: "Electrodomésticos", description: "Productos de electrodomésticos." },

    // Productos - Hogar y Jardín
    { id: "producto-muebles", subcategoryId: "hogar-jardin", name: "Muebles", description: "Productos de muebles." },
    { id: "producto-decoracion", subcategoryId: "hogar-jardin", name: "Decoración", description: "Productos de decoración." },
    { id: "producto-jardin", subcategoryId: "hogar-jardin", name: "Jardín", description: "Productos para jardín." },
    { id: "producto-iluminacion", subcategoryId: "hogar-jardin", name: "Iluminación", description: "Productos de iluminación." },
    { id: "producto-textiles", subcategoryId: "hogar-jardin", name: "Textiles", description: "Productos textiles." },
    { id: "producto-banio", subcategoryId: "hogar-jardin", name: "Baño", description: "Productos para el baño." },
    { id: "producto-cocina", subcategoryId: "hogar-jardin", name: "Cocina", description: "Productos para la cocina." },

    // Productos - Moda y Belleza
    { id: "producto-ropa-hombre", subcategoryId: "moda-belleza", name: "Ropa Hombre", description: "Productos de ropa para hombre." },
    { id: "producto-ropa-mujer", subcategoryId: "moda-belleza", name: "Ropa Mujer", description: "Productos de ropa para mujer." },
    { id: "producto-calzado", subcategoryId: "moda-belleza", name: "Calzado", description: "Productos de calzado." },
    { id: "producto-accesorios-moda", subcategoryId: "moda-belleza", name: "Accesorios de Moda", description: "Productos de accesorios de moda." },
    { id: "producto-belleza", subcategoryId: "moda-belleza", name: "Belleza", description: "Productos de belleza." },
    { id: "producto-joyeria", subcategoryId: "moda-belleza", name: "Joyería", description: "Productos de joyería." },
    { id: "producto-relojes", subcategoryId: "moda-belleza", name: "Relojes", description: "Productos de relojes." },

    // Productos - Deportes y Ocio
    { id: "producto-deportes", subcategoryId: "deportes-ocio", name: "Deportes", description: "Productos para deportes." },
    { id: "producto-gimnasio", subcategoryId: "deportes-ocio", name: "Gimnasio", description: "Productos para gimnasio." },
    { id: "producto-camping", subcategoryId: "deportes-ocio", name: "Camping", description: "Productos para camping." },
    { id: "producto-ciclismo", subcategoryId: "deportes-ocio", name: "Ciclismo", description: "Productos para ciclismo." },
    { id: "producto-instrumentos-musicales", subcategoryId: "deportes-ocio", name: "Instrumentos Musicales", description: "Productos de instrumentos musicales." },
    { id: "producto-arte", subcategoryId: "deportes-ocio", name: "Arte", description: "Productos para arte." },
    { id: "producto-juguetes", subcategoryId: "deportes-ocio", name: "Juguetes", description: "Productos de juguetes." },

    // Productos - Supermercado
    { id: "producto-alimentos", subcategoryId: "supermercado", name: "Alimentos", description: "Productos de alimentos." },
    { id: "producto-bebidas", subcategoryId: "supermercado", name: "Bebidas", description: "Productos de bebidas." },
    { id: "producto-limpieza", subcategoryId: "supermercado", name: "Limpieza", description: "Productos de limpieza." },
    { id: "producto-cuidado-personal", subcategoryId: "supermercado", name: "Cuidado Personal", description: "Productos de cuidado personal." },
    { id: "producto-bebe", subcategoryId: "supermercado", name: "Bebé", description: "Productos para bebé." },
    { id: "producto-mascotas", subcategoryId: "supermercado", name: "Mascotas", description: "Productos para mascotas." },

    // Productos - Libros, Películas y Música
    { id: "producto-libros", subcategoryId: "libros-peliculas-musica", name: "Libros", description: "Productos de libros." },
    { id: "producto-peliculas", subcategoryId: "libros-peliculas-musica", name: "Películas", description: "Productos de películas." },
    { id: "producto-musica", subcategoryId: "libros-peliculas-musica", name: "Música", description: "Productos de música." },
    { id: "producto-videojuegos", subcategoryId: "libros-peliculas-musica", name: "Videojuegos", description: "Productos de videojuegos." },
    { id: "producto-comics", subcategoryId: "libros-peliculas-musica", name: "Cómics", description: "Productos de cómics." },

    // Productos - Salud y Cuidado Personal
    { id: "producto-vitaminas", subcategoryId: "salud-cuidado-personal", name: "Vitaminas", description: "Productos de vitaminas." },
    { id: "producto-suplementos", subcategoryId: "salud-cuidado-personal", name: "Suplementos", description: "Productos de suplementos." },
    { id: "producto-cuidado-dental", subcategoryId: "salud-cuidado-personal", name: "Cuidado Dental", description: "Productos de cuidado dental." },
    { id: "producto-cuidado-cabello", subcategoryId: "salud-cuidado-personal", name: "Cuidado Cabello", description: "Productos para el cuidado del cabello." },
    { id: "producto-primeros-auxilios", subcategoryId: "salud-cuidado-personal", name: "Primeros Auxilios", description: "Productos de primeros auxilios." },

    // Productos - Oficina y Papelería
    { id: "producto-material-oficina", subcategoryId: "oficina-papeleria", name: "Material de Oficina", description: "Productos de material de oficina." },
    { id: "producto-papeleria", subcategoryId: "oficina-papeleria", name: "Papelería", description: "Productos de papelería." },
    { id: "producto-mobiliario-oficina", subcategoryId: "oficina-papeleria", name: "Mobiliario de Oficina", description: "Productos de mobiliario de oficina." },
    { id: "producto-tecnologia-oficina", subcategoryId: "oficina-papeleria", name: "Tecnología para Oficina", description: "Productos de tecnología para oficina." },

    // Eventos - Conciertos
    { id: "evento-concierto-rock", subcategoryId: "conciertos", name: "Rock", description: "Eventos de conciertos de rock." },
    { id: "evento-concierto-pop", subcategoryId: "conciertos", name: "Pop", description: "Eventos de conciertos de pop." },
    { id: "evento-concierto-electronica", subcategoryId: "conciertos", name: "Electrónica", description: "Eventos de conciertos de electrónica." },
    { id: "evento-concierto-clasica", subcategoryId: "conciertos", name: "Clásica", description: "Eventos de conciertos de música clásica." },
    { id: "evento-concierto-hiphop", subcategoryId: "conciertos", name: "Hip Hop", description: "Eventos de conciertos de hip hop." },
    { id: "evento-concierto-reggaeton", subcategoryId: "conciertos", name: "Reggaeton", description: "Eventos de conciertos de reggaeton." },

    // Eventos - Deportes
    { id: "evento-futbol", subcategoryId: "deportes", name: "Fútbol", description: "Eventos de fútbol." },
    { id: "evento-baloncesto", subcategoryId: "deportes", name: "Baloncesto", description: "Eventos de baloncesto." },
    { id: "evento-tenis", subcategoryId: "deportes", name: "Tenis", description: "Eventos de tenis." },
    { id: "evento-atletismo", subcategoryId: "deportes", name: "Atletismo", description: "Eventos de atletismo." },
    { id: "evento-carreras", subcategoryId: "deportes", name: "Carreras", description: "Eventos de carreras." },
    { id: "evento-deportes-extremos", subcategoryId: "deportes", name: "Deportes Extremos", description: "Eventos de deportes extremos." },

    // Eventos - Teatro
    { id: "evento-teatro-drama", subcategoryId: "teatro", name: "Drama", description: "Eventos de teatro de drama." },
    { id: "evento-teatro-comedia", subcategoryId: "teatro", name: "Comedia", description: "Eventos de teatro de comedia." },
    { id: "evento-teatro-musical", subcategoryId: "teatro", name: "Musical", description: "Eventos de teatro musical." },
    { id: "evento-teatro-infantil", subcategoryId: "teatro", name: "Infantil", description: "Eventos de teatro infantil." },
    { id: "evento-teatro-danza", subcategoryId: "teatro", name: "Danza", description: "Eventos de teatro de danza." },

    // Eventos - Conferencias
    { id: "evento-conferencia-tecnologia", subcategoryId: "conferencias", name: "Tecnología", description: "Eventos de conferencias de tecnología." },
    { id: "evento-conferencia-negocios", subcategoryId: "conferencias", name: "Negocios", description: "Eventos de conferencias de negocios." },
    { id: "evento-conferencia-salud", subcategoryId: "conferencias", name: "Salud", description: "Eventos de conferencias de salud." },
    { id: "evento-conferencia-educacion", subcategoryId: "conferencias", name: "Educación", description: "Eventos de conferencias de educación." },
    { id: "evento-conferencia-ciencia", subcategoryId: "conferencias", name: "Ciencia", description: "Eventos de conferencias de ciencia." },

    // Eventos - Festivales
    { id: "evento-festival-musica", subcategoryId: "festivales", name: "Música", description: "Eventos de festivales de música." },
    { id: "evento-festival-cine", subcategoryId: "festivales", name: "Cine", description: "Eventos de festivales de cine." },
    { id: "evento-festival-gastronomia", subcategoryId: "festivales", name: "Gastronomía", description: "Eventos de festivales de gastronomía." },
    { id: "evento-festival-arte", subcategoryId: "festivales", name: "Arte", description: "Eventos de festivales de arte." },
    { id: "evento-festival-cultura", subcategoryId: "festivales", name: "Cultura", description: "Eventos de festivales de cultura." },

    // Eventos - Cursos y Talleres
    { id: "evento-curso-cocina", subcategoryId: "cursos-talleres", name: "Cocina", description: "Eventos de cursos de cocina." },
    { id: "evento-curso-fotografia", subcategoryId: "cursos-talleres", name: "Fotografía", description: "Eventos de cursos de fotografía." },
    { id: "evento-curso-idiomas", subcategoryId: "cursos-talleres", name: "Idiomas", description: "Eventos de cursos de idiomas." },
    { id: "evento-taller-arte", subcategoryId: "cursos-talleres", name: "Arte", description: "Eventos de talleres de arte." },
    { id: "evento-taller-tecnologia", subcategoryId: "cursos-talleres", name: "Tecnología", description: "Eventos de talleres de tecnología." },

    // Educación - Cursos
    { id: "curso-primaria", subcategoryId: "cursos", name: "Primaria", description: "Cursos de nivel primaria." },
    { id: "curso-secundaria", subcategoryId: "cursos", name: "Secundaria", description: "Cursos de nivel secundaria." },
    { id: "curso-preparacion", subcategoryId: "cursos", name: "Preparación", description: "Cursos de preparación." },
    { id: "curso-universidad", subcategoryId: "cursos", name: "Universidad", description: "Cursos de nivel universidad." },
    { id: "curso-posgrado", subcategoryId: "cursos", name: "Posgrado", description: "Cursos de posgrado." },

    // Educación - Carreras
    { id: "carrera-ingenieria", subcategoryId: "carreras", name: "Ingeniería", description: "Carreras de ingeniería." },
    { id: "carrera-medicina", subcategoryId: "carreras", name: "Medicina", description: "Carreras de medicina." },
    { id: "carrera-derecho", subcategoryId: "carreras", name: "Derecho", description: "Carreras de derecho." },
    { id: "carrera-administracion", subcategoryId: "carreras", name: "Administración", description: "Carreras de administración." },
    { id: "carrera-arquitectura", subcategoryId: "carreras", name: "Arquitectura", description: "Carreras de arquitectura." },

    // Educación - Postgrados
    { id: "postgrado-maestria", subcategoryId: "postgrados", name: "Maestría", description: "Postgrados de maestría." },
    { id: "postgrado-doctorado", subcategoryId: "postgrados", name: "Doctorado", description: "Postgrados de doctorado." },
    { id: "postgrado-especializacion", subcategoryId: "postgrados", name: "Especialización", description: "Postgrados de especialización." },
    { id: "postgrado-mba", subcategoryId: "postgrados", name: "MBA", description: "Postgrados de MBA." },

    // Educación - Idiomas
    { id: "idioma-ingles", subcategoryId: "idiomas", name: "Inglés", description: "Cursos de inglés." },
    { id: "idioma-espanol", subcategoryId: "idiomas", name: "Español", description: "Cursos de español." },
    { id: "idioma-frances", subcategoryId: "idiomas", name: "Francés", description: "Cursos de francés." },
    { id: "idioma-aleman", subcategoryId: "idiomas", name: "Alemán", description: "Cursos de alemán." },
    { id: "idioma-mandarin", subcategoryId: "idiomas", name: "Mandarín", description: "Cursos de mandarín." },

    // Turismo - Paquetes Turísticos
    { id: "paquete-turistico-nacional", subcategoryId: "paquetes-turisticos", name: "Nacional", description: "Paquetes turísticos nacionales." },
    { id: "paquete-turistico-internacional", subcategoryId: "paquetes-turisticos", name: "Internacional", description: "Paquetes turísticos internacionales." },
    { id: "paquete-turistico-playa", subcategoryId: "paquetes-turisticos", name: "Playa", description: "Paquetes turísticos de playa." },
    { id: "paquete-turistico-montana", subcategoryId: "paquetes-turisticos", name: "Montaña", description: "Paquetes turísticos de montaña." },
    { id: "paquete-turistico-aventura", subcategoryId: "paquetes-turisticos", name: "Aventura", description: "Paquetes turísticos de aventura." },
    { id: "paquete-turistico-cultural", subcategoryId: "paquetes-turisticos", name: "Cultural", description: "Paquetes turísticos culturales." },

    // Turismo - Vuelos
    { id: "vuelo-nacional", subcategoryId: "vuelos", name: "Nacional", description: "Vuelos nacionales." },
    { id: "vuelo-internacional", subcategoryId: "vuelos", name: "Internacional", description: "Vuelos internacionales." },
    { id: "vuelo-directo", subcategoryId: "vuelos", name: "Directo", description: "Vuelos directos." },
    { id: "vuelo-escala", subcategoryId: "vuelos", name: "Con Escala", description: "Vuelos con escala." },
    { id: "vuelo-low-cost", subcategoryId: "vuelos", name: "Low Cost", description: "Vuelos de bajo costo." },

    // Turismo - Hoteles
    { id: "hotel-5-estrellas", subcategoryId: "hoteles", name: "5 Estrellas", description: "Hoteles de 5 estrellas." },
    { id: "hotel-4-estrellas", subcategoryId: "hoteles", name: "4 Estrellas", description: "Hoteles de 4 estrellas." },
    { id: "hotel-3-estrellas", subcategoryId: "hoteles", name: "3 Estrellas", description: "Hoteles de 3 estrellas." },
    { id: "hotel-boutique", subcategoryId: "hoteles", name: "Boutique", description: "Hoteles boutique." },
    { id: "hotel-resort", subcategoryId: "hoteles", name: "Resort", description: "Hoteles resort." },

    // Turismo - Alquiler de Autos
    { id: "auto-economico", subcategoryId: "alquiler-autos", name: "Económico", description: "Alquiler de autos económicos." },
    { id: "auto-compacto", subcategoryId: "alquiler-autos", name: "Compacto", description: "Alquiler de autos compactos." },
    { id: "auto-familiar", subcategoryId: "alquiler-autos", name: "Familiar", description: "Alquiler de autos familiares." },
    { id: "auto-lujo", subcategoryId: "alquiler-autos", name: "Lujo", description: "Alquiler de autos de lujo." },
    { id: "auto-suv", subcategoryId: "alquiler-autos", name: "SUV", description: "Alquiler de autos SUV." },

    // Turismo - Actividades
    { id: "actividad-tour", subcategoryId: "actividades", name: "Tour", description: "Actividades de tour." },
    { id: "actividad-excursion", subcategoryId: "actividades", name: "Excursión", description: "Actividades de excursión." },
    { id: "actividad-deporte-aventura", subcategoryId: "actividades", name: "Deporte de Aventura", description: "Actividades de deporte de aventura." },
    { id: "actividad-cultural", subcategoryId: "actividades", name: "Cultural", description: "Actividades culturales." },
    { id: "actividad-gastronomica", subcategoryId: "actividades", name: "Gastronómica", description: "Actividades gastronómicas." },

    // Mascotas - Perros
    { id: "mascota-perro-pequeno", subcategoryId: "perros", name: "Pequeño", description: "Perros de raza pequeña." },
    { id: "mascota-perro-mediano", subcategoryId: "perros", name: "Mediano", description: "Perros de raza mediana." },
    { id: "mascota-perro-grande", subcategoryId: "perros", name: "Grande", description: "Perros de raza grande." },
    { id: "mascota-perro-cachorro", subcategoryId: "perros", name: "Cachorro", description: "Cachorros de perro." },
    { id: "mascota-perro-adulto", subcategoryId: "perros", name: "Adulto", description: "Perros adultos." },

    // Mascotas - Gatos
    { id: "mascota-gato-pequeno", subcategoryId: "gatos", name: "Pequeño", description: "Gatos de raza pequeña." },
    { id: "mascota-gato-mediano", subcategoryId: "gatos", name: "Mediano", description: "Gatos de raza mediana." },
    { id: "mascota-gato-grande", subcategoryId: "gatos", name: "Grande", description: "Gatos de raza grande." },
    { id: "mascota-gato-cachorro", subcategoryId: "gatos", name: "Cachorro", description: "Cachorros de gato." },
    { id: "mascota-gato-adulto", subcategoryId: "gatos", name: "Adulto", description: "Gatos adultos." },

    // Mascotas - Otros Animales
    { id: "mascota-ave", subcategoryId: "otros-animales", name: "Ave", description: "Aves como mascota." },
    { id: "mascota-pez", subcategoryId: "otros-animales", name: "Pez", description: "Peces como mascota." },
    { id: "mascota-reptil", subcategoryId: "otros-animales", name: "Reptil", description: "Reptiles como mascota." },
    { id: "mascota-roedor", subcategoryId: "otros-animales", name: "Roedor", description: "Roedores como mascota." },
    { id: "mascota-anfibio", subcategoryId: "otros-animales", name: "Anfibio", description: "Anfibios como mascota." },

    // Negocios - Venta de Negocios
    { id: "negocio-venta-local", subcategoryId: "venta-negocios", name: "Local Comercial", description: "Negocios con local comercial en venta." },
    { id: "negocio-venta-online", subcategoryId: "venta-negocios", name: "Negocio Online", description: "Negocios online en venta." },
    { id: "negocio-venta-franquicia", subcategoryId: "venta-negocios", name: "Franquicia", description: "Franquicias en venta." },
    { id: "negocio-venta-traspaso", subcategoryId: "venta-negocios", name: "Traspaso", description: "Negocios en traspaso." },
    { id: "negocio-venta-fondo-comercio", subcategoryId: "venta-negocios", name: "Fondo de Comercio", description: "Negocios con fondo de comercio en venta." },

    // Negocios - Traspasos
    { id: "negocio-traspaso-local", subcategoryId: "traspasos", name: "Local Comercial", description: "Negocios con local comercial en traspaso." },
    { id: "negocio-traspaso-online", subcategoryId: "traspasos", name: "Negocio Online", description: "Negocios online en traspaso." },
    { id: "negocio-traspaso-franquicia", subcategoryId: "traspasos", name: "Franquicia", description: "Franquicias en traspaso." },
    { id: "negocio-traspaso-bar-restaurante", subcategoryId: "traspasos", name: "Bar/Restaurante", description: "Bares y restaurantes en traspaso" },

    // Negocios - Alquiler de Negocios
    { id: "negocio-alquiler-local", subcategoryId: "alquiler-negocios", name: "Local Comercial", description: "Negocios con local comercial en alquiler." },
    { id: "negocio-alquiler-oficina", subcategoryId: "alquiler-negocios", name: "Oficina", description: "Negocios con oficina en alquiler." },
    { id: "negocio-alquiler-almacen", subcategoryId: "alquiler-negocios", name: "Almacén", description: "Negocios con almacén en alquiler." },
    { id: "negocio-alquiler-terreno", subcategoryId: "alquiler-negocios", name: "Terreno", description: "Negocios con terreno en alquiler." },

    // Negocios - Socios
    { id: "negocio-socio-capital", subcategoryId: "socios", name: "Capital", description: "Búsqueda de socios capitalistas." },
    { id: "negocio-socio-inversor", subcategoryId: "socios", name: "Inversor", description: "Búsqueda de socios inversores." },
    { id: "negocio-socio-industrial", subcategoryId: "socios", name: "Industrial", description: "Búsqueda de socios industriales." },
    { id: "negocio-socio-tecnologico", subcategoryId: "socios", name: "Tecnológico", description: "Búsqueda de socios tecnológicos." },

    // Negocios - Franquicias
    { id: "negocio-franquicia-gastronomia", subcategoryId: "franquicias", name: "Gastronomía", description: "Franquicias de gastronomía." },
    { id: "negocio-franquicia-moda", subcategoryId: "franquicias", name: "Moda", description: "Franquicias de moda." },
    { id: "negocio-franquicia-servicios", subcategoryId: "franquicias", name: "Servicios", description: "Franquicias de servicios." },
    { id: "negocio-franquicia-retail", subcategoryId: "franquicias", name: "Retail", description: "Franquicias de retail." },

    // Negocios - Maquinarias y Equipos
    { id: "maquinaria-construccion", subcategoryId: "maquinarias-equipos", name: "Construcción", description: "Maquinaria para construcción." },
    { id: "maquinaria-industrial", subcategoryId: "maquinarias-equipos", name: "Industrial", description: "Maquinaria industrial." },
    { id: "maquinaria-agricola", subcategoryId: "maquinarias-equipos", name: "Agrícola", description: "Maquinaria agrícola." },
    { id: "maquinaria-oficina", subcategoryId: "maquinarias-equipos", name: "Oficina", description: "Maquinaria para oficina." },

    // Negocios - Insumos
    { id: "insumo-textil", subcategoryId: "insumos", name: "Textil", description: "Insumos textiles." },
    { id: "insumo-gastronomia", subcategoryId: "insumos", name: "Gastronomía", description: "Insumos para gastronomía." },
    { id: "insumo-construccion", subcategoryId: "insumos", name: "Construcción", description: "Insumos para construcción." },
    { id: "insumo-oficina", subcategoryId: "insumos", name: "Oficina", description: "Insumos de oficina." },

    // Negocios - Servicios para Negocios
    { id: "servicio-marketing", subcategoryId: "servicios-negocios", name: "Marketing", description: "Servicios de marketing para negocios." },
    { id: "servicio-consultoria", subcategoryId: "servicios-negocios", name: "Consultoría", description: "Servicios de consultoría para negocios." },
    { id: "servicio-legal", subcategoryId: "servicios-negocios", name: "Legal", description: "Servicios legales para negocios." },
    { id: "servicio-contabilidad", subcategoryId: "servicios-negocios", name: "Contabilidad", description: "Servicios de contabilidad para negocios." },
  ];

  for (const subSubcategory of subSubcategories) {
    await insertSubSubcategory(subSubcategory);
  }
}

insertSubSubcategories();
