"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  unhandled: "Obehandlad",
  accepted: "Godkänd",
  rejected: "Avvisad",
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  unhandled: "outline",
  accepted: "default",
  rejected: "destructive",
};

export function ApplicationsTable() {
  const router = useRouter();
  const {
    data: applications,
    isLoading,
    error,
  } = api.application.listAll.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">Laddar ansökningar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-red-600">
          Kunde inte ladda ansökningar: {error.message}
        </p>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">
          Inga ansökningar hittades.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Namn</TableHead>
          <TableHead>E-post</TableHead>
          <TableHead>Kompetenser</TableHead>
          <TableHead>Tillgänglighet</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ansökningsdatum</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((app) => (
          <TableRow
            key={app.id}
            className="cursor-pointer"
            onClick={() => router.push(`/applications/${app.id}`)}
          >
            <TableCell className="font-medium">
              {app.name} {app.surname ?? ""}
            </TableCell>
            <TableCell>{app.email ?? "—"}</TableCell>
            <TableCell>
              {app.competence_profile.length > 0 ? (
                <ul className="list-none space-y-1">
                  {app.competence_profile.map((cp) => (
                    <li key={cp.competence_profile_id} className="text-sm">
                      {cp.competence?.name ?? "Okänd"}{" "}
                      <span className="text-muted-foreground">
                        ({Number(cp.years_of_experience)} år)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </TableCell>
            <TableCell>
              {app.availability.length > 0 ? (
                <ul className="list-none space-y-1">
                  {app.availability.map((av) => (
                    <li key={av.availability_id} className="text-sm">
                      {av.from_date
                        ? new Date(av.from_date).toLocaleDateString("sv-SE")
                        : "?"}{" "}
                      –{" "}
                      {av.to_date
                        ? new Date(av.to_date).toLocaleDateString("sv-SE")
                        : "?"}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant={statusVariant[app.application_status] ?? "outline"}
              >
                {statusLabels[app.application_status] ?? app.application_status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(app.createdAt).toLocaleDateString("sv-SE")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
