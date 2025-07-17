import { PrismaClient, EventType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.transaction.deleteMany();
  await prisma.offerSection.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.section.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👨‍💼 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  await prisma.user.create({
    data: {
      email: 'admin@sneatsnags.com',
      
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Admin user created:');
  console.log('📧 Email: admin@sneatsnags.com');
  console.log('🔑 Password: admin123');

  // Create sample buyer and seller users
  console.log('👥 Creating sample users...');
  
  const buyerPassword = await bcrypt.hash('buyer123', 12);
  await prisma.user.create({
    data: {
      email: 'buyer@sneatsnags.com',
      password: buyerPassword,
      firstName: 'John',
      lastName: 'Buyer',
      role: UserRole.BUYER,
      isEmailVerified: true,
      isActive: true,
    },
  });

  const sellerPassword = await bcrypt.hash('seller123', 12);
  await prisma.user.create({
    data: {
      email: 'seller@sneatsnags.com',
      password: sellerPassword,
      firstName: 'Jane',
      lastName: 'Seller',
      role: UserRole.SELLER,
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Sample users created:');
  console.log('🛒 Buyer - Email: buyer@sneatsnags.com, Password: buyer123');
  console.log('💰 Seller - Email: seller@sneatsnags.com, Password: seller123');

  // Create 10 sample events
  console.log("🎪 Creating events...");

  const events = [
    {
      name: "Taylor Swift - Eras Tour",
      description:
        "The most anticipated concert tour of the year featuring all eras of Taylor Swift's music.",
      venue: "MetLife Stadium",
      address: "1 MetLife Stadium Dr",
      city: "East Rutherford",
      state: "NJ",
      zipCode: "07073",
      eventDate: new Date("2024-08-15T20:00:00Z"),
      doors: new Date("2024-08-15T19:00:00Z"),
      eventType: EventType.CONCERT,
      category: "Pop",
      subcategory: "Arena Tour",
      imageUrl:
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      minPrice: 50.0,
      maxPrice: 500.0,
      totalSeats: 82500,
      availableSeats: 15000,
    },
    {
      name: "New York Yankees vs Boston Red Sox",
      description:
        "Classic AL East rivalry game. Yankees take on the Red Sox in this heated matchup.",
      venue: "Yankee Stadium",
      address: "1 E 161st St",
      city: "Bronx",
      state: "NY",
      zipCode: "10451",
      eventDate: new Date("2024-07-20T19:30:00Z"),
      doors: new Date("2024-07-20T17:30:00Z"),
      eventType: EventType.SPORTS,
      category: "Baseball",
      subcategory: "MLB",
      imageUrl:
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      minPrice: 25.0,
      maxPrice: 300.0,
      totalSeats: 52325,
      availableSeats: 8500,
    },
    {
      name: "Hamilton",
      description:
        "The revolutionary Broadway musical about Alexander Hamilton.",
      venue: "Richard Rodgers Theatre",
      address: "226 W 46th St",
      city: "New York",
      state: "NY",
      zipCode: "10036",
      eventDate: new Date("2024-08-10T20:00:00Z"),
      doors: new Date("2024-08-10T19:30:00Z"),
      eventType: EventType.THEATER,
      category: "Musical",
      subcategory: "Broadway",
      imageUrl:
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      minPrice: 89.0,
      maxPrice: 350.0,
      totalSeats: 1319,
      availableSeats: 200,
    },
    {
      name: "Dave Chappelle - Comedy Special",
      description:
        "An evening of stand-up comedy with the legendary Dave Chappelle.",
      venue: "Madison Square Garden",
      address: "4 Pennsylvania Plaza",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      eventDate: new Date("2024-09-05T21:00:00Z"),
      doors: new Date("2024-09-05T20:00:00Z"),
      eventType: EventType.COMEDY,
      category: "Stand-up",
      subcategory: "Comedy Special",
      imageUrl:
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      minPrice: 75.0,
      maxPrice: 250.0,
      totalSeats: 20789,
      availableSeats: 5000,
    },
    {
      name: "Los Angeles Lakers vs Golden State Warriors",
      description: "Western Conference showdown between two powerhouse teams.",
      venue: "Crypto.com Arena",
      address: "1111 S Figueroa St",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90015",
      eventDate: new Date("2024-07-25T22:00:00Z"),
      doors: new Date("2024-07-25T20:30:00Z"),
      eventType: EventType.SPORTS,
      category: "Basketball",
      subcategory: "NBA",
      imageUrl:
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      minPrice: 40.0,
      maxPrice: 400.0,
      totalSeats: 20000,
      availableSeats: 3500,
    },
    {
      name: "Billie Eilish - Hit Me Hard and Soft Tour",
      description:
        "Billie Eilish brings her latest album to life in this intimate arena tour.",
      venue: "American Airlines Arena",
      address: "601 Biscayne Blvd",
      city: "Miami",
      state: "FL",
      zipCode: "33132",
      eventDate: new Date("2024-08-22T20:30:00Z"),
      doors: new Date("2024-08-22T19:30:00Z"),
      eventType: EventType.CONCERT,
      category: "Pop",
      subcategory: "Arena Tour",
      imageUrl:
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      minPrice: 65.0,
      maxPrice: 275.0,
      totalSeats: 19600,
      availableSeats: 7200,
    },
    {
      name: "The Lion King",
      description:
        "Disney's award-winning musical adaptation of the beloved animated film.",
      venue: "Minskoff Theatre",
      address: "200 W 45th St",
      city: "New York",
      state: "NY",
      zipCode: "10036",
      eventDate: new Date("2024-07-30T20:00:00Z"),
      doors: new Date("2024-07-30T19:30:00Z"),
      eventType: EventType.THEATER,
      category: "Musical",
      subcategory: "Broadway",
      imageUrl:
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      minPrice: 79.0,
      maxPrice: 299.0,
      totalSeats: 1621,
      availableSeats: 350,
    },
    {
      name: "Dallas Cowboys vs Philadelphia Eagles",
      description:
        "NFC East rivalry game featuring America's Team vs the defending champions.",
      venue: "AT&T Stadium",
      address: "1 AT&T Way",
      city: "Arlington",
      state: "TX",
      zipCode: "76011",
      eventDate: new Date("2024-09-15T20:20:00Z"),
      doors: new Date("2024-09-15T17:00:00Z"),
      eventType: EventType.SPORTS,
      category: "Football",
      subcategory: "NFL",
      imageUrl:
        "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      minPrice: 85.0,
      maxPrice: 500.0,
      totalSeats: 80000,
      availableSeats: 12000,
    },
    {
      name: "Kevin Hart - Reality Check Tour",
      description:
        "Kevin Hart's latest comedy tour bringing laughs to audiences nationwide.",
      venue: "United Center",
      address: "1901 W Madison St",
      city: "Chicago",
      state: "IL",
      zipCode: "60612",
      eventDate: new Date("2024-08-18T20:00:00Z"),
      doors: new Date("2024-08-18T19:00:00Z"),
      eventType: EventType.COMEDY,
      category: "Stand-up",
      subcategory: "Comedy Tour",
      imageUrl:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      minPrice: 55.0,
      maxPrice: 200.0,
      totalSeats: 23500,
      availableSeats: 6800,
    },
    {
      name: "Coldplay - Music of the Spheres World Tour",
      description:
        "Coldplay's spectacular world tour featuring their latest album and greatest hits.",
      venue: "SoFi Stadium",
      address: "1001 Stadium Dr",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90301",
      eventDate: new Date("2024-09-01T20:00:00Z"),
      doors: new Date("2024-09-01T18:30:00Z"),
      eventType: EventType.CONCERT,
      category: "Rock",
      subcategory: "Stadium Tour",
      imageUrl:
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=600&fit=crop",
      minPrice: 45.0,
      maxPrice: 350.0,
      totalSeats: 70240,
      availableSeats: 15500,
    },
  ];

  // Create events with sections
  for (const eventData of events) {
    console.log(`Creating event: ${eventData.name}`);

    const event = await prisma.event.create({
      data: eventData,
    });

    // Create sections for each event
    const sectionNames = getSectionsForVenueType(eventData.eventType);

    for (const sectionName of sectionNames) {
      await prisma.section.create({
        data: {
          eventId: event.id,
          name: sectionName,
          description: `${sectionName} seating area`,
          rowCount: Math.floor(Math.random() * 20) + 10, // 10-30 rows
          seatCount: Math.floor(Math.random() * 30) + 20, // 20-50 seats per row
          priceLevel: getSectionPriceLevel(sectionName),
        },
      });
    }
  }

  console.log("✅ Database seed completed successfully!");
  console.log(`📊 Created ${events.length} events with sections`);
}

function getSectionsForVenueType(eventType: EventType): string[] {
  switch (eventType) {
    case EventType.SPORTS:
      return [
        "Lower Bowl",
        "Upper Deck",
        "Club Level",
        "Field Level",
        "Outfield",
        "Behind Home Plate",
        "Baseline Box",
        "Grandstand",
      ];
    case EventType.CONCERT:
      return [
        "General Admission",
        "VIP",
        "Lower Level",
        "Upper Level",
        "Pit",
        "Floor",
        "Balcony",
        "Lawn",
      ];
    case EventType.THEATER:
      return [
        "Orchestra",
        "Mezzanine",
        "Balcony",
        "Box Seats",
        "Premium Orchestra",
        "Rear Mezzanine",
      ];
    case EventType.COMEDY:
      return [
        "VIP Front Row",
        "Premium Seating",
        "Standard Seating",
        "General Admission",
        "Balcony",
        "Standing Room",
      ];
    default:
      return ["General Admission", "Reserved Seating", "VIP", "Standard"];
  }
}

function getSectionPriceLevel(sectionName: string): number {
  const premiumSections = [
    "VIP",
    "Premium",
    "Club",
    "Box",
    "Field Level",
    "Pit",
    "Orchestra",
    "Front Row",
  ];
  const midTierSections = [
    "Lower",
    "Floor",
    "Mezzanine",
    "Baseline",
    "Behind Home",
  ];

  if (premiumSections.some((premium) => sectionName.includes(premium))) {
    return 1; // Premium pricing
  } else if (midTierSections.some((mid) => sectionName.includes(mid))) {
    return 2; // Mid-tier pricing
  } else {
    return 3; // Standard pricing
  }
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
