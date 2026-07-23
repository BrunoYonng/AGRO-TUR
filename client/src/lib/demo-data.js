const inDays = (days) => new Date(Date.now() + days * 86400000).toISOString();

export const demoExperiences = [
  {
    id: "demo-coffee",
    name: "Rota do Café",
    description: "Da colheita à chávena: visita guiada, torra artesanal e degustação.",
    price: 18500,
    capacity: 16,
    date: inDays(4),
    duration: "3h30",
  },
  {
    id: "demo-garden",
    name: "Mesa na Horta",
    description: "Colha ingredientes com o chef e desfrute de um almoço junto à plantação.",
    price: 24000,
    capacity: 12,
    date: inDays(8),
    duration: "4h",
  },
  {
    id: "demo-ranch",
    name: "Amanhecer no Curral",
    description: "Rotina com os animais, pequeno-almoço rural e passeio a cavalo.",
    price: 15000,
    capacity: 10,
    date: inDays(11),
    duration: "2h30",
  },
];

export const points = [
  { id: "curral", name: "Curral", description: "Conheça os cavalos e a rotina dos animais.", position: [-14.8902, 13.4992], type: "Animais" },
  { id: "horta", name: "Horta", description: "Hortaliças, ervas aromáticas e colheita guiada.", position: [-14.8896, 13.4943], type: "Plantação" },
  { id: "lago", name: "Lago", description: "Percurso tranquilo, observação de aves e piqueniques.", position: [-14.8941, 13.4938], type: "Lazer" },
  { id: "restaurante", name: "Restaurante", description: "Sabores da fazenda servidos à mesa.", position: [-14.891, 13.4972], type: "Serviço" },
];

export const demoAreas = [
  {
    id: "area-horta",
    name: "Horta principal",
    type: "PLANTATION",
    description: "Cultivo sazonal de hortaliças e ervas aromáticas.",
    geojson: {
      type: "Feature",
      properties: { color: "#4CAF50" },
      geometry: {
        type: "Polygon",
        coordinates: [[[13.4932, -14.8892], [13.4972, -14.8882], [13.4982, -14.8922], [13.4942, -14.8932], [13.4932, -14.8892]]],
      },
    },
  },
  {
    id: "area-animais",
    name: "Zona dos animais",
    type: "ANIMALS",
    description: "Curral, cavalos e área de alimentação acompanhada.",
    geojson: {
      type: "Feature",
      properties: { color: "#FFC107" },
      geometry: {
        type: "Polygon",
        coordinates: [[[13.4982, -14.8902], [13.5012, -14.8902], [13.5012, -14.8932], [13.4982, -14.8932], [13.4982, -14.8902]]],
      },
    },
  },
];

export const demoBookings = [
  { id: "1", guestName: "Ana Manuel", experience: { name: "Rota do Café" }, visitDate: inDays(4), guests: 2, totalAmount: 37000, status: "APPROVED" },
  { id: "2", guestName: "Paulo Neto", experience: { name: "Mesa na Horta" }, visitDate: inDays(8), guests: 3, totalAmount: 72000, status: "PENDING" },
  { id: "3", guestName: "Marta Domingos", experience: { name: "Amanhecer no Curral" }, visitDate: inDays(11), guests: 2, totalAmount: 30000, status: "APPROVED" },
  { id: "4", guestName: "Rui Mateus", experience: { name: "Rota do Café" }, visitDate: inDays(4), guests: 4, totalAmount: 74000, status: "CANCELLED" },
  { id: "5", guestName: "Luzia Costa", experience: { name: "Mesa na Horta" }, visitDate: inDays(8), guests: 2, totalAmount: 48000, status: "APPROVED" },
];
