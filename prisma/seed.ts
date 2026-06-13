import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Difficulty } from "@/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import {
  parseKeyConcepts,
  parseLearningResources,
  type KeyConcept,
  type LearningResource,
} from "@/lib/topic-content";

loadEnv({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type TopicSeed = {
  title: string;
  description: string;
  difficulty: Difficulty;
  orderIndex: number;
  estimatedMinutes: number;
};

type LearningPathSeed = {
  id: string;
  title: string;
  description: string;
  level: Difficulty;
  topics: TopicSeed[];
};

type SeedContentFile = {
  learningPath: string;
  topics: {
    title: string;
    keyConcepts?: unknown;
    learningResources?: unknown;
  }[];
};

const learningPaths: LearningPathSeed[] = [
  {
    id: "path-frontend",
    title: "Frontend Fundamentals",
    description:
      "Build a solid foundation in web development — from HTML structure to React state management. Ideal for beginners who want to build real, interactive websites.",
    level: "BEGINNER",
    topics: [
      {
        title: "HTML Basics",
        description:
          "Learn the building blocks of every web page: elements, attributes, headings, paragraphs, links, images, and semantic structure.",
        difficulty: "BEGINNER",
        orderIndex: 1,
        estimatedMinutes: 45,
      },
      {
        title: "CSS Fundamentals",
        description:
          "Style your HTML with colors, fonts, spacing, and layout. Understand the box model, selectors, and how to make pages look good.",
        difficulty: "BEGINNER",
        orderIndex: 2,
        estimatedMinutes: 60,
      },
      {
        title: "JavaScript Variables",
        description:
          "Start programming in the browser. Learn variables, data types, operators, and how JavaScript stores and manipulates information.",
        difficulty: "BEGINNER",
        orderIndex: 3,
        estimatedMinutes: 45,
      },
      {
        title: "JavaScript Functions",
        description:
          "Write reusable blocks of code with functions. Understand parameters, return values, scope, and how functions power interactive behavior.",
        difficulty: "BEGINNER",
        orderIndex: 4,
        estimatedMinutes: 50,
      },
      {
        title: "DOM Manipulation",
        description:
          "Use JavaScript to read and change what's on the page. Query elements, respond to user events, and update content dynamically.",
        difficulty: "INTERMEDIATE",
        orderIndex: 5,
        estimatedMinutes: 60,
      },
      {
        title: "React Components",
        description:
          "Build UIs from composable components. Learn JSX, how to create functional components, and how React renders UI to the browser.",
        difficulty: "INTERMEDIATE",
        orderIndex: 6,
        estimatedMinutes: 60,
      },
      {
        title: "React State",
        description:
          "Make components interactive with useState. Understand how state triggers re-renders and how to manage changing data in a component.",
        difficulty: "INTERMEDIATE",
        orderIndex: 7,
        estimatedMinutes: 55,
      },
      {
        title: "React Props",
        description:
          "Pass data between components using props. Learn how parent components share information with children and how to type props in TypeScript.",
        difficulty: "INTERMEDIATE",
        orderIndex: 8,
        estimatedMinutes: 45,
      },
      {
        title: "React Effects",
        description:
          "Sync components with the outside world using useEffect. Understand when effects run, how to fetch data, and how to clean up side effects.",
        difficulty: "INTERMEDIATE",
        orderIndex: 9,
        estimatedMinutes: 55,
      },
    ],
  },
  {
    id: "path-python",
    title: "Python Foundations",
    description:
      "Learn Python from the ground up — variables, logic, loops, functions, and data structures. A practical path for beginners building real programming intuition.",
    level: "BEGINNER",
    topics: [
      {
        title: "Variables and Data Types",
        description:
          "Store information in Python using variables. Learn about strings, integers, floats, booleans, and how Python infers types automatically.",
        difficulty: "BEGINNER",
        orderIndex: 1,
        estimatedMinutes: 40,
      },
      {
        title: "Conditionals",
        description:
          "Make decisions in code with if, elif, and else. Learn comparison operators, logical operators, and how programs branch based on conditions.",
        difficulty: "BEGINNER",
        orderIndex: 2,
        estimatedMinutes: 40,
      },
      {
        title: "Loops",
        description:
          "Repeat actions with for and while loops. Learn iteration, range(), loop control (break/continue), and how to process collections of data.",
        difficulty: "BEGINNER",
        orderIndex: 3,
        estimatedMinutes: 45,
      },
      {
        title: "Functions",
        description:
          "Write reusable code with functions. Understand def, parameters, default arguments, return values, and how functions help organize programs.",
        difficulty: "BEGINNER",
        orderIndex: 4,
        estimatedMinutes: 50,
      },
      {
        title: "Lists and Dictionaries",
        description:
          "Work with Python's core data structures. Learn to create, access, modify, and iterate over lists and dictionaries — the building blocks of most Python programs.",
        difficulty: "BEGINNER",
        orderIndex: 5,
        estimatedMinutes: 55,
      },
      {
        title: "Classes and Objects",
        description:
          "Model real-world concepts with object-oriented programming. Learn classes, __init__, instance methods, attributes, and the basics of OOP in Python.",
        difficulty: "INTERMEDIATE",
        orderIndex: 6,
        estimatedMinutes: 60,
      },
      {
        title: "File Handling",
        description:
          "Read from and write to files in Python. Learn open(), read/write modes, context managers (with statement), and how to process text data.",
        difficulty: "INTERMEDIATE",
        orderIndex: 7,
        estimatedMinutes: 45,
      },
      {
        title: "Error Handling",
        description:
          "Write resilient programs with try/except. Understand exceptions, how to catch specific errors, raise your own, and keep programs from crashing unexpectedly.",
        difficulty: "INTERMEDIATE",
        orderIndex: 8,
        estimatedMinutes: 45,
      },
    ],
  },
  {
    id: "path-cs",
    title: "Computer Science Fundamentals",
    description:
      "Understand the data structures and algorithms behind every software system. Essential preparation for technical interviews and deeper engineering work.",
    level: "INTERMEDIATE",
    topics: [
      {
        title: "Big O Notation",
        description:
          "Measure and compare the efficiency of algorithms. Learn time and space complexity, O(n), O(log n), O(n²), and how to reason about code performance.",
        difficulty: "INTERMEDIATE",
        orderIndex: 1,
        estimatedMinutes: 55,
      },
      {
        title: "Arrays",
        description:
          "The most fundamental data structure. Learn how arrays store data in memory, how indexing works, and common array operations with their time complexities.",
        difficulty: "BEGINNER",
        orderIndex: 2,
        estimatedMinutes: 45,
      },
      {
        title: "Linked Lists",
        description:
          "A dynamic alternative to arrays. Understand nodes, pointers, singly vs. doubly linked lists, and how to traverse, insert, and delete efficiently.",
        difficulty: "INTERMEDIATE",
        orderIndex: 3,
        estimatedMinutes: 60,
      },
      {
        title: "Stacks and Queues",
        description:
          "Two essential abstract data types. Learn LIFO (stacks) vs. FIFO (queues), how to implement them, and when each is the right tool for the job.",
        difficulty: "INTERMEDIATE",
        orderIndex: 4,
        estimatedMinutes: 50,
      },
      {
        title: "Hash Maps",
        description:
          "The secret behind O(1) lookups. Understand hash functions, collision handling, and why hash maps power so many real-world features (caches, sets, counts).",
        difficulty: "INTERMEDIATE",
        orderIndex: 5,
        estimatedMinutes: 60,
      },
      {
        title: "Recursion",
        description:
          "Solve problems by having functions call themselves. Learn the base case, recursive case, the call stack, and how to convert loops to recursive solutions.",
        difficulty: "INTERMEDIATE",
        orderIndex: 6,
        estimatedMinutes: 60,
      },
      {
        title: "Sorting",
        description:
          "Learn the classic sorting algorithms — bubble, selection, insertion, merge, and quick sort — and understand when each one is efficient.",
        difficulty: "INTERMEDIATE",
        orderIndex: 7,
        estimatedMinutes: 65,
      },
      {
        title: "Searching",
        description:
          "Find data efficiently with linear and binary search. Understand why binary search requires sorted data and how it achieves O(log n) performance.",
        difficulty: "BEGINNER",
        orderIndex: 8,
        estimatedMinutes: 45,
      },
    ],
  },
];

const seedDataDirectory = fileURLToPath(new URL("./seed-data", import.meta.url));

function topicKey(learningPath: string, topicTitle: string): string {
  return `${learningPath}:::${topicTitle}`;
}

async function loadTopicContentMap() {
  const files = await readdir(seedDataDirectory);
  const jsonFiles = files.filter((file) => file.endsWith(".json")).sort();
  const topicContentMap = new Map<
    string,
    { keyConcepts: KeyConcept[]; learningResources: LearningResource[] }
  >();

  for (const file of jsonFiles) {
    const contents = await readFile(join(seedDataDirectory, file), "utf8");
    const parsed = JSON.parse(contents) as SeedContentFile;

    for (const topic of parsed.topics) {
      topicContentMap.set(topicKey(parsed.learningPath, topic.title), {
        keyConcepts: parseKeyConcepts(topic.keyConcepts as Prisma.JsonValue | undefined),
        learningResources: parseLearningResources(
          topic.learningResources as Prisma.JsonValue | undefined
        ),
      });
    }
  }

  return topicContentMap;
}

async function seedTopicsForPath(
  learningPath: LearningPathSeed,
  topicContentMap: Map<
    string,
    { keyConcepts: KeyConcept[]; learningResources: LearningResource[] }
  >
) {
  await prisma.learningPath.upsert({
    where: { id: learningPath.id },
    update: {
      title: learningPath.title,
      description: learningPath.description,
      level: learningPath.level,
    },
    create: {
      id: learningPath.id,
      title: learningPath.title,
      description: learningPath.description,
      level: learningPath.level,
    },
  });

  const existingTopics = await prisma.topic.findMany({
    where: { learningPathId: learningPath.id },
    select: { id: true, title: true },
  });

  const existingByTitle = new Map(existingTopics.map((topic) => [topic.title, topic.id]));

  for (const topic of learningPath.topics) {
    const content =
      topicContentMap.get(topicKey(learningPath.title, topic.title)) ?? null;

    const topicData = {
      title: topic.title,
      description: topic.description,
      difficulty: topic.difficulty,
      orderIndex: topic.orderIndex,
      estimatedMinutes: topic.estimatedMinutes,
      keyConcepts: content?.keyConcepts.length
        ? (content.keyConcepts as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      learningResources: content?.learningResources.length
        ? (content.learningResources as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    };

    const existingId = existingByTitle.get(topic.title);

    if (existingId) {
      await prisma.topic.update({
        where: { id: existingId },
        data: topicData,
      });
    } else {
      await prisma.topic.create({
        data: {
          ...topicData,
          learningPathId: learningPath.id,
        },
      });
    }
  }
}

async function main() {
  console.log("🌱 Seeding learning paths, topics, and topic content...");

  const topicContentMap = await loadTopicContentMap();

  for (const learningPath of learningPaths) {
    await seedTopicsForPath(learningPath, topicContentMap);
  }

  const topicCount = await prisma.topic.count();
  console.log(
    `✅ Seeded ${topicCount} topics across ${learningPaths.length} learning paths.`
  );
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
