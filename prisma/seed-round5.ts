/* eslint-disable */
import { config } from "dotenv";
config({ path: ".env", override: true });
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// 700 realistic Ethiopian senior names — mix of Natural and Social streams
const FIRST_NAMES_N_M = [
  "Amanuel","Abel","Yonatan","Nahom","Kaleb","Dawit","Samuel","Eyob","Robel","Henok",
  "Biruk","Yared","Million","Tesfaye","Solomon","Biniyam","Tewodros","Mikiyas","Haben","Nathnael",
  "Abraham","Daniel","Ermias","Fedlu","Girmay","Haile","Iyasu","Kiflom","Leul","Mehari",
  "Nardos","Oromay","Petros","Robera","Sura","Tsegaye","Ugbad","Vaino","Wondimu","Yohannes",
];
const FIRST_NAMES_F = [
  "Hanna","Saron","Mahlet","Bethel","Ruth","Selam","Hewan","Lidya","Merhawit","Tsion",
  "Bethelehem","Dibora","Eden","Fikir","Hanna","Kidist","Lily","Marta","Nardos","Rebecca",
  "Sarah","Saba","Tigist","Yohana","Zema","Aster","Beza","Chuna","Desta","Eleni",
  "Frehiwot","Genet","Hilina","Kalkidan","Lemlem","Mestawet","Nigist","Rahel","Senait","Tiruwork",
];
const LAST_NAMES = [
  "Tesfaye","Bekele","Girma","Alemu","Haile","Tadesse","Assefa","Mekonnen","Negash","Worku",
  "Solomon","Abraham","Kebede","Girma","Hailu","Tesfaye","Abebe","Demeke","Fikru","Gebre",
  "Gebreselassie","Hailu","Kassa","Lemma","Mengistu","Tesfaye","Wolde","Yohannes","Zerihun","Asfaw",
  "Berhe","Desta","Gebremedhin","Hailemariam","Kebede","Mekuria","Negussie","Teshome","Woldegiorgis","Yimer",
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

async function main() {
  console.log("🌱 Seeding 700 students + footer data...");

  // --- 700 Students ---
  await db.student.deleteMany({});
  const streams = ["Natural", "Social"];
  const sections = ["A", "B", "C", "D"];
  const clubs = ["Science Club","Debate","Drama","Sports","Art","Music","Coding","Journalism","Math","Photography"];
  const quotes = [
    "We didn't just survive — we thrived.",
    "Every moment was a lesson.",
    "The future is bright because we built it.",
    "We are the story they'll tell.",
    "Legends never graduate — they evolve.",
    "From strangers to family in four years.",
    "The batch that rewrote the rules.",
    "We came as kids, leaving as legends.",
    "Yellow & green till the end.",
    "This is just the beginning.",
    "We made every second count.",
    "Forever part of something bigger.",
    "The best is yet to come.",
    "We wrote our own chapter.",
    "Class of 2027, forever.",
  ];
  const plans = [
    "Computer Science, AAU","Medicine, St. Paul's","Engineering, ASTU","Law, AAU",
    "Business, AAU","Architecture, EiABC","Software Engineering","Pharmacy, AAU",
    "Mechanical Engineering","Journalism, AAU","Electrical Engineering","Public Health",
    "Economics, AAU","Psychology, AAU","Civil Engineering, ASTU","Biotechnology",
    "International Relations","Accounting, AAU","Nursing, Gondar","Architecture",
  ];

  let idx = 0;
  for (let i = 0; i < 700; i++) {
    const isNatural = i % 2 === 0;
    const first = isNatural ? pick(FIRST_NAMES_N_M, i) : pick(FIRST_NAMES_F, i);
    const last = pick(LAST_NAMES, i * 3 + 1);
    const name = `${first} ${last}`;
    const stream = streams[i % 2];
    const section = sections[i % 4];
    const club = clubs[i % clubs.length];
    const quote = quotes[i % quotes.length];
    const futurePlan = plans[i % plans.length];
    const featured = i < 12; // first 12 featured
    await db.student.create({
      data: {
        name,
        nickname: first,
        section,
        stream,
        club,
        quote,
        futurePlan,
        photoUrl: null, // admin can upload later
        order: i,
        featured,
        published: true,
      },
    });
    idx++;
    if (idx % 100 === 0) console.log(`  ✓ ${idx} students...`);
  }
  console.log(`  ✓ ${idx} students total`);

  // --- Footer Link Groups ---
  await db.footerLinkGroup.deleteMany({});
  await db.footerLink.deleteMany({});
  const groups = [
    { title: "Explore", order: 0, links: [
      { label: "Home", href: "/", order: 0 },
      { label: "Our Story", href: "/story", order: 1 },
      { label: "Moments", href: "/moments", order: 2 },
      { label: "Gallery", href: "/gallery", order: 3 },
    ]},
    { title: "Experience", order: 1, links: [
      { label: "Events", href: "/events", order: 0 },
      { label: "Announcements", href: "/announcements", order: 1 },
      { label: "Videos", href: "/videos", order: 2 },
      { label: "Contact", href: "/contact", order: 3 },
    ]},
    { title: "Batch", order: 2, links: [
      { label: "Seniors", href: "/seniors", order: 0, isNew: true },
      { label: "Graduation", href: "/graduation", order: 1 },
      { label: "Merch", href: "/merch", order: 2 },
      { label: "Admin", href: "/admin", order: 3 },
    ]},
  ];
  for (const g of groups) {
    const grp = await db.footerLinkGroup.create({ data: { title: g.title, order: g.order, visible: true } });
    for (const l of g.links) {
      await db.footerLink.create({ data: { ...l, groupId: grp.id } });
    }
  }
  console.log(`  ✓ ${groups.length} footer link groups`);

  // --- Visit Counter ---
  await db.visitCounter.upsert({
    where: { id: "visits" },
    update: {},
    create: { id: "visits", count: 1247, month: new Date().toISOString().slice(0, 7) },
  });
  console.log("  ✓ visit counter");

  console.log("\n✅ Seed complete.");
  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
