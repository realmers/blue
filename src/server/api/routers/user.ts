import { z } from "zod";
import { hash } from "argon2";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const competenceProfileSchema = z.object({
  competence_id: z.number(),
  years_of_experience: z.number().min(0).max(99.99),
});

const availabilitySchema = z.object({
  from_date: z.string(), // ISO date string
  to_date: z.string(), // ISO date string
});

const createAccountSchema = z.object({
  // Account details
  username: z.string().min(3).max(50),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken").max(64, "Lösenordet får vara max 64 tecken"),
  email: z.string().email(),

  // Personal details
  name: z.string().min(1).max(255),
  surname: z.string().min(1).max(255),
  pnr: z.string().length(12, "Personnumret måste vara exakt 12 siffror").regex(/^\d{12}$/, "Personnumret får endast innehålla siffror"),

  // Competence profiles (array)
  competenceProfiles: z.array(competenceProfileSchema).optional(),

  // Availability periods (array)
  availabilityPeriods: z.array(availabilitySchema).optional(),
});

export const userRouter = createTRPCRouter({
  createAccount: publicProcedure
    .input(createAccountSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        ctx.logger.info({ username: input.username, email: input.email }, "Attempting to create account");
      
      // Check if username already exists
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

        // Check if email already exists
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

        // Check if pnr already exists (use findFirst since pnr is not unique in schema)
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

        // Hash the password
        const hashedPassword = await hash(input.password);

        // Get applicant role (role_id = 2 for applicant)
        const applicantRole = await ctx.db.role.findFirst({
          where: { name: "applicant" },
        });

        // Create the user with all related data in a transaction
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
        // Re-throw TRPCErrors as-is (these are user-friendly)
        if (error instanceof TRPCError) {
          throw error;
        }
        
        // Log the actual error for debugging
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
