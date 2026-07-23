import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const center = [-14.8912, 13.4962];

async function main() {
  const passwordHash = await bcrypt.hash("AgroTur@2026", 12);
  await prisma.user.upsert({
    where: { email: "admin@agrotur.ao" },
    update: {},
    create: {
      name: "Administrador AGRO TUR",
      email: "admin@agrotur.ao",
      passwordHash,
      role: "ADMIN",
    },
  });

  const experiences = [
    {
      slug: "rota-do-cafe",
      name: "Rota do Café",
      description: "Da colheita à chávena: visita guiada, torra artesanal e degustação.",
      price: 18500,
      capacity: 16,
      duration: "3h30",
      date: new Date(Date.now() + 4 * 86400000),
    },
    {
      slug: "mesa-na-horta",
      name: "Mesa na Horta",
      description: "Colha ingredientes com o chef e desfrute de um almoço junto à plantação.",
      price: 24000,
      capacity: 12,
      duration: "4h",
      date: new Date(Date.now() + 8 * 86400000),
    },
    {
      slug: "amanhecer-no-curral",
      name: "Amanhecer no Curral",
      description: "Rotina acompanhada com os animais, pequeno-almoço rural e passeio a cavalo.",
      price: 15000,
      capacity: 10,
      duration: "2h30",
      date: new Date(Date.now() + 11 * 86400000),
    },
  ];

  for (const experience of experiences) {
    await prisma.experience.upsert({
      where: { slug: experience.slug },
      update: experience,
      create: experience,
    });
  }

  const products = [
    { sku: "CAF-250", name: "Café da Fazenda 250g", price: 4800, stock: 42, unit: "pacote", sold: 86 },
    { sku: "MEL-500", name: "Mel Silvestre 500ml", price: 5500, stock: 18, unit: "frasco", sold: 54 },
    { sku: "CAB-001", name: "Cabaz da Horta", price: 7500, stock: 9, unit: "cabaz", sold: 37 },
  ];
  for (const product of products) {
    await prisma.product.upsert({ where: { sku: product.sku }, update: product, create: product });
  }

  const areas = [
    {
      name: "Horta principal",
      type: "PLANTATION",
      description: "Cultivo sazonal de hortaliças e ervas aromáticas.",
      geojson: {
        type: "Feature",
        properties: { color: "#4CAF50" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [center[1] - 0.003, center[0] + 0.002],
            [center[1] + 0.001, center[0] + 0.003],
            [center[1] + 0.002, center[0] - 0.001],
            [center[1] - 0.002, center[0] - 0.002],
            [center[1] - 0.003, center[0] + 0.002],
          ]],
        },
      },
    },
    {
      name: "Zona dos animais",
      type: "ANIMALS",
      description: "Curral, cavalos e área de alimentação acompanhada.",
      geojson: {
        type: "Feature",
        properties: { color: "#FFC107" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [center[1] + 0.002, center[0] + 0.001],
            [center[1] + 0.005, center[0] + 0.001],
            [center[1] + 0.005, center[0] - 0.002],
            [center[1] + 0.002, center[0] - 0.002],
            [center[1] + 0.002, center[0] + 0.001],
          ]],
        },
      },
    },
  ];
  if ((await prisma.farmArea.count()) === 0) {
    await prisma.farmArea.createMany({ data: areas });
  }

  const experience = await prisma.experience.findFirst();
  if (experience && (await prisma.booking.count()) === 0) {
    const names = ["Ana Manuel", "Paulo Neto", "Marta Domingos", "Rui Mateus", "Luzia Costa"];
    for (let index = 0; index < names.length; index += 1) {
      await prisma.booking.create({
        data: {
          guestName: names[index],
          guestPhone: `+244 923 000 00${index}`,
          guestEmail: `visitante${index + 1}@example.com`,
          guests: (index % 3) + 1,
          totalAmount: Number(experience.price) * ((index % 3) + 1),
          visitDate: experience.date,
          status: index === 4 ? "PENDING" : "APPROVED",
          experienceId: experience.id,
        },
      });
    }
  }
}

main()
  .then(() => console.log("Dados iniciais AGRO TUR criados."))
  .finally(() => prisma.$disconnect());
