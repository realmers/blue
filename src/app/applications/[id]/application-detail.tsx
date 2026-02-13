"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon } from "lucide-react";

type UpdatedApplication = RouterOutputs["application"]["updateStatus"];

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

type ApplicationStatus = "unhandled" | "accepted" | "rejected";

export function ApplicationDetail() {
  const params = useParams();
  const router = useRouter();
  const utils = api.useUtils();
  const id = Number(params.id);

  const [conflictError, setConflictError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    data: application,
    isLoading,
    error,
    refetch,
  } = api.application.getById.useQuery(
    { id },
    { enabled: !isNaN(id) },
  );

  const updateStatus = api.application.updateStatus.useMutation({
    onSuccess: (data: UpdatedApplication) => {
      setConflictError(null);
      setSuccessMessage(
        `Status uppdaterad till "${statusLabels[data.application_status] ?? data.application_status}"`,
      );
      void utils.application.listAll.invalidate();
      // Refetch to get the new updatedAt for future concurrency checks
      void refetch();
    },
    onError: (err: { data?: { code?: string } | null; message: string }) => {
      if (err.data?.code === "CONFLICT") {
        setConflictError(err.message);
        setSuccessMessage(null);
      } else {
        setConflictError(null);
        setSuccessMessage(null);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">Laddar ansökan...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-red-600">
          {error?.message ?? "Ansökan hittades inte"}
        </p>
      </div>
    );
  }

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    setConflictError(null);
    setSuccessMessage(null);
    updateStatus.mutate({
      id: application.id,
      status: newStatus,
      expectedUpdatedAt: application.updatedAt,
    });
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/applications")}
        className="gap-2"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Tillbaka till alla ansökningar
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal information */}
        <Card>
          <CardHeader>
            <CardTitle>Personuppgifter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Förnamn" value={application.name} />
            <InfoRow label="Efternamn" value={application.surname ?? "—"} />
            <InfoRow label="E-post" value={application.email ?? "—"} />
            <InfoRow label="Personnummer" value={application.pnr ?? "—"} />
            <InfoRow
              label="Registrerad"
              value={new Date(application.createdAt).toLocaleDateString("sv-SE")}
            />
          </CardContent>
        </Card>

        {/* Status management */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Ändra ansökans status. Ändringen sparas direkt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm">
                Nuvarande status:
              </span>
              <Badge
                variant={
                  statusVariant[application.application_status] ?? "outline"
                }
              >
                {statusLabels[application.application_status] ??
                  application.application_status}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Ändra status</label>
              <Select
                value={application.application_status}
                onValueChange={handleStatusChange}
                disabled={updateStatus.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unhandled">Obehandlad</SelectItem>
                  <SelectItem value="accepted">Godkänd</SelectItem>
                  <SelectItem value="rejected">Avvisad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {updateStatus.isPending && (
              <p className="text-muted-foreground text-sm">Sparar...</p>
            )}

            {successMessage && (
              <p className="text-sm text-green-600">{successMessage}</p>
            )}

            {conflictError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">
                  Uppdateringen avbröts
                </p>
                <p className="text-sm text-red-700">{conflictError}</p>
              </div>
            )}

            {updateStatus.error && !conflictError && (
              <p className="text-sm text-red-600">
                Fel: {updateStatus.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Competence profile */}
      <Card>
        <CardHeader>
          <CardTitle>Kompetenser</CardTitle>
        </CardHeader>
        <CardContent>
          {application.competence_profile.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {application.competence_profile.map((cp) => (
                <div
                  key={cp.competence_profile_id}
                  className="rounded-md border p-3"
                >
                  <p className="font-medium">
                    {cp.competence?.name ?? "Okänd kompetens"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {Number(cp.years_of_experience)} års erfarenhet
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Inga kompetenser angivna.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Tillgänglighet</CardTitle>
        </CardHeader>
        <CardContent>
          {application.availability.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {application.availability.map((av) => (
                <div
                  key={av.availability_id}
                  className="rounded-md border p-3"
                >
                  <p className="text-sm">
                    {av.from_date
                      ? new Date(av.from_date).toLocaleDateString("sv-SE")
                      : "?"}{" "}
                    –{" "}
                    {av.to_date
                      ? new Date(av.to_date).toLocaleDateString("sv-SE")
                      : "?"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Inga tillgänglighetsperioder angivna.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
