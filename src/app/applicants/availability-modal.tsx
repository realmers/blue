"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AvailabilityPeriod {
  fromDate: string;
  toDate: string;
}

/** Modal for viewing and updating the signed-in applicant's availability periods. */
export function AvailabilityModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [periods, setPeriods] = useState<AvailabilityPeriod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const utils = api.useUtils();

  const { data: existingPeriods, isLoading } =
    api.user.getMyAvailability.useQuery(undefined, {
      enabled: isOpen,
    });

  const updateAvailability = api.user.updateMyAvailability.useMutation({
    onSuccess: () => {
      setSuccessMessage("Tillgängligheterna har uppdaterats!");
      setError(null);
      void utils.user.getMyAvailability.invalidate();
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    },
    onError: (err) => {
      setError(err.message);
      setSuccessMessage(null);
    },
  });

  // Populate form when existing data loads
  useEffect(() => {
    if (existingPeriods) {
      if (existingPeriods.length > 0) {
        setPeriods(
          existingPeriods.map((p) => ({
            fromDate: p.from_date
              ? new Date(p.from_date).toISOString().split("T")[0]!
              : "",
            toDate: p.to_date
              ? new Date(p.to_date).toISOString().split("T")[0]!
              : "",
          })),
        );
      } else {
        setPeriods([{ fromDate: "", toDate: "" }]);
      }
    }
  }, [existingPeriods]);

  const addPeriod = () => {
    setPeriods([...periods, { fromDate: "", toDate: "" }]);
  };

  const removePeriod = (index: number) => {
    setPeriods(periods.filter((_, i) => i !== index));
  };

  const updatePeriod = (
    index: number,
    field: keyof AvailabilityPeriod,
    value: string,
  ) => {
    const updated = [...periods];
    updated[index] = { ...updated[index]!, [field]: value };
    setPeriods(updated);
  };

  const handleSave = () => {
    setError(null);

    // Filter out empty rows
    const validPeriods = periods.filter((p) => p.fromDate && p.toDate);

    // Client-side validation
    for (const period of validPeriods) {
      if (new Date(period.fromDate) >= new Date(period.toDate)) {
        setError("Från-datum måste vara före till-datum");
        return;
      }
    }

    updateAvailability.mutate({ periods: validPeriods });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setError(null);
      setSuccessMessage(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CalendarDays className="h-4 w-4" />
          Hantera tillgänglighet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Tillgänglighetsperioder</DialogTitle>
          <DialogDescription>
            Lägg till eller ta bort perioder du är tillgänglig för arbete.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-slate-500">Laddar...</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                {successMessage}
              </div>
            )}

            {periods.length === 0 && (
              <p className="text-center text-sm text-slate-500">
                Inga tillgänglighetsperioder tillagda.
              </p>
            )}

            {periods.map((period, index) => (
              <div
                key={index}
                className="flex items-end gap-2 rounded-md border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Från
                  </label>
                  <input
                    type="date"
                    value={period.fromDate}
                    onChange={(e) =>
                      updatePeriod(index, "fromDate", e.target.value)
                    }
                    className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Till
                  </label>
                  <input
                    type="date"
                    value={period.toDate}
                    onChange={(e) =>
                      updatePeriod(index, "toDate", e.target.value)
                    }
                    className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removePeriod(index)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPeriod}
              className="w-full gap-1"
            >
              <Plus className="h-4 w-4" />
              Lägg till period
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => handleOpenChange(false)}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateAvailability.isPending || isLoading}
          >
            {updateAvailability.isPending ? "Sparar..." : "Spara"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
