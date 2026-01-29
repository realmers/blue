import 'dotenv/config';
import { db } from '@/server/db';
import { hash } from 'argon2';

// --- Types matching your legacy tables ---
type LegacyPerson = {
  person_id: number;
  name: string | null;
  surname: string | null;
  pnr: string | null;
  email: string | null;
  password: string | null;
  role_id: number | null;
  username: string | null;
};

type LegacyRole = { role_id: number; name: string };
type LegacyCompetence = { competence_id: number; name: string };
type LegacyAvail = { availability_id: number; person_id: number; from_date: Date; to_date: Date };
type LegacyCompProfile = { competence_profile_id: number; person_id: number; competence_id: number; years_of_experience: number };

// Helper to clean database "NULL" strings
const cleanString = (str: string | null) => {
  if (!str || str === 'NULL' || str.trim() === '') return null;
  return str.trim();
};

async function main() {

  // 1. MIGRATE ROLES
  const legacyRoles = await db.$queryRaw<LegacyRole[]>`SELECT * FROM legacy_role`;
  if (legacyRoles.length > 0) {
    await db.role.createMany({
      data: legacyRoles.map(r => ({
        role_id: r.role_id,
        name: cleanString(r.name)
      })),
      skipDuplicates: true
    });
  }

  // 2. MIGRATE COMPETENCE
  const legacyComps = await db.$queryRaw<LegacyCompetence[]>`SELECT * FROM legacy_competence`;
  if (legacyComps.length > 0) {
    await db.competence.createMany({
      data: legacyComps.map(c => ({
        competence_id: c.competence_id,
        name: cleanString(c.name)
      })),
      skipDuplicates: true
    });
  }

  // 3. MIGRATE PEOPLE -> USERS & ACCOUNTS
  const legacyPeople = await db.$queryRaw<LegacyPerson[]>`SELECT * FROM legacy_person`;

  let accountCount = 0;

  for (const p of legacyPeople) {
    const rawUsername = cleanString(p.username);
    const email = cleanString(p.email) ? p.email!.toLowerCase().trim() : null;

    // LOGIC: Username must be lowercase for auth, but we keep original for display
    let usernameLower = null;
    let displayUsername = null;

    if (rawUsername) {
      usernameLower = rawUsername.toLowerCase();
      displayUsername = rawUsername;
    } else {
      // Fallback if legacy has no username at all
      usernameLower = `user${p.person_id}`;
      displayUsername = `User${p.person_id}`;
    }

    // Create User
    await db.user.create({
      data: {
        id: p.person_id,
        name: cleanString(p.name) || "Unknown",
        surname: cleanString(p.surname),
        pnr: cleanString(p.pnr),

        email: email, // Keeps NULL if legacy was NULL

        username: usernameLower,       // e.g. "joellewilkinson"
        displayUsername: displayUsername, // e.g. "JoelleWilkinson"

        role_id: p.role_id,
        emailVerified: true,
      }
    });

    // Create Account (Password)
    const rawPassword = cleanString(p.password);
    if (rawPassword) {
      const hashedPassword = await hash(rawPassword);
      await db.account.create({
        data: {
          userId: p.person_id,
          accountId: p.person_id.toString(),
          providerId: "credential",
          password: hashedPassword,
        }
      });
      accountCount++;
    }
  }

  // 4. MIGRATE AVAILABILITY
  const legacyAvail = await db.$queryRaw<LegacyAvail[]>`SELECT * FROM legacy_availability`;
  // Filter out orphans (availability records pointing to deleted users)
  const validAvail = [];
  for (const a of legacyAvail) {
    // Quick check if user exists (since we just inserted them)
    // In a clean migration, we can assume integrity if legacy was clean, 
    // but legacy data is often dirty.
    const userExists = legacyPeople.find(p => p.person_id === a.person_id);
    if (userExists) {
      validAvail.push({
        availability_id: a.availability_id,
        person_id: a.person_id,
        from_date: a.from_date,
        to_date: a.to_date
      });
    }
  }

  if (validAvail.length > 0) {
    await db.availability.createMany({
      data: validAvail,
      skipDuplicates: true
    });
  }

  // 5. MIGRATE COMPETENCE PROFILES
  const legacyProfiles = await db.$queryRaw<LegacyCompProfile[]>`SELECT * FROM legacy_competence_profile`;
  const validProfiles = [];

  for (const kp of legacyProfiles) {
    const userExists = legacyPeople.find(p => p.person_id === kp.person_id);
    // Also check if competence exists
    const compExists = legacyComps.find(c => c.competence_id === kp.competence_id);

    if (userExists && compExists) {
      validProfiles.push({
        competence_profile_id: kp.competence_profile_id,
        person_id: kp.person_id,
        competence_id: kp.competence_id,
        years_of_experience: kp.years_of_experience
      });
    }
  }

  if (validProfiles.length > 0) {
    await db.competence_profile.createMany({
      data: validProfiles,
      skipDuplicates: true
    });
  }
}

main()
  .then(async () => await db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });