// ============================================================
//  REPOSITORY PATTERN — User Entity (TypeScript)
// ============================================================
//
//  The pattern splits your code into 3 layers, each with ONE job:
//
//    HTTP Request
//        ↓
//    Controller  — handles HTTP: reads req, calls Service, writes res
//        ↓
//    Service     — owns ALL business rules (no mongoose, no express here)
//        ↓
//    Repository  — the ONLY place that touches the database
//        ↑
//    Database (MongoDB / Postgres / in-memory — swappable)
//
//  The critical rule:
//    Service NEVER imports mongoose or any DB driver.
//    It only calls the Repository through an interface.
//    That means you can swap MongoDB for Postgres by writing a new
//    Repository class — Service and Controller never change.
// ============================================================


// ============================================================
//  SECTION 1 — TYPES
//  Define the shape of your data independently of any database.
//  These are plain TypeScript objects, no mongoose magic here.
// ============================================================

// What a User looks like inside your application
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "student" | "teacher" | "admin";
  createdAt: Date;
}

// What you need to create a new user (id and createdAt are generated, not passed in)
type CreateUserDTO = Omit<User, "id" | "createdAt">;

// What the caller gets back — password hash is NEVER exposed outside the repository
type PublicUser = Omit<User, "passwordHash">;


// ============================================================
//  SECTION 2 — REPOSITORY INTERFACE
//
//  This is a CONTRACT. It says: "whatever database you use,
//  it must be able to do these operations."
//
//  The Service will depend on this interface, NOT on any
//  concrete class. This is called "programming to an interface."
// ============================================================

interface IUserRepository {
  // Find a single user by their unique ID
  findById(id: string): Promise<User | null>;

  // Find a user by email — used during login to look up who is signing in
  findByEmail(email: string): Promise<User | null>;

  // Persist a new user to the database and return the saved result
  create(data: CreateUserDTO): Promise<User>;

  // Update specific fields on an existing user (Partial = not all fields required)
  update(id: string, data: Partial<User>): Promise<User | null>;

  // Soft delete — marks as deleted rather than removing from DB
  // This preserves history (payments, enrollments still reference the user)
  delete(id: string): Promise<boolean>;
}


// ============================================================
//  SECTION 3A — IN-MEMORY REPOSITORY (for testing / local dev)
//
//  Uses a plain JavaScript Map as the "database."
//  No connection string, no setup. Useful in unit tests so
//  you don't need a real database running to test business logic.
// ============================================================

class InMemoryUserRepository implements IUserRepository {
  // This Map acts as our fake database table
  private store = new Map<string, User>();
  private nextId = 1;

  async findById(id: string): Promise<User | null> {
    // Map.get returns undefined if not found, so we convert to null
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    // Scan all records — fine for tests, would be too slow in production
    for (const user of this.store.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const user: User = {
      ...data,
      id: String(this.nextId++), // auto-increment fake ID
      createdAt: new Date(),
    };
    this.store.set(user.id, user);
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const existing = this.store.get(id);
    if (!existing) return null;

    // Merge the existing record with the incoming partial update
    const updated = { ...existing, ...data };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id); // returns true if it existed, false if not
  }
}


// ============================================================
//  SECTION 3B — MONGODB REPOSITORY (production)
//
//  This is what you'd use in a real app with Mongoose.
//  It implements the SAME interface as InMemoryUserRepository.
//  The Service cannot tell which one it is talking to.
// ============================================================

// Simulating a Mongoose model shape so this file stays self-contained
// In a real project this would be: import UserModel from "../models/user.model"
interface MongoUserDocument {
  _id: { toString(): string };
  name: string;
  email: string;
  passwordHash: string;
  role: "student" | "teacher" | "admin";
  createdAt: Date;
  save(): Promise<MongoUserDocument>;
}
declare const UserModel: {
  findById(id: string): Promise<MongoUserDocument | null>;
  findOne(query: object): Promise<MongoUserDocument | null>;
  create(data: object): Promise<MongoUserDocument>;
  findByIdAndUpdate(id: string, data: object, opts: object): Promise<MongoUserDocument | null>;
  findByIdAndDelete(id: string): Promise<MongoUserDocument | null>;
};

class MongoUserRepository implements IUserRepository {

  // Convert a raw Mongoose document to our clean User interface.
  // The rest of the app never sees "_id" or Mongoose internals.
  private toUser(doc: MongoUserDocument): User {
    return {
      id: doc._id.toString(), // MongoDB uses _id, we expose it as id
      name: doc.name,
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role,
      createdAt: doc.createdAt,
    };
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id);
    return doc ? this.toUser(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    // MongoDB will use an index on email if one exists — fast lookup
    const doc = await UserModel.findOne({ email });
    return doc ? this.toUser(doc) : null;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const doc = await UserModel.create(data);
    return this.toUser(doc);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    // { new: true } returns the document AFTER the update, not before
    const doc = await UserModel.findByIdAndUpdate(id, data, { new: true });
    return doc ? this.toUser(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const doc = await UserModel.findByIdAndDelete(id);
    return doc !== null;
  }
}


// ============================================================
//  SECTION 4 — SERVICE
//
//  This is where business rules live. Examples:
//    - "You cannot register with an email that already exists"
//    - "Only a student role can be created via self-registration"
//    - "Passwords must be at least 6 characters"
//
//  Notice: no mongoose, no req, no res. This class does not
//  know it is running inside Express. That makes it easy to
//  test and easy to reuse (e.g. CLI scripts, background jobs).
// ============================================================

// Simulating bcrypt so this file stays self-contained
declare const bcrypt: {
  hash(password: string, rounds: number): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
};

class UserService {
  // The service receives the repository through its constructor.
  // This is called "Dependency Injection" — the service does NOT
  // create its own repository. The caller decides which one to provide.
  // In tests you pass InMemoryUserRepository.
  // In production you pass MongoUserRepository.
  constructor(private readonly userRepo: IUserRepository) {}

  // ── Register a new user ─────────────────────────────────────
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<PublicUser> {

    // Business rule: email must be unique
    const existing = await this.userRepo.findByEmail(email.toLowerCase());
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    // Business rule: minimum password length
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    // Hash the password BEFORE storing — never store plain text
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userRepo.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "student", // Business rule: self-registered users are always students
    });

    // Strip the password hash before returning — callers never need it
    return this.toPublic(user);
  }

  // ── Login ───────────────────────────────────────────────────
  async login(email: string, password: string): Promise<PublicUser> {
    const user = await this.userRepo.findByEmail(email.toLowerCase());

    // Business rule: always compare a hash even if user not found.
    // This prevents timing attacks that could reveal which emails exist.
    const DUMMY_HASH = "$2b$10$invalidhashusedfortimingonly";
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const passwordOk = await bcrypt.compare(password, hashToCompare);

    // Reject if user not found OR password wrong — same message for both
    // so attackers cannot tell which one failed (user enumeration prevention)
    if (!user || !passwordOk) {
      throw new Error("Invalid email or password.");
    }

    return this.toPublic(user);
  }

  // ── Get a single user by ID ─────────────────────────────────
  async getById(id: string): Promise<PublicUser> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new Error("User not found.");
    return this.toPublic(user);
  }

  // ── Update profile ──────────────────────────────────────────
  async updateProfile(
    requesterId: string,  // who is making the request
    targetId: string,     // whose profile is being changed
    data: { name?: string }
  ): Promise<PublicUser> {

    // Business rule: users can only update their own profile
    if (requesterId !== targetId) {
      throw new Error("You can only update your own profile.");
    }

    const updates: Partial<User> = {};
    if (data.name) updates.name = data.name.trim();

    const updated = await this.userRepo.update(targetId, updates);
    if (!updated) throw new Error("User not found.");

    return this.toPublic(updated);
  }

  // Internal helper — removes passwordHash before returning to callers
  private toPublic(user: User): PublicUser {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}


// ============================================================
//  SECTION 5 — CONTROLLER
//
//  The only layer that knows about Express (req, res).
//  It has NO business logic — it just:
//    1. Reads input from req
//    2. Calls the Service
//    3. Writes the result to res
//
//  If the Service throws, it maps the error to an HTTP status.
// ============================================================

// Simulating Express types so this file stays self-contained
interface Request { body: any; params: any; user?: { id: string } }
interface Response {
  status(code: number): Response;
  json(data: any): void;
}

class UserController {
  // Same dependency injection as the Service — controller receives
  // the service it needs rather than creating it.
  constructor(private readonly userService: UserService) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const user = await this.userService.register(name, email, password);
      res.status(201).json({ message: "Account created.", user });
    } catch (err: any) {
      // Map known business errors to 400 Bad Request
      res.status(400).json({ message: err.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await this.userService.login(email, password);
      res.status(200).json({ message: "Login successful.", user });
    } catch (err: any) {
      // 401 Unauthorized — credentials were wrong
      res.status(401).json({ message: err.message });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.getById(req.params.id);
      res.status(200).json({ user });
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      // req.user.id comes from auth middleware — the logged-in user
      const requesterId = req.user!.id;
      const targetId = req.params.id;
      const user = await this.userService.updateProfile(requesterId, targetId, req.body);
      res.status(200).json({ message: "Profile updated.", user });
    } catch (err: any) {
      // 403 if trying to edit someone else, 404 if not found
      const status = err.message.includes("own profile") ? 403 : 400;
      res.status(status).json({ message: err.message });
    }
  }
}


// ============================================================
//  SECTION 6 — WIRING IT TOGETHER (Composition Root)
//
//  This is the only place where you decide WHICH implementation
//  to use. Everything above this point has no idea whether it
//  is running against MongoDB or an in-memory store.
// ============================================================

// --- PRODUCTION ---
const mongoRepo    = new MongoUserRepository();
const userService  = new UserService(mongoRepo);
const userCtrl     = new UserController(userService);

// --- TESTING (swap one line, everything else stays identical) ---
const inMemoryRepo    = new InMemoryUserRepository();
const testUserService = new UserService(inMemoryRepo);   // same Service class
const testUserCtrl    = new UserController(testUserService); // same Controller class

// ============================================================
//  SUMMARY — What each layer is allowed to know
//
//  Repository  → knows about the database (mongoose/postgres/etc.)
//                does NOT know about business rules or HTTP
//
//  Service     → knows about business rules
//                does NOT know about the database or HTTP
//
//  Controller  → knows about HTTP (req, res, status codes)
//                does NOT know about the database or business rules
//
//  Each layer depends only on the one below it, through an interface.
//  Swap the implementation, nothing breaks.
// ============================================================
