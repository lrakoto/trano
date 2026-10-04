import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Demo photos are Unsplash hotlinks (Unsplash License; photographer credited
// per image). Real listings upload their own photos to R2.
async function main() {
  console.log('🌱 Seeding database...');

  // ── Seed user ────────────────────────────────────────────────────────────────
  // Demo accounts own the seed listings. In production they get a random
  // password nobody knows (the repo is public), so they can't be logged into.
  const production = process.env.NODE_ENV === 'production';
  const password = production ? randomBytes(24).toString('hex') : 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

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
      images: { create: [
        { url: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjY4MDN8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDB8MHx8fDE3OTExMjg4Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080', order: 0 }, // Photo: Luke van Zyl on Unsplash
      ] },
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
      images: { create: [
        { url: 'https://images.unsplash.com/photo-1721222204128-3f8262e14f35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjY4MDN8MHwxfHNlYXJjaHwxfHx2aWxsYSUyMHdpdGglMjBnYXJkZW58ZW58MHwwfHx8MTc5MTEyODg3OXww&ixlib=rb-4.1.0&q=80&w=1080', order: 0 }, // Photo: Sanju Pandita on Unsplash
      ] },
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
      images: { create: [
        { url: 'https://images.unsplash.com/photo-1702014862053-946a122b920d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjY4MDN8MHwxfHNlYXJjaHwxfHxmdXJuaXNoZWQlMjBzdHVkaW8lMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwwfDB8fHwxNzkxMTI4ODgwfDA&ixlib=rb-4.1.0&q=80&w=1080', order: 0 }, // Photo: Aquilion Property on Unsplash
      ] },
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
      images: { create: [
        { url: 'https://images.unsplash.com/photo-1766523798979-9671b1250dd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjY4MDN8MHwxfHNlYXJjaHwxfHx2YWNhbnQlMjBsYW5kJTIwZmllbGQlMjBncmFzc3xlbnwwfDB8fHwxNzkxMTI4OTM5fDA&ixlib=rb-4.1.0&q=80&w=1080', order: 0 }, // Photo: Haewon Oh on Unsplash
      ] },
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
      images: { create: [
        { url: 'https://images.unsplash.com/photo-1494676731265-5ed4f59790f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjY4MDN8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGJlYWNoJTIwaG91c2V8ZW58MHwwfHx8MTc5MTEyODkzOXww&ixlib=rb-4.1.0&q=80&w=1080', order: 0 }, // Photo: Toa Heftiba on Unsplash
      ] },
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
      images: { create: [
        { url: 'https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjY4MDN8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBiYWxjb255JTIwY2l0eXxlbnwwfDB8fHwxNzkxMTI4ODgxfDA&ixlib=rb-4.1.0&q=80&w=1080', order: 0 }, // Photo: Soop kim on Unsplash
      ] },
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
      images: { create: [
        { url: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjY4MDN8MHwxfHNlYXJjaHwxfHxjb2xvbmlhbCUyMGhvdXNlJTIwdmVyYW5kYXxlbnwwfDB8fHwxNzkxMTI4OTQwfDA&ixlib=rb-4.1.0&q=80&w=1080', order: 0 }, // Photo: Francesca Tosolini on Unsplash
      ] },
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
      images: { create: [
        { url: 'https://images.unsplash.com/photo-1678613077539-13d3c07e2d52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjY4MDN8MHwxfHNlYXJjaHwxfHxzbWFsbCUyMHNob3AlMjBzdG9yZWZyb250JTIwc3RyZWV0fGVufDB8MHx8fDE3OTExMjg5NDB8MA&ixlib=rb-4.1.0&q=80&w=1080', order: 0 }, // Photo: Wai Hsuen Chan on Unsplash
      ] },
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
      images: { create: [
        { url: 'https://images.unsplash.com/photo-1759355787174-044355f63c55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjY4MDN8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBob3VzZSUyMHdpdGglMjB5YXJkfGVufDB8MHx8fDE3OTExMjg4ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080', order: 0 }, // Photo: ubeyonroad on Unsplash
        { url: 'https://images.unsplash.com/photo-1758158452965-ef267a639880?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNjY4MDN8MHwxfHNlYXJjaHwxfHxjb3VudHJ5c2lkZSUyMGhvdXNlfGVufDB8MHx8fDE3OTExMjg4ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080', order: 1 }, // Photo: Roger Starnes Sr on Unsplash
      ] },
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

  // Idempotent: the Render build runs this on every deploy
  const existing = await prisma.listing.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} listings already exist`);
    return;
  }

  let created = 0;
  for (const data of listings) {
    await prisma.listing.create({ data });
    created++;
  }

  console.log(`✅ Created ${created} listings across 5 cities`);
  if (!production) {
    console.log('');
    console.log('🔑 Test credentials:');
    console.log('   Agent  → phone: +261340000001  password: password123');
    console.log('   Seller → phone: +261330000002  password: password123');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
