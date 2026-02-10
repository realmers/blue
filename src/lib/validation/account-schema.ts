import { z } from "zod";

/**
 * Schema for validating a competence profile entry.
 * @property competence_id - The ID of the competence from the database
 * @property years_of_experience - Years of experience (0-99.99)
 */
export const competenceProfileSchema = z.object({
  competence_id: z.number(),
  years_of_experience: z.number().min(0).max(99.99),
});

/**
 * Schema for validating an availability period.
 * @property from_date - Start date as ISO string
 * @property to_date - End date as ISO string
 */
export const availabilitySchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
});

/**
 * Schema for validating account creation input.
 * Used by both client-side and server-side validation.
 * @property username - Username (3-50 characters)
 * @property password - Password (8-64 characters)
 * @property email - Valid email address
 * @property name - First name (required, max 255 characters)
 * @property surname - Last name (required, max 255 characters)
 * @property pnr - Swedish personal number (exactly 12 digits)
 * @property competenceProfiles - Optional array of competence profiles
 * @property availabilityPeriods - Optional array of availability periods
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
    .string()
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

/**
 * TypeScript type inferred from createAccountSchema.
 * This type is used for function parameters and return types.
 */
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

/** Inferred type for a competence profile entry. */
export type CompetenceProfile = z.infer<typeof competenceProfileSchema>;

/** Inferred type for an availability period. */
export type AvailabilityPeriod = z.infer<typeof availabilitySchema>;
