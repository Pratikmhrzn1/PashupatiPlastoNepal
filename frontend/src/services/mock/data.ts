import type { MemberDto, ProductDto } from "../types";

/**
 * Mock data served by MSW in dev. Mirrors what the real backend will return.
 * (Pulled from the original static constants so the UI looks identical.)
 */

export const mockProducts: ProductDto[] = [
  {
    id: "pp-009",
    soldCount: 3200,
    name: "Safety Helmets",
    price: "NPR 450 / piece",
    description: "Injection-moulded ABS safety helmets for industrial and site use.",
    image: "/products/helmet.webp",
  },
  {
    id: "pp-010",
    soldCount: 2800,
    name: "OEM Pipe Fittings",
    price: "NPR 180 / piece",
    description: "Custom-moulded OEM fittings produced to client drawings and tolerances.",
    image: "/products/oempipefitting.webp",
  },
  {
    id: "pp-011",
    soldCount: 2400,
    name: "Pipe Clamps",
    price: "NPR 65 / piece",
    description: "Durable PP clamps for joining and securing pipeline sections.",
    image: "/products/pipeclamp.webp",
  },
  {
    id: "pp-012",
    soldCount: 2300,
    name: "Plastic Brick Moulds",
    price: "NPR 950 / piece",
    description: "Reusable moulds for producing hollow plastic bricks and blocks.",
    image: "/products/plasticbrickmould.webp",
  },
  {
    id: "pp-001",
    soldCount: 1240,
    name: "HDPE Plastic Bags",
    price: "NPR 2.50 / piece",
    description: "Durable, lightweight HDPE bags for packaging and retail use.",
  },
  {
    id: "pp-002",
    soldCount: 860,
    name: "LDPE Roll Films",
    price: "NPR 15 / meter",
    description: "Flexible roll films suitable for wrapping and lamination.",
  },
  {
    id: "pp-003",
    soldCount: 2100,
    name: "PP Woven Sacks",
    price: "NPR 25 / piece",
    description: "Heavy-duty woven sacks ideal for grains and industrial packaging.",
  },
  {
    id: "pp-004",
    soldCount: 540,
    name: "PVC Pipes (Small Dia)",
    price: "NPR 120 / piece",
    description: "High-quality PVC pipes for plumbing and irrigation needs.",
  },
  {
    id: "pp-005",
    soldCount: 1780,
    name: "PET Bottles",
    price: "NPR 5 / piece",
    description: "Food-grade PET bottles available in various sizes.",
  },
  {
    id: "pp-006",
    soldCount: 610,
    name: "Plastic Buckets",
    price: "NPR 85 / piece",
    description: "Sturdy plastic buckets with strong handles for everyday use.",
  },
  {
    id: "pp-007",
    soldCount: 430,
    name: "Plastic Trays",
    price: "NPR 18 / piece",
    description: "Reusable plastic trays perfect for food service and storage.",
  },
  {
    id: "pp-008",
    soldCount: 750,
    name: "Packaging Sheets",
    price: "NPR 12 / piece",
    description: "Clear, tough packaging sheets for protective wrapping.",
  },
];

export const mockMembers: MemberDto[] = [
  {
    id: "member-001",
    name: { en: "Macha Babu Maharjan", ne: "मचा बाबु महर्जन" },
    badge: { en: "FOUNDER", ne: "संस्थापक" },
    role: { en: "Founder & Managing Director", ne: "संस्थापक तथा व्यवस्थापक निर्देशक" },
    since: "2005",
    image: "/images/member.webp",
  },
  {
    id: "member-002",
    name: { en: "Macha Babu Maharjan", ne: "मचा बाबु महर्जन" },
    badge: { en: "PRODUCTION", ne: "उत्पादन" },
    role: { en: "Production Head", ne: "उत्पादन प्रमुख" },
    since: "2010",
    image: "/images/member.webp",
  },
  {
    id: "member-003",
    name: { en: "Macha Babu Maharjan", ne: "मचा बाबु महर्जन" },
    badge: { en: "QUALITY", ne: "गुणस्तर" },
    role: { en: "Quality Assurance Manager", ne: "गुणस्तर आश्वासन व्यवस्थापक" },
    since: "2012",
    image: "/images/member.webp",
  },
  {
    id: "member-004",
    name: { en: "Macha Babu Maharjan", ne: "मचा बाबु महर्जन" },
    badge: { en: "SALES", ne: "बिक्री" },
    role: { en: "Sales & Marketing Lead", ne: "बिक्री र विपणन प्रमुख" },
    since: "2015",
    image: "/images/member.webp",
  },
];
