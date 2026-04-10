import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Seed user ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const agent = await prisma.user.upsert({
    where: { phone: '+261340000001' },
    update: {},
    create: {
      name:          'Rakoto Immo',
      phone:         '+261340000001',
      email:         'rakoto@trano.mg',
      passwordHash,
      role:          'AGENT',
      isVerified:    true,
      verifiedAt:    new Date(),
      whatsappPhone: '+261340000001',
    },
  });

  const seller = await prisma.user.upsert({
    where: { phone: '+261330000002' },
    update: {},
    create: {
      name:          'Rabe Tsilavina',
      phone:         '+261330000002',
      passwordHash,
      role:          'SELLER',
      isVerified:    false,
      whatsappPhone: '+261330000002',
    },
  });

  console.log(`✅ Users: ${agent.name}, ${seller.name}`);

  // ── Listings ─────────────────────────────────────────────────────────────────
  const listings = [
    // ── Antananarivo ──────────────────────────────────────────────────────────
    {
      title:           'Appartement moderne 3 pièces – Ivandry',
      description:     'Beau appartement entièrement rénové situé à Ivandry, quartier résidentiel calme. Cuisine équipée, double vitrage, gardiennage 24h. Accès facile vers Behoririka et Andraharo.',
      priceMga:        BigInt(1_800_000),
      priceUsdSnapshot: 400,
      listingType:     'RENT' as const,
      propertyType:    'APARTMENT' as const,
      bedrooms:        3,
      bathrooms:       2,
      areaSqm:         95,
      addressFreeform: 'Ivandry, près de la pharmacie Soanierana',
      city:            'Antananarivo',
      region:          'ANALAMANGA' as const,
      latitude:        -18.8856,
      longitude:        47.5341,
      whatsappContact: '+261340000001',
      ownerId:         agent.id,
    },
    {
      title:           'Villa F5 avec jardin – Ambohimanarina',
      description:     'Grande villa familiale avec jardin clos de 300 m². 5 chambres, 3 salles de bain, salon spacieux, garage double. Quartier sécurisé avec vue sur les collines.',
      priceMga:        BigInt(350_000_000),
      priceUsdSnapshot: 77_800,
      listingType:     'SALE' as const,
      propertyType:    'HOUSE' as const,
      bedrooms:        5,
      bathrooms:       3,
      areaSqm:         280,
      addressFreeform: 'Ambohimanarina, rue des Flamboyants',
      city:            'Antananarivo',
      region:          'ANALAMANGA' as const,
      latitude:        -18.9012,
      longitude:        47.5189,
      whatsappContact: '+261340000001',
      ownerId:         agent.id,
    },
    {
      title:           'Studio meublé centre-ville – Analakely',
      description:     'Studio entièrement meublé idéal pour étudiant ou professionnel. À 5 min à pied du marché Analakely. Wifi inclus, eau chaude, sécurisé.',
      priceMga:        BigInt(450_000),
      priceUsdSnapshot: 100,
      listingType:     'RENT' as const,
      propertyType:    'APARTMENT' as const,
      bedrooms:        1,
      bathrooms:       1,
      areaSqm:         28,
      addressFreeform: 'Analakely, près du marché central',
      city:            'Antananarivo',
      region:          'ANALAMANGA' as const,
      latitude:        -18.9157,
      longitude:        47.5369,
      whatsappContact: '+261330000002',
      ownerId:         seller.id,
    },
    {
      title:           'Terrain constructible 500 m² – Alasora',
      description:     'Terrain plat idéalement situé à Alasora, à 15 min du centre d\'Antananarivo. Viabilisé (eau, électricité). Titre foncier disponible. Idéal pour construction de villa.',
      priceMga:        BigInt(45_000_000),
      priceUsdSnapshot: 10_000,
      listingType:     'SALE' as const,
      propertyType:    'LAND' as const,
      areaSqm:         500,
      addressFreeform: 'Alasora, route nationale RN2',
      city:            'Antananarivo',
      region:          'ANALAMANGA' as const,
      latitude:        -18.9702,
      longitude:        47.5834,
      whatsappContact: '+261330000002',
      ownerId:         seller.id,
    },

    // ── Toamasina ─────────────────────────────────────────────────────────────
    {
      title:           'Maison F4 bord de mer – Toamasina',
      description:     'Belle maison à 200 m de la plage avec vue partielle sur l\'Océan Indien. 4 chambres, grande terrasse, jardin tropical. Idéale pour famille ou investissement locatif.',
      priceMga:        BigInt(120_000_000),
      priceUsdSnapshot: 26_700,
      listingType:     'SALE' as const,
      propertyType:    'HOUSE' as const,
      bedrooms:        4,
      bathrooms:       2,
      areaSqm:         160,
      addressFreeform: 'Boulevard Ratsimilaho, front de mer',
      city:            'Toamasina',
      region:          'ATSINANANA' as const,
      latitude:        -18.1512,
      longitude:        49.4002,
      whatsappContact: '+261340000001',
      ownerId:         agent.id,
    },
    {
      title:           'Appartement F2 à louer – Toamasina centre',
      description:     'Appartement propre au 2ème étage, bien ventilé, proche port et commerces. Eau courante, électricité JIRAMA stable. Convient pour couple ou jeune professionnel.',
      priceMga:        BigInt(600_000),
      priceUsdSnapshot: 133,
      listingType:     'RENT' as const,
      propertyType:    'APARTMENT' as const,
      bedrooms:        2,
      bathrooms:       1,
      areaSqm:         55,
      addressFreeform: 'Centre-ville, rue Joffre',
      city:            'Toamasina',
      region:          'ATSINANANA' as const,
      latitude:        -18.1456,
      longitude:        49.3978,
      whatsappContact: '+261330000002',
      ownerId:         seller.id,
    },

    // ── Antsirabe ─────────────────────────────────────────────────────────────
    {
      title:           'Villa coloniale rénovée – Antsirabe',
      description:     'Magnifique villa de style colonial entièrement rénovée. Grand salon, 4 chambres, salle à manger, jardin fleuri avec fontaine. Quartier calme, proche Hôtel des Thermes.',
      priceMga:        BigInt(280_000_000),
      priceUsdSnapshot: 62_200,
      listingType:     'SALE' as const,
      propertyType:    'HOUSE' as const,
      bedrooms:        4,
      bathrooms:       2,
      areaSqm:         220,
      addressFreeform: 'Quartier résidentiel, près de l\'Hôtel des Thermes',
      city:            'Antsirabe',
      region:          'VAKINANKARATRA' as const,
      latitude:        -19.8659,
      longitude:        47.0356,
      whatsappContact: '+261340000001',
      ownerId:         agent.id,
    },

    // ── Mahajanga ─────────────────────────────────────────────────────────────
    {
      title:           'Local commercial – Mahajanga ville',
      description:     'Local commercial de 80 m² en rez-de-chaussée, vitrine sur rue passante. Idéal boutique, pharmacie, ou bureau. Proche du baobab sacré et du marché Be.',
      priceMga:        BigInt(1_200_000),
      priceUsdSnapshot: 267,
      listingType:     'RENT' as const,
      propertyType:    'COMMERCIAL' as const,
      areaSqm:         80,
      addressFreeform: 'Avenue de France, près du marché Be',
      city:            'Mahajanga',
      region:          'BOENY' as const,
      latitude:        -15.7167,
      longitude:        46.3167,
      whatsappContact: '+261330000002',
      ownerId:         seller.id,
    },

    // ── Fianarantsoa ──────────────────────────────────────────────────────────
    {
      title:           'Maison F3 quartier calme – Fianarantsoa',
      description:     'Maison familiale bien entretenue dans un quartier résidentiel de Fianarantsoa. 3 chambres, cuisine séparée, cour intérieure. Vue sur les collines environnantes.',
      priceMga:        BigInt(75_000_000),
      priceUsdSnapshot: 16_700,
      listingType:     'SALE' as const,
      propertyType:    'HOUSE' as const,
      bedrooms:        3,
      bathrooms:       1,
      areaSqm:         110,
      addressFreeform: 'Haute-Ville, rue du Marché',
      city:            'Fianarantsoa',
      region:          'MATSIATRA_AMBONY' as const,
      latitude:        -21.4532,
      longitude:        47.0869,
      whatsappContact: '+261340000001',
      ownerId:         agent.id,
    },
  ];

  let created = 0;
  for (const data of listings) {
    await prisma.listing.create({ data });
    created++;
  }

  console.log(`✅ Created ${created} listings across 5 cities`);
  console.log('');
  console.log('🔑 Test credentials:');
  console.log('   Agent  → phone: +261340000001  password: password123');
  console.log('   Seller → phone: +261330000002  password: password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
