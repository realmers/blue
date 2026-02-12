-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('unhandled', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT,
    "surname" TEXT,
    "pnr" TEXT,
    "role_id" INTEGER,
    "displayUsername" TEXT,
    "application_status" "ApplicationStatus" NOT NULL DEFAULT 'unhandled',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "availability_id" SERIAL NOT NULL,
    "person_id" INTEGER,
    "from_date" DATE,
    "to_date" DATE,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("availability_id")
);

-- CreateTable
CREATE TABLE "competence" (
    "competence_id" SERIAL NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "competence_pkey" PRIMARY KEY ("competence_id")
);

-- CreateTable
CREATE TABLE "competence_profile" (
    "competence_profile_id" SERIAL NOT NULL,
    "person_id" INTEGER,
    "competence_id" INTEGER,
    "years_of_experience" DECIMAL(4,2),

    CONSTRAINT "competence_profile_pkey" PRIMARY KEY ("competence_profile_id")
);

-- CreateTable
CREATE TABLE "role" (
    "role_id" SERIAL NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "legacy_availability" (
    "availability_id" SERIAL NOT NULL,
    "person_id" INTEGER,
    "from_date" DATE,
    "to_date" DATE,

    CONSTRAINT "legacy_availability_pkey" PRIMARY KEY ("availability_id")
);

-- CreateTable
CREATE TABLE "legacy_competence" (
    "competence_id" SERIAL NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "legacy_competence_pkey" PRIMARY KEY ("competence_id")
);

-- CreateTable
CREATE TABLE "legacy_competence_profile" (
    "competence_profile_id" SERIAL NOT NULL,
    "person_id" INTEGER,
    "competence_id" INTEGER,
    "years_of_experience" DECIMAL(4,2),

    CONSTRAINT "legacy_competence_profile_pkey" PRIMARY KEY ("competence_profile_id")
);

-- CreateTable
CREATE TABLE "legacy_person" (
    "person_id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "surname" VARCHAR(255),
    "pnr" VARCHAR(255),
    "email" VARCHAR(255),
    "password" VARCHAR(255),
    "role_id" INTEGER,
    "username" VARCHAR(255),

    CONSTRAINT "legacy_person_pkey" PRIMARY KEY ("person_id")
);

-- CreateTable
CREATE TABLE "legacy_role" (
    "role_id" SERIAL NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "legacy_role_pkey" PRIMARY KEY ("role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competence_profile" ADD CONSTRAINT "competence_profile_competence_id_fkey" FOREIGN KEY ("competence_id") REFERENCES "competence"("competence_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "competence_profile" ADD CONSTRAINT "competence_profile_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
