import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApplicationsTable } from "./applications-table";

export default async function ApplicationsPage() {
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ansökningar</CardTitle>
          <CardDescription>
            Alla inkomna ansökningar. Varje rad visar den sökandes fullständiga
            namn och ansökans status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationsTable />
        </CardContent>
      </Card>
    </div>
  );
}
