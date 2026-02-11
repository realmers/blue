/**
 * Enhetstester för Zod-validering.
 * Säkerställer att regler för användarnamn, lösenord och e-post fungerar som tänkt,
 * och att ogiltiga data fångas upp innan de når servern.
 * Tillhör Logic Layer.
 */

import { describe, it, expect } from 'vitest';
import { createAccountSchema } from './account-schema';

describe('Validation: createAccountSchema', () => {
  it('should fail if username is too short', () => {
    const result = createAccountSchema.safeParse({
      username: 'yo', // För kort input
      password: 'validpassword123',
      email: 'test@example.com',
      name: 'Test',
      surname: 'Testsson',
      pnr: '199001011234'
    });
    expect(result.success).toBe(false);
  });

  it('should pass with valid data', () => {
    const result = createAccountSchema.safeParse({
      username: 'validUser',
      password: 'validpassword123',
      email: 'test@example.com',
      name: 'Test',
      surname: 'Testsson',
      pnr: '199001011234'
    });
    expect(result.success).toBe(true);
  });
});