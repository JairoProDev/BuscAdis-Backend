const { createClient } = require("@supabase/supabase-js");

// Configuración de Supabase
const supabaseUrl = "https://kfamkhpxikqujvqjdrsn.supabase.co";
const supabaseServiceKey = "TU_SERVICE_KEY"; // Reemplazar con la clave real

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Categorías a insertar
const categories = [
  {
    name: "Empleos",
    description: "Encuentra tu próxima oportunidad laboral",
    gradient: "from-blue-500 to-blue-700",
    stats: ["1,234 ofertas", "Actualizado hoy"],
    icon_key: "BriefcaseIcon",
  },
  {
    name: "Inmuebles",
    description: "Propiedades en venta y alquiler",
    gradient: "from-green-500 to-green-700",
    stats: ["856 propiedades", "Cusco y alrededores"],
    icon_key: "HomeIcon",
  },
  {
    name: "Vehículos",
    description: "Autos, motos y más",
    gradient: "from-red-500 to-red-700",
    stats: ["432 vehículos", "Todas las marcas"],
    icon_key: "TruckIcon",
  },
  {
    name: "Servicios",
    description: "Servicios profesionales",
    gradient: "from-purple-500 to-purple-700",
    stats: ["978 servicios", "Profesionales verificados"],
    icon_key: "WrenchIcon",
  },
  {
    name: "Productos",
    description: "Artículos nuevos y usados",
    gradient: "from-yellow-500 to-yellow-700",
    stats: ["2,345 productos", "Envíos a todo Cusco"],
    icon_key: "ShoppingBagIcon",
  },
  {
    name: "Turismo",
    description: "Alojamiento y experiencias",
    gradient: "from-teal-500 to-teal-700",
    stats: ["543 experiencias", "Tours guiados"],
    icon_key: "GlobeAltIcon",
  },
  {
    name: "Eventos",
    description: "Eventos y entretenimiento",
    gradient: "from-pink-500 to-pink-700",
    stats: ["123 eventos", "Este mes"],
    icon_key: "CalendarIcon",
  },
  {
    name: "Educación",
    description: "Cursos y formación",
    gradient: "from-indigo-500 to-indigo-700",
    stats: ["765 cursos", "Certificados"],
    icon_key: "AcademicCapIcon",
  },
  {
    name: "Mascotas",
    description: "Animales y accesorios",
    gradient: "from-orange-500 to-orange-700",
    stats: ["321 anuncios", "Veterinarios certificados"],
    icon_key: "HeartIcon",
  },
];

async function initCategories() {
  console.log("Inicializando categorías en Supabase...");

  try {
    // Comprobar si ya existen categorías
    const { data: existingCategories, error: checkError } = await supabase
      .from("categories")
      .select("name");

    if (checkError) {
      throw checkError;
    }

    if (existingCategories.length > 0) {
      console.log("Ya existen categorías en la base de datos:");
      console.log(existingCategories.map((c) => c.name).join(", "));

      // Actualizar las categorías existentes
      for (const category of categories) {
        const exists = existingCategories.some((c) => c.name === category.name);

        if (exists) {
          console.log(`Actualizando categoría: ${category.name}`);

          const { error: updateError } = await supabase
            .from("categories")
            .update({
              description: category.description,
              gradient: category.gradient,
              stats: category.stats,
              icon_key: category.icon_key,
              updated_at: new Date().toISOString(),
            })
            .eq("name", category.name);

          if (updateError) {
            console.error(`Error al actualizar ${category.name}:`, updateError);
          }
        } else {
          console.log(`Insertando nueva categoría: ${category.name}`);

          const { error: insertError } = await supabase
            .from("categories")
            .insert([
              {
                ...category,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);

          if (insertError) {
            console.error(`Error al insertar ${category.name}:`, insertError);
          }
        }
      }
    } else {
      // Insertar todas las categorías
      console.log("No existen categorías. Insertando todas...");

      const { error: insertError } = await supabase.from("categories").insert(
        categories.map((category) => ({
          ...category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );

      if (insertError) {
        throw insertError;
      }
    }

    console.log("Categorías inicializadas correctamente");
  } catch (error) {
    console.error("Error al inicializar categorías:", error);
  }
}

// Ejecutar la función
initCategories();
