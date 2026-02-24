import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Limpiar datos existentes
  await prisma.entrada.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.usuario.deleteMany();

  const password = await bcrypt.hash("admin123", 12);

  // Usuarios
  const admin = await prisma.usuario.create({
    data: {
      email: "admin@cruz.com",
      password,
      nombre: "Admin Cruz",
      rol: "ADMIN",
    },
  });

  const rrpp1 = await prisma.usuario.create({
    data: {
      email: "rrpp1@cruz.com",
      password,
      nombre: "Juan RRPP",
      rol: "RRPP",
    },
  });

  const rrpp2 = await prisma.usuario.create({
    data: {
      email: "rrpp2@cruz.com",
      password,
      nombre: "María RRPP",
      rol: "RRPP",
    },
  });

  await prisma.usuario.create({
    data: {
      email: "portero@cruz.com",
      password,
      nombre: "Carlos Portero",
      rol: "PORTERO",
    },
  });

  console.log("✓ Usuarios creados");

  // Eventos
  const evento1 = await prisma.evento.create({
    data: {
      nombre: "Noche de Sábado",
      fecha: new Date("2026-03-07"),
      horaApertura: "23:30",
      tipo: "NORMAL",
      capacidad: 200,
    },
  });

  const evento2 = await prisma.evento.create({
    data: {
      nombre: "Festival Dorado",
      fecha: new Date("2026-03-14"),
      horaApertura: "00:00",
      tipo: "ESPECIAL",
      capacidad: 500,
    },
  });

  const evento3 = await prisma.evento.create({
    data: {
      nombre: "Viernes Clásico",
      fecha: new Date("2026-03-06"),
      horaApertura: "23:00",
      tipo: "NORMAL",
      capacidad: 150,
    },
  });

  console.log("✓ Eventos creados");

  // Entradas
  const invitados = [
    { nombre: "Lucas García", dni: "40123456", email: "lucas.garcia@gmail.com" },
    { nombre: "Sofía Martínez", dni: "41234567", email: "sofia.martinez@gmail.com" },
    { nombre: "Mateo López", dni: "39876543", email: "mateo.lopez@gmail.com" },
    { nombre: "Valentina Rodríguez", dni: "42345678", email: "vale.rodriguez@gmail.com" },
    { nombre: "Tomás Fernández", dni: "38765432", email: "tomas.fernandez@gmail.com" },
    { nombre: "Camila Pérez", dni: "43456789", email: "cami.perez@gmail.com" },
    { nombre: "Joaquín González", dni: "37654321", email: "joaquin.gonzalez@gmail.com" },
    { nombre: "Martina Sánchez", dni: "44567890", email: "martina.sanchez@gmail.com" },
    { nombre: "Benjamín Ramírez", dni: "36543210", email: "benja.ramirez@gmail.com" },
    { nombre: "Isabella Torres", dni: "45678901", email: "isa.torres@gmail.com" },
  ];

  const eventos = [evento1, evento2, evento3];
  const rrpps = [rrpp1, rrpp2];
  const estados = ["PENDIENTE", "ENVIADO", "INGRESADO", "INVALIDADO"] as const;

  for (let i = 0; i < invitados.length; i++) {
    await prisma.entrada.create({
      data: {
        nombreInvitado: invitados[i].nombre,
        dniInvitado: invitados[i].dni,
        emailInvitado: invitados[i].email,
        eventoId: eventos[i % eventos.length].id,
        generadoPorId: rrpps[i % rrpps.length].id,
        estado: estados[i % estados.length],
        fechaIngreso: estados[i % estados.length] === "INGRESADO" ? new Date() : null,
      },
    });
  }

  console.log("✓ Entradas creadas");
  console.log("\n--- Credenciales de prueba ---");
  console.log("Todos los usuarios: password = admin123");
  console.log("Admin:   admin@cruz.com");
  console.log("RRPP 1:  rrpp1@cruz.com");
  console.log("RRPP 2:  rrpp2@cruz.com");
  console.log("Portero: portero@cruz.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
