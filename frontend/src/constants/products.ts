export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  image?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "pp-001",
    name: "HDPE Plastic Bags",
    price: "NPR 2.50 / piece",
    description: "Durable, lightweight HDPE bags for packaging and retail use.",
  },
  {
    id: "pp-002",
    name: "LDPE Roll Films",
    price: "NPR 15 / meter",
    description: "Flexible roll films suitable for wrapping and lamination.",
  },
  {
    id: "pp-003",
    name: "PP Woven Sacks",
    price: "NPR 25 / piece",
    description: "Heavy-duty woven sacks ideal for grains and industrial packaging.",
  },
  {
    id: "pp-004",
    name: "PVC Pipes (Small Dia)",
    price: "NPR 120 / piece",
    description: "High-quality PVC pipes for plumbing and irrigation needs.",
  },
  {
    id: "pp-005",
    name: "PET Bottles",
    price: "NPR 5 / piece",
    description: "Food-grade PET bottles available in various sizes.",
  },
  {
    id: "pp-006",
    name: "Plastic Buckets",
    price: "NPR 85 / piece",
    description: "Sturdy plastic buckets with strong handles for everyday use.",
  },
  {
    id: "pp-007",
    name: "Plastic Trays",
    price: "NPR 18 / piece",
    description: "Reusable plastic trays perfect for food service and storage.",
  },
  {
    id: "pp-008",
    name: "Packaging Sheets",
    price: "NPR 12 / piece",
    description: "Clear, tough packaging sheets for protective wrapping.",
  },
];
