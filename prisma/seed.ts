import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const gifts = [
  {
    slug: "ai-opportunity-clinic",
    title: "AI Opportunity Clinic",
    strapline: "Discover how AI can transform your business operations",
    description:
      "An in-depth consultation to identify practical AI opportunities across your organisation. We will map use cases, discuss implementation strategies, and shape a roadmap that aligns with your commercial objectives.",
    ledByName: "IMA Hybrid Experience",
    ledByRole: "Associate Director of Technology and team",
    duration: "90 minutes",
    format: "Virtual consultation",
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: "experience-strategy-sprint",
    title: "Experience Strategy Sprint",
    strapline: "Reimagine your customer experience from the ground up",
    description:
      "A focused sprint to map customer journeys, surface friction points, and prioritise the moments that matter. You will leave with an action plan to elevate your experience across channels.",
    ledByName: "IMA Hybrid Experience",
    ledByRole: "Experience Strategy Leadership team",
    duration: "2 hours",
    format: "In-person or hybrid workshop",
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: "creative-automation-deep-dive",
    title: "Creative Automation Deep Dive",
    strapline: "Scale your creative output without sacrificing quality",
    description:
      "A working session to design creative automation workflows that maintain brand guardrails while increasing throughput. We will review tooling, templates, and governance to help you scale safely.",
    ledByName: "IMA Hybrid Experience",
    ledByRole: "Creative Technology specialists",
    duration: "90 minutes",
    format: "Virtual demo and consultation",
    sortOrder: 3,
    isActive: true,
  },
  {
    slug: "retail-innovation-roundtable",
    title: "Retail Innovation Roundtable",
    strapline: "Explore the future of retail and commerce",
    description:
      "An invite-only roundtable on emerging retail trends, from phygital experiences to social commerce. We will unpack case studies, discuss adoption barriers, and identify opportunities for your roadmap.",
    ledByName: "IMA Hybrid Experience",
    ledByRole: "Retail Strategy and Innovation leads",
    duration: "1 hour",
    format: "Virtual roundtable",
    sortOrder: 4,
    isActive: true,
  },
  {
    slug: "brand-measurement-lab",
    title: "Brand Measurement Lab",
    strapline: "Prove the value of your brand investments",
    description:
      "A practical lab session on measuring brand health and demonstrating ROI. We will review your metrics, introduce advanced frameworks, and outline a dashboard that ties brand to business outcomes.",
    ledByName: "IMA Hybrid Experience",
    ledByRole: "Brand Analytics practice",
    duration: "90 minutes",
    format: "Virtual consultation",
    sortOrder: 5,
    isActive: true,
  },
  {
    slug: "future-customer-journeys",
    title: "Future of Customer Journeys Session",
    strapline: "Design experiences for tomorrow's consumers",
    description:
      "A forward-looking session on how ambient computing, predictive personalisation, and ethical data use are reshaping journeys. We will stress-test your roadmap against what is coming next.",
    ledByName: "IMA Hybrid Experience",
    ledByRole: "Futures and Innovation team",
    duration: "75 minutes",
    format: "Virtual session",
    sortOrder: 6,
    isActive: true,
  },
]

async function main() {
  for (const gift of gifts) {
    await prisma.gift.upsert({
      where: { slug: gift.slug },
      update: { ...gift },
      create: { ...gift },
    })
  }
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Failed to seed database", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

