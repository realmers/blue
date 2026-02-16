import { createTRPCRouter, recruiterProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const applicationRouter = createTRPCRouter({
    /**
     * List all applications
     * Returns all users with the "applicant" role, including their
     * application status, competence profiles, and availability periods.
     */
    listAll: recruiterProcedure.query(async ({ ctx }) => {
        const applicantRole = await ctx.db.role.findFirst({
            where: { name: "applicant" },
        });

        if (!applicantRole) {
            return [];
        }

        const applicants = await ctx.db.user.findMany({
            where: { role_id: applicantRole.role_id },
            select: {
                id: true,
                name: true,
                surname: true,
                email: true,
                application_status: true,
                createdAt: true,
                competence_profile: {
                    select: {
                        competence_profile_id: true,
                        years_of_experience: true,
                        competence: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                availability: {
                    select: {
                        availability_id: true,
                        from_date: true,
                        to_date: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return applicants;
    }),

    /**
     * Get a single application by user id
     * Returns the full application view including status, competences, and availability.
     * Also returns `updatedAt` for optimistic concurrency control.
     */
    getById: recruiterProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findUnique({
                where: { id: input.id },
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    pnr: true,
                    application_status: true,
                    createdAt: true,
                    updatedAt: true,
                    competence_profile: {
                        select: {
                            competence_profile_id: true,
                            years_of_experience: true,
                            competence: {
                                select: { name: true },
                            },
                        },
                    },
                    availability: {
                        select: {
                            availability_id: true,
                            from_date: true,
                            to_date: true,
                        },
                    },
                },
            });

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Ansökan hittades inte",
                });
            }

            return user;
        }),

    /**
     * Update application status
     * Uses optimistic concurrency control: the client sends the `expectedUpdatedAt`
     * timestamp it last fetched. If another user modified the record in the meantime,
     * the update is aborted and the recruiter is informed.
     */
    updateStatus: recruiterProcedure
        .input(
            z.object({
                id: z.number(),
                status: z.enum(["unhandled", "accepted", "rejected"]),
                expectedUpdatedAt: z.date(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Fetch current record to check for concurrent modification
            const current = await ctx.db.user.findUnique({
                where: { id: input.id },
                select: { updatedAt: true, application_status: true },
            });

            if (!current) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Ansökan hittades inte",
                });
            }

            // Compare timestamps for optimistic concurrency control
            if (current.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message:
                        "Ansökan har ändrats av en annan användare. Ladda om sidan och försök igen.",
                });
            }

            const updated = await ctx.db.user.update({
                where: { id: input.id },
                data: { application_status: input.status },
                select: {
                    id: true,
                    application_status: true,
                    updatedAt: true,
                },
            });

            ctx.logger.info(
                { userId: input.id, oldStatus: current.application_status, newStatus: input.status },
                "Application status updated",
            );

            return updated;
        }),
});
