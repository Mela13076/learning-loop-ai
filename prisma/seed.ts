import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding learning paths and topics...");

  // ------------------------------------------------------------------
  // Path 1: Frontend Fundamentals
  // ------------------------------------------------------------------
  const frontend = await prisma.learningPath.upsert({
    where: { id: "path-frontend" },
    update: {},
    create: {
      id: "path-frontend",
      title: "Frontend Fundamentals",
      description:
        "Build a solid foundation in web development — from HTML structure to React state management. Ideal for beginners who want to build real, interactive websites.",
      level: "BEGINNER",
      topics: {
        create: [
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
    },
  });

  // ------------------------------------------------------------------
  // Path 2: Python Foundations
  // ------------------------------------------------------------------
  const python = await prisma.learningPath.upsert({
    where: { id: "path-python" },
    update: {},
    create: {
      id: "path-python",
      title: "Python Foundations",
      description:
        "Learn Python from the ground up — variables, logic, loops, functions, and data structures. A practical path for beginners building real programming intuition.",
      level: "BEGINNER",
      topics: {
        create: [
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
    },
  });

  // ------------------------------------------------------------------
  // Path 3: Computer Science Fundamentals
  // ------------------------------------------------------------------
  const cs = await prisma.learningPath.upsert({
    where: { id: "path-cs" },
    update: {},
    create: {
      id: "path-cs",
      title: "Computer Science Fundamentals",
      description:
        "Understand the data structures and algorithms behind every software system. Essential preparation for technical interviews and deeper engineering work.",
      level: "INTERMEDIATE",
      topics: {
        create: [
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
    },
  });

  const topicCounts = await prisma.topic.count();
  console.log(
    `✅ Seeded ${topicCounts} topics across 3 learning paths:`,
    `\n   • ${frontend.title}`,
    `\n   • ${python.title}`,
    `\n   • ${cs.title}`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
