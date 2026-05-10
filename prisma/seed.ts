import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const divisions = [
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
  "Women's Strawweight",
  "Women's Flyweight",
  "Women's Bantamweight",
];

const firstNames = [
  "Jon", "Conor", "Israel", "Khabib", "Dustin", "Justin", "Max", "Alexander", "Kamaru", "Jorge",
  "Charles", "Islam", "Leon", "Alex", "Robert", "Sean", "Aljamain", "Brandon", "Deiveson", "Amanda",
  "Valentina", "Rose", "Joanna", "Zhang", "Holly", "Julianna", "Glover", "Jan", "Jiri", "Magomed",
  "Gilbert", "Colby", "Belal", "Shavkat", "Khamzat", "Bo", "Paddy", "Ilir", "Tai", "Tom",
  "Ciryl", "Sergei", "Curtis", "Stipe", "Francis", "Derrick", "Jailton", "Roman", "Merab", "Cory"
];

const lastNames = [
  "Jones", "McGregor", "Adesanya", "Nurmagomedov", "Poirier", "Gaethje", "Holloway", "Volkanovski", "Usman", "Masvidal",
  "Oliveira", "Makhachev", "Edwards", "Pereira", "Whittaker", "O'Malley", "Sterling", "Moreno", "Figueiredo", "Nunes",
  "Shevchenko", "Namajunas", "Jedrzejczyk", "Weili", "Holm", "Peña", "Teixeira", "Blachowicz", "Prochazka", "Ankalaev",
  "Burns", "Covington", "Muhammad", "Rakhmonov", "Chimaev", "Nickal", "Pimblett", "Latifi", "Tuivasa", "Aspinall",
  "Gane", "Pavlovich", "Blaydes", "Miocic", "Ngannou", "Lewis", "Almeida", "Dolidze", "Dvalishvili", "Sandhagen"
];

const nationalities = ["USA", "Brazil", "Russia", "Nigeria", "Australia", "New Zealand", "Ireland", "Poland", "China", "Mexico", "Georgia", "UK", "France", "Cameroon", "Canada"];

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Create Divisions
  const divisionMap: Record<string, string> = {};
  for (const name of divisions) {
    const division = await prisma.division.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    divisionMap[name] = division.id;
  }
  console.log(`✅ Created/Verified ${divisions.length} divisions.`);

  // 2. Clear existing fighters (optional, but requested 50 specifically)
  // For safety in this task, I won't delete, I'll just add 50 more or ensure 50 exist.
  // The user said "seed 50 fighters", so I'll create 50 new ones.

  console.log("🥊 Seeding 50 fighters...");
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const divisionName = divisions[Math.floor(Math.random() * divisions.length)];
    const divisionId = divisionMap[divisionName];

    await prisma.fighter.create({
      data: {
        name,
        nickname: i % 3 === 0 ? "The Predator" : i % 5 === 0 ? "The Great" : "",
        nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
        divisionId,
        rank: (i % 15) + 1,
        wins: Math.floor(Math.random() * 30) + 5,
        losses: Math.floor(Math.random() * 10),
        draws: Math.floor(Math.random() * 2),
        avgL5: Math.floor(Math.random() * 100),
        isActive: true,
        age: Math.floor(Math.random() * 15) + 20,
        height: `${Math.floor(Math.random() * 30) + 160} cm`,
        bio: `Professional fighter in the ${divisionName} division.`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, "")}`,
      },
    });
  }

  console.log("✨ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
