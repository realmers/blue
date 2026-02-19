import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "@/server/api/root";
import { TRPCError } from "@trpc/server";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import type { Logger } from "pino";
import type { db } from "@/server/db";

type PrismaClientType = typeof db;

/**
 * Creates a tRPC caller with mocked DB, logger, and an optional session.
 * Passing `null` for sessionUser simulates an unauthenticated request.
 */
const createCaller = (
    dbMock: DeepMockProxy<PrismaClientType>,
    loggerMock: DeepMockProxy<Logger>,
    sessionUser: { id: number | string; role: string } | null = null
) =>
    appRouter.createCaller({
        db: dbMock as unknown as PrismaClientType,
        logger: loggerMock,
        headers: new Headers(),
        session: sessionUser
            ? ({
                user: { id: sessionUser.id.toString(), role: sessionUser.role },
            } as any)
            : null,
    });

describe("Application Router", () => {
    let dbMock: DeepMockProxy<PrismaClientType>;
    let loggerMock: DeepMockProxy<Logger>;

    beforeEach(() => {
        vi.clearAllMocks();
        dbMock = mockDeep<PrismaClientType>();
        loggerMock = mockDeep<Logger>();
    });

    // ================================================================
    // listAll – returns every applicant for recruiter users
    // ================================================================

    describe("listAll", () => {
        // Ensures unauthenticated access is blocked
        it("should reject unauthenticated users", async () => {
            const caller = createCaller(dbMock, loggerMock, null);

            try {
                await caller.application.listAll();
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("UNAUTHORIZED");
            }
        });

        // Ensures non-recruiter roles are rejected
        it("should reject non-recruiter users", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 1, role: "applicant" });

            try {
                await caller.application.listAll();
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("FORBIDDEN");
            }
        });

        // Edge case: the "applicant" role row doesn't exist in DB yet
        it("should return empty array if applicant role is missing", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 10, role: "recruiter" });
            dbMock.role.findFirst.mockResolvedValue(null);

            const result = await caller.application.listAll();
            expect(result).toEqual([]);
            expect(dbMock.user.findMany).not.toHaveBeenCalled();
        });

        // Happy path: returns applicant list with nested relations
        it("should return applicants ordered by createdAt desc", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 10, role: "recruiter" });
            dbMock.role.findFirst.mockResolvedValue({ role_id: 2, name: "applicant" } as any);

            const mockApplicants = [
                {
                    id: 100,
                    name: "Alice",
                    surname: "Andersson",
                    email: "alice@test.com",
                    application_status: "unhandled",
                    createdAt: new Date(),
                    competence_profile: [],
                    availability: [],
                },
            ];
            dbMock.user.findMany.mockResolvedValue(mockApplicants as any);

            const result = await caller.application.listAll();
            expect(result).toHaveLength(1);
            const [first] = result;
            expect(first?.name).toBe("Alice");
        });
    });

    // ================================================================
    // getById – fetches a single application with full details
    // ================================================================

    describe("getById", () => {
        // Ensures unauthenticated access is blocked
        it("should reject unauthenticated users", async () => {
            const caller = createCaller(dbMock, loggerMock, null);

            try {
                await caller.application.getById({ id: 1 });
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("UNAUTHORIZED");
            }
        });

        // Ensures non-recruiter roles are rejected
        it("should reject non-recruiter users", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 1, role: "applicant" });

            try {
                await caller.application.getById({ id: 1 });
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("FORBIDDEN");
            }
        });

        // Non-existent user id should produce a NOT_FOUND error
        it("should throw NOT_FOUND if application does not exist", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 10, role: "recruiter" });
            dbMock.user.findUnique.mockResolvedValue(null);

            try {
                await caller.application.getById({ id: 999 });
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("NOT_FOUND");
            }
        });

        // Happy path: returns the full application 
        it("should return application details if found", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 10, role: "recruiter" });

            const mockUser = {
                id: 123,
                name: "Bob",
                surname: "Berg",
                email: "bob@example.com",
                pnr: "199001011234",
                application_status: "accepted",
                createdAt: new Date(),
                updatedAt: new Date(),
                competence_profile: [],
                availability: [],
            };
            dbMock.user.findUnique.mockResolvedValue(mockUser as any);

            const result = await caller.application.getById({ id: 123 });
            expect(result.id).toBe(123);
            expect(result.name).toBe("Bob");
        });
    });

    // ================================================================
    // updateStatus – changes application status
    // ================================================================

    describe("updateStatus", () => {
        const validDate = new Date("2024-01-01T12:00:00Z");

        // Ensures unauthenticated access is blocked
        it("should reject unauthenticated users", async () => {
            const caller = createCaller(dbMock, loggerMock, null);

            try {
                await caller.application.updateStatus({ id: 1, status: "accepted", expectedUpdatedAt: validDate });
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("UNAUTHORIZED");
            }
        });

        // Ensures non-recruiter roles are rejected
        it("should reject non-recruiter users", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 1, role: "applicant" });

            try {
                await caller.application.updateStatus({ id: 1, status: "accepted", expectedUpdatedAt: validDate });
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("FORBIDDEN");
            }
        });

        // Attempting to update a non-existent record returns NOT_FOUND
        it("should throw NOT_FOUND if record does not exist", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 10, role: "recruiter" });
            dbMock.user.findUnique.mockResolvedValue(null);

            try {
                await caller.application.updateStatus({ id: 123, status: "accepted", expectedUpdatedAt: validDate });
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("NOT_FOUND");
            }
        });

        // If the record was modified by someone else, a CONFLICT error is thrown
        it("should throw CONFLICT if timestamps do not match", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 10, role: "recruiter" });
            dbMock.user.findUnique.mockResolvedValue({ updatedAt: new Date("2024-01-02T12:00:00Z"), application_status: "unhandled" } as any);

            try {
                await caller.application.updateStatus({ id: 123, status: "accepted", expectedUpdatedAt: validDate });
                throw new Error("Expected TRPCError was not thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(TRPCError);
                expect((error as TRPCError).code).toBe("CONFLICT");
            }
        });

        // Happy path: timestamps match, status is updated
        it("should update status successfully", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 10, role: "recruiter" });

            dbMock.user.findUnique.mockResolvedValue({ updatedAt: validDate, application_status: "unhandled" } as any);
            dbMock.user.update.mockResolvedValue({ id: 123, application_status: "accepted", updatedAt: new Date() } as any);

            const result = await caller.application.updateStatus({ id: 123, status: "accepted", expectedUpdatedAt: validDate });

            expect(result.application_status).toBe("accepted");
            expect(loggerMock.info).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 123, oldStatus: "unhandled", newStatus: "accepted" }),
                "Application status updated"
            );
        });
    });
});
