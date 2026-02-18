import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "@/server/api/root";
import { TRPCError } from "@trpc/server";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import { type Logger } from "pino";
import type { db } from "@/server/db";
import { hash } from "argon2";

// ----------------------------------------------------------------
// MOCKS
// ----------------------------------------------------------------

vi.mock("argon2", () => ({
    hash: vi.fn().mockResolvedValue("hashed_password_mock"),
}));

type PrismaClientType = typeof db;

const createCaller = (
    dbMock: DeepMockProxy<PrismaClientType>,
    loggerMock: DeepMockProxy<Logger>,
    sessionUser: { id: number | string; role: string } | null = null
) => {
    const session = sessionUser
        ? {
            user: {
                id: sessionUser.id.toString(),
                role: sessionUser.role,
                email: "test@test.com",
            },
        }
        : null;

    return appRouter.createCaller({
        db: dbMock as unknown as PrismaClientType,
        logger: loggerMock,
        headers: new Headers(),
        session: session as any,
    });
};

describe("User Router", () => {
    let dbMock: DeepMockProxy<PrismaClientType>;
    let loggerMock: DeepMockProxy<Logger>;

    beforeEach(() => {
        vi.clearAllMocks();
        dbMock = mockDeep<PrismaClientType>();
        loggerMock = mockDeep<Logger>();

        dbMock.$transaction.mockImplementation(async (callback: any) => callback(dbMock));
    });

    // ----------------------------------------------------------------
    // CREATE ACCOUNT
    // ----------------------------------------------------------------

    describe("createAccount", () => {
        const validInput = {
            username: "newuser",
            password: "password123",
            email: "test@example.com",
            name: "Test",
            surname: "User",
            pnr: "199001011234",
            competenceProfiles: [{ competenceId: 5, yearsOfExperience: 2 }],
            availabilityPeriods: [{ fromDate: "2024-01-01", toDate: "2024-01-31" }],
        };

        it("should throw CONFLICT if username exists", async () => {
            dbMock.user.findUnique.mockResolvedValueOnce({ id: 1 } as any);
            const caller = createCaller(dbMock, loggerMock);

            try {
                await caller.user.createAccount(validInput);
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("CONFLICT");
            }
            expect(loggerMock.warn).toHaveBeenCalled();
        });

        it("should throw CONFLICT if email exists", async () => {
            dbMock.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 } as any);
            const caller = createCaller(dbMock, loggerMock);

            try {
                await caller.user.createAccount(validInput);
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("CONFLICT");
            }
        });

        it("should throw CONFLICT if pnr exists", async () => {
            dbMock.user.findUnique.mockResolvedValue(null);
            dbMock.user.findFirst.mockResolvedValue({ id: 1 } as any);
            const caller = createCaller(dbMock, loggerMock);

            try {
                await caller.user.createAccount(validInput);
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("CONFLICT");
            }
        });

        it("should create account successfully (happy path)", async () => {
            dbMock.user.findUnique.mockResolvedValue(null);
            dbMock.user.findFirst.mockResolvedValue(null);
            dbMock.role.findFirst.mockResolvedValue({ role_id: 2, name: "applicant" } as any);
            dbMock.user.create.mockResolvedValue({ id: 100 } as any);

            const caller = createCaller(dbMock, loggerMock);
            const result = await caller.user.createAccount(validInput);

            expect(result).toEqual({ success: true, userId: 100, message: "Kontot har skapats!" });
            expect(hash).toHaveBeenCalledWith(validInput.password);
            expect(dbMock.account.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ password: "hashed_password_mock" }) })
            );
            expect(loggerMock.info).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 100 }),
                "Account created successfully"
            );
        });

        it("should throw INTERNAL_SERVER_ERROR on unexpected error", async () => {
            dbMock.user.findUnique.mockResolvedValue(null);
            dbMock.user.findFirst.mockResolvedValue(null);
            dbMock.user.create.mockRejectedValue(new Error("DB Crash"));

            const caller = createCaller(dbMock, loggerMock);

            try {
                await caller.user.createAccount(validInput);
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
            }
            expect(loggerMock.error).toHaveBeenCalled();
        });
    });

    // ----------------------------------------------------------------
    // AVAILABILITY
    // ----------------------------------------------------------------

    describe("updateMyAvailability", () => {
        it("should reject unauthenticated user", async () => {
            const caller = createCaller(dbMock, loggerMock, null);
            await expect(caller.user.updateMyAvailability({ periods: [] })).rejects.toBeInstanceOf(TRPCError);
        });

        it("should validate date order", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 1, role: "applicant" });

            try {
                await caller.user.updateMyAvailability({
                    periods: [{ fromDate: "2024-01-05", toDate: "2024-01-01" }],
                });
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("BAD_REQUEST");
            }
        });

        it("should replace availability periods", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: "10", role: "applicant" });

            const result = await caller.user.updateMyAvailability({
                periods: [{ fromDate: "2024-01-01", toDate: "2024-01-31" }],
            });

            expect(dbMock.availability.deleteMany).toHaveBeenCalledWith({ where: { person_id: 10 } });
            expect(dbMock.availability.createMany).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });
    });

    // ----------------------------------------------------------------
    // GET COMPETENCES
    // ----------------------------------------------------------------

    describe("getCompetences", () => {
        it("should return competences sorted by name", async () => {
            dbMock.competence.findMany.mockResolvedValue([{ id: 1, name: "Backend" }, { id: 2, name: "Frontend" }] as any);

            const caller = createCaller(dbMock, loggerMock);
            const result = await caller.user.getCompetences();

            expect(dbMock.competence.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
            expect(result.length).toBe(2);
        });
    });
});
