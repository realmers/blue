/**
 * Enhetstester för Zod-validering.
 *
 * Säkerställer att regler för användarnamn,
 * lösenord och e-post fungerar som tänkt,
 * och att ogiltiga data fångas upp innan de når servern.
 *
 * Tillhör Logic Layer.
 */

import { describe, it, expect } from "vitest";
import {
  createAccountSchema,
  loginUsernameSchema,
  loginMagicLinkSchema,
  competenceProfileSchema,
  availabilitySchema,
} from "./account-schema";

describe("Validation: createAccountSchema", () => {
  // Testar att schemat avvisar användarnamn som är för kort (under 3 tecken).
  it("borde misslyckas misslyckas om användarnamn är för ogiltigt", () => {
    const result = createAccountSchema.safeParse({
      username: "yo", // För kort användarnamn input
      password: "validpassword123",
      email: "test@example.com",
      name: "Test",
      surname: "Testsson",
      pnr: "199001011234",
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar lösenord som är för kort (under 8 tecken).
  it("borde misslyckas om lösenord är för ogiltigt", () => {
    const result = createAccountSchema.safeParse({
      username: "vaildUser",
      password: "123", // För kort lösenord input
      email: "test@example.com",
      name: "Test",
      surname: "Testsson",
      pnr: "199001011234",
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar e-post utan @-tecken.
  it("borde misslyckas om email är ogiltigt", () => {
    const result = createAccountSchema.safeParse({
      username: "vaildUser",
      password: "validpassword123",
      email: "testexample.com", // Oglitig mejl.
      name: "Test",
      surname: "Testsson",
      pnr: "199001011234",
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar tomt förnamn (min 1 tecken krävs).
  it("borde misslyckas om förnamn är ogiltigt", () => {
    const result = createAccountSchema.safeParse({
      username: "vaildUser",
      password: "validpassword123",
      email: "test@example.com",
      name: "", // Oglitigt namn (tomt).
      surname: "Testsson",
      pnr: "199001011234",
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar tomt efternamn (min 1 tecken krävs).
  it("borde misslyckas om efternamn är ogiltigt", () => {
    const result = createAccountSchema.safeParse({
      username: "vaildUser",
      password: "validpassword123",
      email: "test@example.com",
      name: "Test",
      surname: "", // Oglitigt efternamn (tomt).
      pnr: "199001011234",
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar personnummer som inte är exakt 12 siffror.
  it("borde misslyckas om personnummer är ogiltigt", () => {
    const result = createAccountSchema.safeParse({
      username: "vaildUser",
      password: "validpassword123",
      email: "test@example.com",
      name: "Test",
      surname: "Testsson",
      pnr: "676767", // Oglitigt personnummer.
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat godkänner ett komplett giltigt objekt.
  it("borde lyckas med adekvat input", () => {
    const result = createAccountSchema.safeParse({
      username: "validUser",
      password: "validpassword123",
      email: "test@example.com",
      name: "Test",
      surname: "Testsson",
      pnr: "199001011234",
    });
    expect(result.success).toBe(true);
  });
});

describe("Validation: loginUsernameSchema", () => {
  // Testar att schemat godkänner giltigt användarnamn och lösenord.
  it("borde lyckas med giltig input", () => {
    const result = loginUsernameSchema.safeParse({
      username: "validUser",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  // Testar att schemat avvisar användarnamn under minlängd (3 tecken).
  it("borde misslyckas om användarnamn är för kort", () => {
    const result = loginUsernameSchema.safeParse({
      username: "ab",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar lösenord under minlängd (8 tecken).
  it("borde misslyckas om lösenord är för kort", () => {
    const result = loginUsernameSchema.safeParse({
      username: "validUser",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar användarnamn över maxlängd (50 tecken).
  it("borde misslyckas om användarnamn är för långt", () => {
    const result = loginUsernameSchema.safeParse({
      username: "a".repeat(51),
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar lösenord över maxlängd (64 tecken).
  it("borde misslyckas om lösenord är för långt", () => {
    const result = loginUsernameSchema.safeParse({
      username: "validUser",
      password: "a".repeat(65),
    });
    expect(result.success).toBe(false);
  });
});

describe("Validation: loginMagicLinkSchema", () => {
  // Testar att schemat godkänner en korrekt e-postadress.
  it("borde lyckas med giltig e-post", () => {
    const result = loginMagicLinkSchema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  // Testar att schemat avvisar en sträng som inte är en e-postadress.
  it("borde misslyckas med ogiltig e-post", () => {
    const result = loginMagicLinkSchema.safeParse({
      email: "inte-en-email",
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar e-post som saknar @-tecken.
  it("borde misslyckas utan @-tecken", () => {
    const result = loginMagicLinkSchema.safeParse({
      email: "testexample.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("Validation: competenceProfileSchema", () => {
  // Testar att schemat godkänner giltigt competenceId och erfarenhet.
  it("borde lyckas med giltig kompetensdata", () => {
    const result = competenceProfileSchema.safeParse({
      competenceId: 1,
      yearsOfExperience: 5,
    });
    expect(result.success).toBe(true);
  });

  // Testar att schemat avvisar negativt värde på erfarenhet (min 0).
  it("borde misslyckas om erfarenhet är negativ", () => {
    const result = competenceProfileSchema.safeParse({
      competenceId: 1,
      yearsOfExperience: -1,
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar erfarenhet över maxgränsen (99.99).
  it("borde misslyckas om erfarenhet överstiger max", () => {
    const result = competenceProfileSchema.safeParse({
      competenceId: 1,
      yearsOfExperience: 100,
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar competenceId av fel typ (sträng istället för nummer).
  it("borde misslyckas om competenceId inte är ett nummer", () => {
    const result = competenceProfileSchema.safeParse({
      competenceId: "text",
      yearsOfExperience: 5,
    });
    expect(result.success).toBe(false);
  });
});

describe("Validation: availabilitySchema", () => {
  // Testar att schemat godkänner giltiga datumsträngar för fromDate och toDate.
  it("borde lyckas med giltiga datumsträngar", () => {
    const result = availabilitySchema.safeParse({
      fromDate: "2024-01-01",
      toDate: "2024-06-01",
    });
    expect(result.success).toBe(true);
  });

  // Testar att schemat avvisar objekt utan obligatoriskt fromDate-fält.
  it("borde misslyckas om fromDate saknas", () => {
    const result = availabilitySchema.safeParse({
      toDate: "2024-06-01",
    });
    expect(result.success).toBe(false);
  });

  // Testar att schemat avvisar objekt utan obligatoriskt toDate-fält.
  it("borde misslyckas om toDate saknas", () => {
    const result = availabilitySchema.safeParse({
      fromDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });
});
