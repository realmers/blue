import { z } from "zod";

/**
 * Schema for validating a competence profile entry.
 * Includes competence ID and years of experience.
 */
export const competenceProfileSchema = z.object({
  competenceId: z.number(),
  yearsOfExperience: z.number().min(0).max(99.99),
});

/**
 * Schema for validating an availability period.
 * Includes start and end dates as ISO strings.
 */
export const availabilitySchema = z.object({
  fromDate: z.string(),
  toDate: z.string(),
});

/**
 * Schema for validating account creation input.
 * Used by both client-side and server-side validation.
 * Requires username, password, email, name, surname, and personal number,
 * with optional competence profiles and availability periods.
 */
export const createAccountSchema = z.object({
  username: z
    .string()
    .min(3, "Användarnamnet måste vara minst 3 tecken")
    .max(50, "Användarnamnet får vara max 50 tecken"),
  password: z
    .string()
    .min(8, "Lösenordet måste vara minst 8 tecken")
    .max(64, "Lösenordet får vara max 64 tecken"),
  email: z
    .email("Ange en giltig e-postadress"),
  name: z
    .string()
    .min(1, "Förnamn är obligatoriskt")
    .max(255),
  surname: z
    .string()
    .min(1, "Efternamn är obligatoriskt")
    .max(255),
  pnr: z
    .string()
    .length(12, "Personnumret måste vara exakt 12 siffror")
    .regex(/^\d{12}$/, "Personnumret får endast innehålla siffror"),
  competenceProfiles: z.array(competenceProfileSchema).optional(),
  availabilityPeriods: z.array(availabilitySchema).optional(),
});

/** Schema for validating login with username and password. */
export const loginUsernameSchema = z.object({
  username: z.string().min(3, "Felaktigt användarnamn eller lösenord").max(50, "Felaktigt användarnamn eller lösenord"),
  password: z.string().min(8, "Felaktigt användarnamn eller lösenord").max(64, "Felaktigt användarnamn eller lösenord"),
});

/** Schema for validating login with magic link email. */
export const loginMagicLinkSchema = z.object({
  email: z.email(),
});

/**
 * TypeScript type inferred from createAccountSchema.
 * This type is used for function parameters and return types.
 */
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

/** Inferred type for a competence profile entry. */
export type CompetenceProfile = z.infer<typeof competenceProfileSchema>;

/** Inferred type for an availability period. */
export type AvailabilityPeriod = z.infer<typeof availabilitySchema>;

/** Inferred type for login with username and password. */
export type LoginUsernameInput = z.infer<typeof loginUsernameSchema>;

/** Inferred type for login with magic link (email). */
export type LoginMagicLinkInput = z.infer<typeof loginMagicLinkSchema>;
