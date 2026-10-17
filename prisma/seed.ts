/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "dotenv";
config({ path: ".env", override: true });
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Enouement 2K27...\n");

  // --- Super admin ---
  // Credentials MUST come from env vars. Never hardcode defaults.
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    console.error(
      "\n❌ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD env vars are required to seed.\n" +
        "   Copy .env.example to .env and fill them in, then re-run `bun run seed`.\n"
    );
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.SUPER_ADMIN, active: true },
    create: { email, name: "Super Admin", passwordHash, role: Role.SUPER_ADMIN, active: true, mustChangePassword: true },
  });
  console.log(`  ✓ Super admin → ${email}`);

  // --- Site settings ---
  await db.siteSetting.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      siteName: "Enouement 2K27",
      tagline: "The Final Chapter — Class of 2027",
      description:
        "A cinematic memory of the senior batch. Every moment, every face, every story — preserved forever.",
      primaryColor: "#FFE600",
      secondaryColor: "#00C853",
      countdownLabel: "Graduation Day",
      countdownDate: new Date("2027-06-26T09:00:00+03:00"),
      socialLinks: {
        instagram: "https://instagram.com",
        telegram: "https://t.me",
        tiktok: "https://tiktok.com",
        youtube: "https://youtube.com",
      },
      contactInfo: {
        email: "hello@enouement2k27.et",
        school: "Senior Secondary School",
        location: "Addis Ababa, Ethiopia",
      },
      footerText: "Enouement 2K27 — Class of 2027. Crafted with obsession. 🟡🟢",
    },
  });
  console.log("  ✓ Site settings");

  // --- Nav links ---
  const nav = [
    { label: "Home", href: "/", icon: "Home" },
    { label: "Our Story", href: "/story", icon: "BookOpen" },
    { label: "Moments", href: "/moments", icon: "Camera" },
    { label: "Gallery", href: "/gallery", icon: "Images" },
    { label: "Seniors", href: "/seniors", icon: "Users" },
    { label: "Events", href: "/events", icon: "Calendar" },
    { label: "Graduation", href: "/graduation", icon: "GraduationCap" },
    { label: "Contact", href: "/contact", icon: "Mail" },
  ];
  await db.navLink.deleteMany({});
  for (let i = 0; i < nav.length; i++) {
    await db.navLink.create({ data: { ...nav[i], order: i } });
  }
  console.log(`  ✓ ${nav.length} nav links`);

  // --- Hero media (using gradient placeholders) ---
  await db.heroMedia.deleteMany({});
  const hero = [
    { url: "/hero/hero-1.jpg", title: "The Beginning", transition: "zoom", duration: 7000 },
    { url: "/hero/hero-2.jpg", title: "The Journey", transition: "fade", duration: 6000 },
    { url: "/hero/hero-3.jpg", title: "The Legacy", transition: "slide", duration: 6500 },
  ];
  for (let i = 0; i < hero.length; i++) {
    await db.heroMedia.create({ data: { ...hero[i], type: "image", order: i } });
  }
  console.log(`  ✓ ${hero.length} hero slides`);

  // --- Story chapters ---
  await db.storyChapter.deleteMany({});
  const chapters = [
    {
      title: "Grade 9 — The First Day",
      subtitle: "Strangers became a family",
      year: "2022",
      body:
        "We walked in as strangers, hearts pounding, uniforms crisp. None of us knew that this room would become home for the next four years. The laughter, the chaos, the friendships that would define us — all started here.",
      coverUrl: "/story/chapter-1.jpg",
    },
    {
      title: "Grade 10 — Finding Our Rhythm",
      subtitle: "The year we grew up",
      year: "2023",
      body:
        "By second year we had our rhythm. Study groups that turned into inside jokes, teachers who became mentors, and the realization that time was moving faster than we thought.",
      coverUrl: "/story/chapter-2.jpg",
    },
    {
      title: "Grade 11 — The Pressure",
      subtitle: "When it got real",
      year: "2024",
      body:
        "The workload hit different. Late nights, endless coffee, group projects that tested every friendship. But somewhere in the chaos we found our people — the ones who'd carry us to the finish line.",
      coverUrl: "/story/chapter-3.jpg",
    },
    {
      title: "Grade 12 — The Final Lap",
      subtitle: "EUEE season and beyond",
      year: "2026",
      body:
        "The final year. Every moment felt heavier, brighter, more precious. Senior days, farewells, the last first day. We're not just classmates anymore — we're a chapter of history.",
      coverUrl: "/story/chapter-4.jpg",
    },
  ];
  for (let i = 0; i < chapters.length; i++) {
    await db.storyChapter.create({ data: { ...chapters[i], order: i } });
  }
  console.log(`  ✓ ${chapters.length} story chapters`);

  // --- Posts (Moments) ---
  await db.post.deleteMany({});
  const posts = [
    { caption: "Senior sunrise — we made it to the top 🌅", tags: ["senior", "sunrise"], mediaUrls: ["/feed/feed-1.jpg"] },
    { caption: "Study session turned into a photoshoot 📸", tags: ["study", "friends"], mediaUrls: ["/feed/feed-2.jpg"] },
    { caption: "The boys after the big game ⚽", tags: ["sports"], mediaUrls: ["/feed/feed-3.jpg"] },
    { caption: "Class color day — yellow & green supremacy 💛💚", tags: ["colors", "senior"], mediaUrls: ["/feed/feed-4.jpg"], pinned: true },
    { caption: "Last Friday together before exams 📚", tags: ["farewell"], mediaUrls: ["/feed/feed-5.jpg"] },
    { caption: "Surprise birthday for our class rep 🎂", tags: ["birthday"], mediaUrls: ["/feed/feed-6.jpg"] },
  ];
  for (let i = 0; i < posts.length; i++) {
    await db.post.create({
      data: {
        ...posts[i],
        mediaType: "image",
        likeCount: Math.floor(Math.random() * 240) + 30,
        authorName: "Enouement 2K27",
        createdAt: new Date(Date.now() - i * 86400000 * 2),
      },
    });
  }
  console.log(`  ✓ ${posts.length} feed posts`);

  // --- Albums ---
  await db.album.deleteMany({});
  const albums = [
    { title: "Senior Sunrise", category: "senior", coverUrl: "/gallery/album-1.jpg", description: "The morning we celebrated our last year." },
    { title: "Sports Day", category: "sports", coverUrl: "/gallery/album-2.jpg", description: "Sweat, glory, and yellow vs green." },
    { title: "Class Trip", category: "trips", coverUrl: "/gallery/album-3.jpg", description: "Memories made on the road." },
    { title: "Cultural Day", category: "events", coverUrl: "/gallery/album-4.jpg", description: "Celebrating who we are." },
    { title: "Everyday Class", category: "class", coverUrl: "/gallery/album-5.jpg", description: "The little moments that matter most." },
  ];
  for (let i = 0; i < albums.length; i++) {
    await db.album.create({
      data: {
        ...albums[i],
        order: i,
        media: {
          create: Array.from({ length: 4 }).map((_, j) => ({
            url: `/gallery/album-${i + 1}-${j + 1}.jpg`,
            type: "image",
            order: j,
          })),
        },
      },
    });
  }
  console.log(`  ✓ ${albums.length} albums`);

  // --- Merch ---
  await db.merchItem.deleteMany({});
  await db.merchItem.create({
    data: {
      name: "Enouement Senior Hoodie",
      description: "The official senior batch hoodie. Premium heavyweight cotton, embroidered batch crest, and the year that changed everything.",
      price: 1500,
      imageUrls: ["/merch/hoodie-1.jpg", "/merch/hoodie-2.jpg", "/merch/hoodie-3.jpg"],
      colors: ["#FFE600", "#00C853", "#0B130E"],
      sizes: ["S", "M", "L", "XL"],
      details: "320gsm brushed cotton • Embroidered crest • Oversized fit • Made in Ethiopia",
      featured: true,
    },
  });
  await db.merchItem.create({
    data: {
      name: "Class of '27 Tee",
      description: "Lightweight summer tee with the batch mark. Wear the memory every day.",
      price: 700,
      imageUrls: ["/merch/tee-1.jpg", "/merch/tee-2.jpg"],
      colors: ["#FFE600", "#0B130E"],
      sizes: ["S", "M", "L"],
      details: "180gsm combed cotton • Screen print • Regular fit",
    },
  });
  console.log("  ✓ 2 merch items");

  // --- Announcements ---
  await db.announcement.deleteMany({});
  const announcements = [
    {
      title: "Senior Week Schedule is Live",
      slug: "senior-week-schedule",
      excerpt: "Everything you need to know about the most important week of the year.",
      body: "# Senior Week\n\nMonday — Senior Sunrise\nTuesday — Throwback Day\nWednesday — Cultural Day\nThursday — Awards Night\nFriday — Farewell Ceremony\n\nBe there. Every moment counts.",
      category: "news",
      pinned: true,
      urgent: true,
    },
    {
      title: "EUEE Results Preparation",
      slug: "euee-preparation",
      excerpt: "How we're preparing for the biggest exam of our lives.",
      body: "The Ethiopian University Entrance Examination is around the corner. Study groups, past papers, and mental health support are all in place.",
      category: "academic",
    },
    {
      title: "Yearbook Photos — Final Call",
      slug: "yearbook-photos",
      excerpt: "Last chance to submit your senior portrait.",
      body: "Submit your yearbook photo by Friday. Dress code: smart casual. Smile like you mean it.",
      category: "announcement",
    },
  ];
  for (let i = 0; i < announcements.length; i++) {
    await db.announcement.create({
      data: {
        ...announcements[i],
        publishAt: new Date(Date.now() - i * 86400000 * 3),
      },
    });
  }
  console.log(`  ✓ ${announcements.length} announcements`);

  // --- Events ---
  await db.event.deleteMany({});
  const now = Date.now();
  const events = [
    {
      title: "Senior Sunrise",
      slug: "senior-sunrise",
      description: "Watch the first sunrise of our final year together.",
      location: "School Rooftop, Addis Ababa",
      startDate: new Date(now + 7 * 86400000),
      category: "senior",
      coverUrl: "/events/event-1.jpg",
    },
    {
      title: "Cultural Day",
      slug: "cultural-day",
      description: "A celebration of who we are and where we come from.",
      location: "Main Hall",
      startDate: new Date(now + 21 * 86400000),
      category: "special",
      coverUrl: "/events/event-2.jpg",
    },
    {
      title: "Farewell Ceremony",
      slug: "farewell-ceremony",
      description: "The goodbye we'll never forget.",
      location: "Auditorium",
      startDate: new Date(now + 45 * 86400000),
      category: "farewell",
      coverUrl: "/events/event-3.jpg",
    },
    {
      title: "Graduation Day",
      slug: "graduation-day",
      description: "The walk. The robe. The moment.",
      location: "Grand Hall, Addis Ababa",
      startDate: new Date("2027-06-26T09:00:00+03:00"),
      endDate: new Date("2027-06-26T14:00:00+03:00"),
      category: "graduation",
      coverUrl: "/events/event-4.jpg",
    },
  ];
  for (let i = 0; i < events.length; i++) {
    await db.event.create({ data: events[i] });
  }
  console.log(`  ✓ ${events.length} events`);

  // --- Graduation content ---
  await db.graduationContent.upsert({
    where: { id: "graduation" },
    update: {},
    create: {
      id: "graduation",
      headline: "The Walk",
      intro: "Four years of laughter, tears, and growth — all leading to this single, unforgettable moment.",
      countdownDate: new Date("2027-06-26T09:00:00+03:00"),
      program: [
        { time: "09:00", title: "Gathering & Robing", detail: "Seniors assemble in the grand hall" },
        { time: "10:00", title: "Procession", detail: "The walk begins" },
        { time: "10:30", title: "Opening Address", detail: "Words from the principal" },
        { time: "11:00", title: "Valedictorian Speech", detail: "The voice of our batch" },
        { time: "11:30", title: "Awarding of Diplomas", detail: "The moment we've earned" },
        { time: "12:30", title: "Closing & Photos", detail: "Forever captured" },
      ],
      thankYouText:
        "To the teachers who believed in us, the parents who carried us, and the friends who became family — thank you. This is as much yours as it is ours.",
    },
  });
  console.log("  ✓ Graduation content");

  // --- Students ---
  await db.student.deleteMany({});
  const names = [
    { name: "Amanuel Tesfaye", quote: "We didn't just survive — we thrived.", futurePlan: "Computer Science, AAU", nickname: "Aman", section: "A", stream: "Natural" },
    { name: "Hanna Bekele", quote: "Every moment was a lesson.", futurePlan: "Medicine, St. Paul's", nickname: "Hanna", section: "B", stream: "Natural" },
    { name: "Yonatan Girma", quote: "The future is bright because we built it.", futurePlan: "Engineering, ASTU", nickname: "Yoni", section: "A", stream: "Natural" },
    { name: "Saron Alemu", quote: "We are the story they'll tell.", futurePlan: "Law, Addis Ababa University", nickname: "Sari", section: "B", stream: "Social" },
    { name: "Dawit Haile", quote: "Legends never graduate — they evolve.", futurePlan: "Business, AAU", nickname: "Dawe", section: "A", stream: "Social" },
    { name: "Mahlet Tadesse", quote: "From strangers to family in four years.", futurePlan: "Architecture, EiABC", nickname: "Mimi", section: "B", stream: "Natural" },
    { name: "Nahom Solomon", quote: "The batch that rewrote the rules.", futurePlan: "Software Engineering", nickname: "Naho", section: "A", stream: "Natural" },
    { name: "Bethel Negash", quote: "We came as kids, leaving as legends.", futurePlan: "Pharmacy, AAU", nickname: "Beth", section: "B", stream: "Social" },
    { name: "Kaleb Assefa", quote: "Yellow & green till the end.", futurePlan: "Mechanical Engineering", nickname: "Kale", section: "A", stream: "Natural" },
    { name: "Ruth Tesfa", quote: "This is just the beginning.", futurePlan: "Journalism, AAU", nickname: "Ruthie", section: "B", stream: "Social" },
    { name: "Abel Mekonnen", quote: "We made every second count.", futurePlan: "Electrical Engineering", nickname: "Abe", section: "A", stream: "Natural" },
    { name: "Selam Worku", quote: "Forever part of something bigger.", futurePlan: "Public Health", nickname: "Sel", section: "B", stream: "Social" },
  ];
  for (let i = 0; i < names.length; i++) {
    await db.student.create({
      data: {
        ...names[i],
        photoUrl: `/seniors/senior-${(i % 6) + 1}.jpg`,
        order: i,
        featured: i < 4,
      },
    });
  }
  console.log(`  ✓ ${names.length} students`);

  // --- Videos ---
  await db.video.deleteMany({});
  await db.video.create({
    data: {
      title: "Enouement 2K27 — Official Trailer",
      description: "A year of memories, captured in motion.",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      posterUrl: "/videos/video-1.jpg",
      category: "trailer",
      featured: true,
    },
  });
  await db.video.create({
    data: {
      title: "Senior Sunrise Recap",
      description: "The morning that started it all.",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      posterUrl: "/videos/video-2.jpg",
      category: "event",
    },
  });
  console.log("  ✓ 2 videos");

  console.log("\n✅ Seed complete.\n");
  console.log("Super Admin login:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
