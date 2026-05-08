import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const topics = [
  {
    title: "Quantum Physics",
    slug: "quantum-physics",
    category: "Science",
    difficulty: "Advanced",
    description:
      "Explore the fundamental principles of quantum mechanics including wave-particle duality, superposition, quantum entanglement, and the uncertainty principle. Understand how quantum physics shapes our understanding of the subatomic world.",
    studyCount: 1240,
  },
  {
    title: "World War II",
    slug: "world-war-ii",
    category: "History",
    difficulty: "Intermediate",
    description:
      "A comprehensive study of the Second World War, from the rise of fascism to the Allied victory. Covers major battles, key leaders, the Holocaust, and the war's lasting impact on the world order.",
    studyCount: 2150,
  },
  {
    title: "Machine Learning",
    slug: "machine-learning",
    category: "Technology",
    difficulty: "Advanced",
    description:
      "Dive into the fundamentals of machine learning including supervised and unsupervised learning, neural networks, decision trees, and model evaluation. Learn how machines learn from data to make predictions.",
    studyCount: 3420,
  },
  {
    title: "Roman Empire",
    slug: "roman-empire",
    category: "History",
    difficulty: "Beginner",
    description:
      "Discover the rise and fall of the Roman Empire, one of the most powerful civilizations in history. From the founding of Rome to the fall of Constantinople, learn about its politics, culture, and legacy.",
    studyCount: 980,
  },
  {
    title: "JavaScript Fundamentals",
    slug: "javascript-fundamentals",
    category: "Technology",
    difficulty: "Beginner",
    description:
      "Master the building blocks of JavaScript: variables, functions, loops, objects, and DOM manipulation. Understand closures, prototypes, and modern ES6+ features that power the web.",
    studyCount: 4500,
  },
  {
    title: "Human Anatomy",
    slug: "human-anatomy",
    category: "Science",
    difficulty: "Intermediate",
    description:
      "Study the structure of the human body including the skeletal, muscular, cardiovascular, nervous, and digestive systems. Understand how organ systems work together to maintain homeostasis.",
    studyCount: 1870,
  },
  {
    title: "Introduction to Psychology",
    slug: "introduction-to-psychology",
    category: "Science",
    difficulty: "Beginner",
    description:
      "Explore the science of mind and behavior. Topics include perception, memory, learning, personality, social psychology, and mental health disorders. Understand what drives human thought and action.",
    studyCount: 2340,
  },
  {
    title: "Climate Change",
    slug: "climate-change",
    category: "Science",
    difficulty: "Intermediate",
    description:
      "Understand the science behind climate change, its causes, effects on ecosystems and human societies, and potential solutions. Explore greenhouse gases, global warming trends, and sustainability practices.",
    studyCount: 1560,
  },
  {
    title: "The French Revolution",
    slug: "the-french-revolution",
    category: "History",
    difficulty: "Intermediate",
    description:
      "Study the causes, events, and aftermath of the French Revolution. From the storming of the Bastille to Napoleon's rise, understand how this revolution reshaped European politics and society.",
    studyCount: 1120,
  },
  {
    title: "Data Structures",
    slug: "data-structures",
    category: "Technology",
    difficulty: "Intermediate",
    description:
      "Learn essential data structures including arrays, linked lists, stacks, queues, trees, graphs, and hash tables. Understand their operations, time complexities, and when to use each.",
    studyCount: 2890,
  },
  {
    title: "Microeconomics",
    slug: "microeconomics",
    category: "Business",
    difficulty: "Beginner",
    description:
      "Study the behavior of individuals and firms in making decisions about scarce resources. Topics include supply and demand, market structures, pricing strategies, and consumer behavior.",
    studyCount: 1450,
  },
  {
    title: "Digital Marketing",
    slug: "digital-marketing",
    category: "Business",
    difficulty: "Beginner",
    description:
      "Master the fundamentals of digital marketing including SEO, social media marketing, content marketing, email campaigns, and analytics. Learn to build effective online marketing strategies.",
    studyCount: 2670,
  },
  {
    title: "Art History: Renaissance",
    slug: "art-history-renaissance",
    category: "Arts",
    difficulty: "Beginner",
    description:
      "Explore the artistic revolution of the Renaissance period. Study the works of Leonardo da Vinci, Michelangelo, Raphael, and other masters. Understand the cultural and philosophical shifts that drove this era.",
    studyCount: 890,
  },
  {
    title: "Nutrition and Diet",
    slug: "nutrition-and-diet",
    category: "Health",
    difficulty: "Beginner",
    description:
      "Learn the fundamentals of nutrition including macronutrients, micronutrients, dietary guidelines, and the science behind healthy eating. Understand how food choices impact physical and mental health.",
    studyCount: 1980,
  },
  {
    title: "Organic Chemistry",
    slug: "organic-chemistry",
    category: "Science",
    difficulty: "Advanced",
    description:
      "Study the chemistry of carbon-containing compounds. Topics include molecular structure, nomenclature, reaction mechanisms, stereochemistry, and functional groups essential for understanding biochemistry.",
    studyCount: 760,
  },
  {
    title: "Artificial Intelligence Ethics",
    slug: "artificial-intelligence-ethics",
    category: "Technology",
    difficulty: "Intermediate",
    description:
      "Examine the ethical implications of AI development and deployment. Topics include bias in algorithms, privacy concerns, autonomous weapons, job displacement, and responsible AI governance.",
    studyCount: 1340,
  },
  {
    title: "Music Theory Basics",
    slug: "music-theory-basics",
    category: "Arts",
    difficulty: "Beginner",
    description:
      "Understand the fundamentals of music including scales, chords, rhythm, harmony, and melody. Learn to read sheet music and understand the theory behind musical composition.",
    studyCount: 1100,
  },
  {
    title: "Financial Accounting",
    slug: "financial-accounting",
    category: "Business",
    difficulty: "Intermediate",
    description:
      "Learn the principles of financial accounting including the accounting equation, journal entries, financial statements, and generally accepted accounting principles (GAAP).",
    studyCount: 1690,
  },
  {
    title: "Linear Algebra",
    slug: "linear-algebra",
    category: "Science",
    difficulty: "Advanced",
    description:
      "Study vectors, matrices, linear transformations, eigenvalues, and vector spaces. Essential for computer science, physics, and engineering applications.",
    studyCount: 1520,
  },
  {
    title: "Public Speaking",
    slug: "public-speaking",
    category: "Arts",
    difficulty: "Beginner",
    description:
      "Master the art of public speaking. Learn techniques for structuring presentations, managing stage fright, engaging audiences, and delivering memorable speeches with confidence.",
    studyCount: 2100,
  },
  {
    title: "Cybersecurity Fundamentals",
    slug: "cybersecurity-fundamentals",
    category: "Technology",
    difficulty: "Intermediate",
    description:
      "Understand the basics of cybersecurity including threat analysis, encryption, network security, authentication protocols, and best practices for protecting digital assets.",
    studyCount: 1830,
  },
  {
    title: "Meditation and Mindfulness",
    slug: "meditation-and-mindfulness",
    category: "Health",
    difficulty: "Beginner",
    description:
      "Learn the science and practice of meditation and mindfulness. Explore techniques for stress reduction, improved focus, emotional regulation, and overall mental well-being.",
    studyCount: 2450,
  },
  {
    title: "Blockchain Technology",
    slug: "blockchain-technology",
    category: "Technology",
    difficulty: "Advanced",
    description:
      "Understand the fundamentals of blockchain technology including distributed ledgers, consensus mechanisms, smart contracts, and decentralized applications (dApps).",
    studyCount: 1150,
  },
  {
    title: "Ancient Greek Philosophy",
    slug: "ancient-greek-philosophy",
    category: "History",
    difficulty: "Intermediate",
    description:
      "Study the foundational philosophers of Western thought: Socrates, Plato, and Aristotle. Explore their ideas on ethics, politics, metaphysics, and epistemology that continue to influence modern thinking.",
    studyCount: 1380,
  },
];

async function seed() {
  console.log("🌱 Seeding database...\n");

  // Upsert topics
  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: topic,
      create: topic,
    });
    console.log(`  ✓ Topic: ${topic.title}`);
  }

  console.log(`\n✅ Seeded ${topics.length} topics successfully.`);

  await prisma.$disconnect();
  await pool.end();
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
