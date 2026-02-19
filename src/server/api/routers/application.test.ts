import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "@/server/api/root";
import { TRPCError } from "@trpc/server";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import type { Logger } from "pino";
import type { db } from "@/server/db";

type PrismaClientType = typeof db;

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
    // listAll
    // ================================================================

    describe("listAll", () => {
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

        it("should return empty array if applicant role is missing", async () => {
            const caller = createCaller(dbMock, loggerMock, { id: 10, role: "recruiter" });
            dbMock.role.findFirst.mockResolvedValue(null);

            const result = await caller.application.listAll();
            expect(result).toEqual([]);
            expect(dbMock.user.findMany).not.toHaveBeenCalled();
        });

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
    // getById
    // ================================================================

    describe("getById", () => {
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
    // updateStatus
    // ================================================================

    describe("updateStatus", () => {
        const validDate = new Date("2024-01-01T12:00:00Z");

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
