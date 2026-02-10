import { hash } from "argon2";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { createAccountSchema } from "@/lib/validation/account-schema";

export const userRouter = createTRPCRouter({
  createAccount: publicProcedure
    .input(createAccountSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        ctx.logger.info({ username: input.username, email: input.email }, "Attempting to create account");
      
        const existingUsername = await ctx.db.user.findUnique({
          where: { username: input.username },
        });

      if (existingUsername) {
        ctx.logger.warn({ username: input.username }, "Signup attempt with existing username");
        throw new TRPCError({
          code: "CONFLICT",
          message: "Användarnamnet är redan taget",
        });
      }

        const existingEmail = await ctx.db.user.findUnique({
          where: { email: input.email },
        });

        if (existingEmail) {
          ctx.logger.warn({ email: input.email }, "Signup attempt with existing email");
        throw new TRPCError({
            code: "CONFLICT",
            message: "E-postadressen är redan registrerad",
          });
        }

        const existingPnr = await ctx.db.user.findFirst({
          where: { pnr: input.pnr },
        });

        if (existingPnr) {
          ctx.logger.warn({ pnr: input.pnr }, "Signup attempt with existing pnr");
          throw new TRPCError({
            code: "CONFLICT",
            message: "Personnumret är redan registrerat",
          });
        }

        const hashedPassword = await hash(input.password);

        const applicantRole = await ctx.db.role.findFirst({
          where: { name: "applicant" },
        });

        const user = await ctx.db.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              username: input.username,
              displayUsername: input.username,
              email: input.email,
              name: input.name,
              surname: input.surname,
              pnr: input.pnr,
              role_id: applicantRole?.role_id ?? null,
            },
          });

          // Create the account (for better-auth credential login)
          await tx.account.create({
            data: {
              accountId: newUser.id.toString(),
              providerId: "credential",
              userId: newUser.id,
              password: hashedPassword,
            },
          });

          // Create competence profiles
          if (input.competenceProfiles && input.competenceProfiles.length > 0) {
            await tx.competence_profile.createMany({
              data: input.competenceProfiles.map((cp) => ({
                person_id: newUser.id,
                competence_id: cp.competence_id,
                years_of_experience: cp.years_of_experience,
              })),
            });
          }

          // Create availability periods
          if (input.availabilityPeriods && input.availabilityPeriods.length > 0) {
            await tx.availability.createMany({
              data: input.availabilityPeriods.map((ap) => ({
                person_id: newUser.id,
                from_date: new Date(ap.from_date),
                to_date: new Date(ap.to_date),
              })),
            });
          }

        return newUser;
      });

      ctx.logger.info({ userId: user.id }, "Account created successfully");
        return {
          success: true,
          userId: user.id,
          message: "Kontot har skapats!",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        ctx.logger.error({ error, username: input.username, email: input.email }, "Account creation failed");
        
        // Return a generic user-friendly error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Ett fel uppstod vid skapandet av kontot. Försök igen senare.",
        });
      }
    }),

  // Get all competences for the dropdown
  getCompetences: publicProcedure.query(async ({ ctx }) => {
    const competences = await ctx.db.competence.findMany({
      orderBy: { name: "asc" },
    });
    return competences;
  }),
});
