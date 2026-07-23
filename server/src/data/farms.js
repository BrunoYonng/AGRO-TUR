export const farms = [
  {
    id: "fazenda-kukula",
    name: "Fazenda Kukula",
    location: "Lubango, Huíla",
    latitude: -14.8912,
    longitude: 13.4962,
    description: "Horta, café, animais e refeições preparadas com produtos da fazenda.",
    imageUrl: "/images/agrotur-hero.jpg",
    startingPriceKz: 15000,
    rating: 4.8,
    tags: ["Café", "Famílias", "Gastronomia", "Sustentabilidade"],
    comfort: ["Restaurante", "Estacionamento", "Área de descanso"],
    sustainability: ["Cultivo sazonal", "Experiências de educação ambiental"],
    featured: true,
  },
  {
    id: "quinta-da-serra",
    name: "Quinta da Serra",
    location: "Humpata, Huíla",
    latitude: -15.0726,
    longitude: 13.3678,
    description: "Caminhadas leves, pomar de altitude e piqueniques com vista para a serra.",
    imageUrl: "/images/agrotur-hero.jpg",
    startingPriceKz: 12000,
    rating: 4.6,
    tags: ["Natureza", "Piquenique", "Casais", "Caminhada"],
    comfort: ["Zona de piquenique", "Casas de banho", "Guia local"],
    sustainability: ["Compostagem", "Proteção do solo"],
    featured: false,
  },
  {
    id: "eco-fazenda-tundavala",
    name: "Eco Fazenda Tundavala",
    location: "Lubango, Huíla",
    latitude: -14.8287,
    longitude: 13.3799,
    description: "Turismo de natureza, observação de aves e atividades sobre água e biodiversidade.",
    imageUrl: "/images/agrotur-hero.jpg",
    startingPriceKz: 18000,
    rating: 4.9,
    tags: ["Ecologia", "Aves", "Trilhos", "Educação ambiental"],
    comfort: ["Miradouro", "Área de descanso", "Guia ambiental"],
    sustainability: ["Conservação da água", "Observação responsável de fauna"],
    featured: true,
  },
  {
    id: "fazenda-rio-claro",
    name: "Fazenda Rio Claro",
    location: "Chibia, Huíla",
    latitude: -15.1894,
    longitude: 13.6921,
    description: "Passeios a cavalo, almoço rural e tardes tranquilas junto à água.",
    imageUrl: "/images/agrotur-hero.jpg",
    startingPriceKz: 14000,
    rating: 4.5,
    tags: ["Cavalos", "Lazer", "Almoço", "Crianças"],
    comfort: ["Restaurante", "Espaço infantil", "Estacionamento"],
    sustainability: ["Produção local", "Gestão responsável de pastagens"],
    featured: false,
  },
];

export function distanceInKm(from, farm) {
  if (!from || !Number.isFinite(from.latitude) || !Number.isFinite(from.longitude)) {
    return null;
  }
  const earthRadiusKm = 6371;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(farm.latitude - from.latitude);
  const longitudeDelta = radians(farm.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(farm.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function recommendFarms({ location, preference = "nearby" } = {}) {
  return farms
    .map((farm) => {
      const distanceKm = distanceInKm(location, farm);
      let recommendationReason = farm.featured
        ? "Uma das experiências mais completas da região"
        : "Boa combinação de natureza e hospitalidade";

      if (preference === "price") recommendationReason = `Visitas a partir de ${farm.startingPriceKz.toLocaleString("pt-AO")} Kz`;
      if (preference === "sustainability") recommendationReason = farm.sustainability[0];
      if (preference === "comfort") recommendationReason = farm.comfort.slice(0, 2).join(" · ");
      if (distanceKm !== null && preference === "nearby") {
        recommendationReason = `${distanceKm.toFixed(1)} km da sua localização`;
      }

      return { ...farm, distanceKm, recommendationReason };
    })
    .sort((a, b) => {
      if (preference === "price") return a.startingPriceKz - b.startingPriceKz;
      if (preference === "sustainability") {
        return Number(b.tags.includes("Ecologia")) - Number(a.tags.includes("Ecologia")) || b.rating - a.rating;
      }
      if (preference === "comfort") return b.comfort.length - a.comfort.length || b.rating - a.rating;
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      return Number(b.featured) - Number(a.featured) || b.rating - a.rating;
    });
}
