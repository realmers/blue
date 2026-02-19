import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "@/server/api/root";
import { TRPCError } from "@trpc/server";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import { type Logger } from "pino";
import type { db } from "@/server/db";
import { hash } from "argon2";

// ----------------------------------------------------------------
// Mocks – argon2
// ----------------------------------------------------------------

vi.mock("argon2", () => ({
    hash: vi.fn().mockResolvedValue("hashed_password_mock"),
}));

type PrismaClientType = typeof db;

/**
 * Creates a tRPC caller with mocked DB, logger, and an optional session.
 * Passing `null` for sessionUser simulates an unauthenticated request.
 */
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

        // Make $transaction pass the mock client directly to the callback
        dbMock.$transaction.mockImplementation(async (callback: any) => callback(dbMock));
    });

    // ----------------------------------------------------------------
    // createAccount – public endpoint for new user registration
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

        // Duplicate username must be rejected
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

        // Duplicate email must be rejected
        it("should throw CONFLICT if email exists", async () => {
            // First findUnique (username) returns null, second (email) returns a match
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

        // Duplicate personnummer must be rejected
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

        // Happy path: user, account, competence profiles, and availability are created
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

        // Ensures optional arrays can be omitted without errors
        it("should create account without optional competences and availability", async () => {
            dbMock.user.findUnique.mockResolvedValue(null);
            dbMock.user.findFirst.mockResolvedValue(null);
            dbMock.role.findFirst.mockResolvedValue({ role_id: 2, name: "applicant" } as any);
            dbMock.user.create.mockResolvedValue({ id: 101 } as any);

            const caller = createCaller(dbMock, loggerMock);
            const { competenceProfiles, availabilityPeriods, ...minimalInput } = validInput;
            const result = await caller.user.createAccount(minimalInput);

            expect(result.success).toBe(true);
            expect(dbMock.competence_profile.createMany).not.toHaveBeenCalled();
            expect(dbMock.availability.createMany).not.toHaveBeenCalled();
        });

        // Unexpected DB errors are wrapped in a generic INTERNAL_SERVER_ERROR
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
    // getMyAvailability – returns the logged-in user's periods
    // ----------------------------------------------------------------

    describe("getMyAvailability", () => {
        // Ensures unauthenticated access is blocked
        it("should reject unauthenticated user", async () => {
            const caller = createCaller(dbMock, loggerMock, null);
            await expect(caller.user.getMyAvailability()).rejects.toBeInstanceOf(TRPCError);
        });

        // Happy path: returns availability periods for the current user
        it("should return availability periods for logged-in user", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: "5", role: "applicant" });
            const mockPeriods = [
                { availability_id: 1, person_id: 5, from_date: new Date("2024-01-01"), to_date: new Date("2024-01-31") },
                { availability_id: 2, person_id: 5, from_date: new Date("2024-03-01"), to_date: new Date("2024-03-31") },
            ];
            dbMock.availability.findMany.mockResolvedValue(mockPeriods as any);

            const result = await caller.user.getMyAvailability();

            expect(result).toHaveLength(2);
            expect(dbMock.availability.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { person_id: 5 } })
            );
        });

        // Edge case: user has no availability periods yet
        it("should return empty array when user has no periods", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 7, role: "applicant" });
            dbMock.availability.findMany.mockResolvedValue([]);

            const result = await caller.user.getMyAvailability();
            expect(result).toEqual([]);
        });
    });

    // ----------------------------------------------------------------
    // updateMyAvailability – replaces all periods for the current user
    // ----------------------------------------------------------------

    describe("updateMyAvailability", () => {
        // Ensures unauthenticated access is blocked
        it("should reject unauthenticated user", async () => {
            const caller = createCaller(dbMock, loggerMock, null);
            await expect(caller.user.updateMyAvailability({ periods: [] })).rejects.toBeInstanceOf(TRPCError);
        });

        // fromDate must be before toDate, otherwise BAD_REQUEST
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

        // Happy path: old periods are deleted and new ones created in a transaction
        it("should replace availability periods", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: "10", role: "applicant" });

            const result = await caller.user.updateMyAvailability({
                periods: [{ fromDate: "2024-01-01", toDate: "2024-01-31" }],
            });

            expect(dbMock.availability.deleteMany).toHaveBeenCalledWith({ where: { person_id: 10 } });
            expect(dbMock.availability.createMany).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        // Sending an empty array clears all periods
        it("should clear all periods when given empty array", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 3, role: "applicant" });

            const result = await caller.user.updateMyAvailability({ periods: [] });

            expect(dbMock.availability.deleteMany).toHaveBeenCalledWith({ where: { person_id: 3 } });
            expect(dbMock.availability.createMany).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
        });
    });

    // ----------------------------------------------------------------
    // getCompetences – public list of available competence areas
    // ----------------------------------------------------------------

    describe("getCompetences", () => {
        // Happy path: returns competences 
        it("should return competences sorted by name", async () => {
            dbMock.competence.findMany.mockResolvedValue([{ id: 1, name: "Backend" }, { id: 2, name: "Frontend" }] as any);

            const caller = createCaller(dbMock, loggerMock);
            const result = await caller.user.getCompetences();

            expect(dbMock.competence.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
            expect(result.length).toBe(2);
        });

        // Edge case: no competences exist in the DB
        it("should return empty array when no competences exist", async () => {
            dbMock.competence.findMany.mockResolvedValue([]);

            const caller = createCaller(dbMock, loggerMock);
            const result = await caller.user.getCompetences();

            expect(result).toEqual([]);
        });
    });
});
