import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";
import { ApplicationDetail } from "./application-detail";

export default async function ApplicationPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Check that the user has the recruiter role
  const user = session.user;
  let roleName: string | undefined;

  if ("role_id" in user && typeof user.role_id === "number") {
    const role = await db.role.findUnique({
      where: { role_id: user.role_id },
      select: { name: true },
    });
    roleName = role?.name ?? undefined;
  }

  if (roleName !== "recruiter") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ApplicationDetail />
    </div>
  );
}
