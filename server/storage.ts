import { 
  type User, 
  type InsertUser,
  type Calculation,
  type InsertCalculation,
  type ProRata,
  type InsertProRata,
  type ChatMessage,
  type InsertChatMessage,
  type Document,
  type InsertDocument,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Calculation methods
  getCalculations(): Promise<Calculation[]>;
  getCalculation(id: string): Promise<Calculation | undefined>;
  createCalculation(calc: InsertCalculation): Promise<Calculation>;

  // Pro-Rata methods
  getProRataCalculations(): Promise<ProRata[]>;
  getProRataCalculation(id: string): Promise<ProRata | undefined>;
  createProRataCalculation(proRata: InsertProRata): Promise<ProRata>;

  // Chat Message methods
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Document methods
  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  searchDocuments(query: string): Promise<Document[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private calculations: Map<string, Calculation>;
  private proRataCalculations: Map<string, ProRata>;
  private chatMessages: ChatMessage[];
  private documents: Map<string, Document>;

  constructor() {
    this.users = new Map();
    this.calculations = new Map();
    this.proRataCalculations = new Map();
    this.chatMessages = [];
    this.documents = new Map();

    // Seed some initial documents
    this.seedDocuments();
  }

  private seedDocuments() {
    const docs: Document[] = [
      {
        id: randomUUID(),
        title: "Getting Started with Calculator",
        description: "Learn how to perform complex calculations with our advanced calculator tool",
        content: "This guide will help you understand how to use the calculator...",
        category: "Calculator",
        tags: ["beginner", "calculator", "tutorial"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Pro-Rata Calculations Guide",
        description: "Understand pro-rata calculations and how to use them effectively",
        content: "Pro-rata calculations are essential for...",
        category: "Pro-Rata",
        tags: ["pro-rata", "guide", "calculations"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Using the AI Assistant",
        description: "Get the most out of our intelligent assistant for all your queries",
        content: "The AI Assistant can help you with...",
        category: "Assistant",
        tags: ["assistant", "ai", "help"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    docs.forEach(doc => this.documents.set(doc.id, doc));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Calculation methods
  async getCalculations(): Promise<Calculation[]> {
    return Array.from(this.calculations.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCalculation(id: string): Promise<Calculation | undefined> {
    return this.calculations.get(id);
  }

  async createCalculation(insertCalc: InsertCalculation): Promise<Calculation> {
    const id = randomUUID();
    const calculation: Calculation = {
      ...insertCalc,
      input2: insertCalc.input2 ?? null,
      input3: insertCalc.input3 ?? null,
      id,
      createdAt: new Date(),
    };
    this.calculations.set(id, calculation);
    return calculation;
  }

  // Pro-Rata methods
  async getProRataCalculations(): Promise<ProRata[]> {
    return Array.from(this.proRataCalculations.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProRataCalculation(id: string): Promise<ProRata | undefined> {
    return this.proRataCalculations.get(id);
  }

  async createProRataCalculation(insertProRata: InsertProRata): Promise<ProRata> {
    const id = randomUUID();
    const proRataAmount = (insertProRata.totalAmount / insertProRata.totalDays) * insertProRata.daysUsed;
    const proRata: ProRata = {
      ...insertProRata,
      description: insertProRata.description ?? null,
      id,
      proRataAmount,
      createdAt: new Date(),
    };
    this.proRataCalculations.set(id, proRata);
    return proRata;
  }

  // Chat Message methods
  async getChatMessages(): Promise<ChatMessage[]> {
    return [...this.chatMessages];
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const message: ChatMessage = {
      ...insertMessage,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.chatMessages.push(message);
    return message;
  }

  // Document methods
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.documents.values()).filter(doc =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.description.toLowerCase().includes(lowerQuery) ||
      doc.category.toLowerCase().includes(lowerQuery) ||
      doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

export const storage = new MemStorage();
