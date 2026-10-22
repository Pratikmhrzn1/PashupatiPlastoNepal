export interface TranslatableText {
  en: string
  ne: string
}

export interface Member {
  id: string
  name: TranslatableText
  badge: TranslatableText
  role: TranslatableText
  since: string
  image?: string
}

export const MEMBERS: Member[] = [
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
]
