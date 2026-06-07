import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  X,
  Check,
  ToggleLeft,
  ToggleRight,
  Calendar,
  IndianRupee,
  ArrowUpDown,
  Loader2,
  Dumbbell,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermission } from "@/hooks/use-permission";
import { ROUTES } from "@/lib/constants";
import { formatMoney, cn } from "@/lib/utils";
import {
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  useTogglePlanStatus,
} from "../hooks/use-settings";
import type { Plan } from "@/api/types";

// ─── Form state ───────────────────────────────────────────────

interface PlanFormData {
  name: string;
  durationDays: string;
  price: string;
  description: string;
  sortOrder: string;
}

const EMPTY_FORM: PlanFormData = {
  name: "",
  durationDays: "",
  price: "",
  description: "",
  sortOrder: "0",
};

function formFromPlan(plan: Plan): PlanFormData {
  return {
    name: plan.name,
    durationDays: String(plan.durationDays),
    price: plan.price,
    description: plan.description ?? "",
    sortOrder: String(plan.sortOrder),
  };
}

// ─── Page ─────────────────────────────────────────────────────

export default function PlansSettingsPage() {
  const canManage = usePermission("plans:manage");
  const plans = usePlans(true); // include inactive

  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormData>(EMPTY_FORM);

  // Deactivation confirmation
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    if (!plans.data) return [];
    return [...plans.data].sort((a, b) => {
      // Active first, then by sortOrder, then by name
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }, [plans.data]);

  const activePlans = sorted.filter((p) => p.isActive);
  const inactivePlans = sorted.filter((p) => !p.isActive);

  // ── Mutations ─────────────────────────────────────────────

  const createMut = useCreatePlan();
  const updateMut = useUpdatePlan(editingId ?? "");
  const isPending = createMut.isPending || updateMut.isPending;

  function startCreate() {
    setMode("create");
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function startEdit(plan: Plan) {
    setMode("edit");
    setEditingId(plan.id);
    setForm(formFromPlan(plan));
  }

  function cancel() {
    setMode("idle");
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Name is required";
    if (form.name.trim().length < 2) return "Name must be at least 2 characters";
    const days = parseInt(form.durationDays);
    if (isNaN(days) || days <= 0) return "Duration must be a positive number";
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) return "Price must be a non-negative number";
    if (form.description.length > 500) return "Description must be 500 characters or less";
    const order = parseInt(form.sortOrder);
    if (isNaN(order) || order < 0) return "Sort order must be a non-negative number";
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const payload = {
      name: form.name.trim(),
      durationDays: parseInt(form.durationDays),
      price: parseFloat(form.price),
      description: form.description.trim() || undefined,
      sortOrder: parseInt(form.sortOrder),
    };

    if (mode === "create") {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Plan created");
          cancel();
        },
        onError: (e: any) => toast.error(e.response?.data?.error ?? "Failed to create plan"),
      });
    } else {
      updateMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Plan updated");
          cancel();
        },
        onError: (e: any) => toast.error(e.response?.data?.error ?? "Failed to update plan"),
      });
    }
  }

  function setField(field: keyof PlanFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <PageHeader
        title="Membership Plans"
        showBack
        backTo={ROUTES.SETTINGS}
        subtitle="Create and manage membership plan templates"
        actions={
          canManage && mode === "idle" ? (
            <Button size="sm" onClick={startCreate}>
              <Plus className="mr-1 h-4 w-4" />
              New Plan
            </Button>
          ) : undefined
        }
        mobileActions={
          canManage && mode === "idle" ? (
            <button onClick={startCreate} className="rounded-full p-1.5 active:bg-accent">
              <Plus className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* ── Inline form ──────────────────────────────────── */}
          {mode !== "idle" && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold">
                {mode === "create" ? "New Plan" : "Edit Plan"}
              </h3>

              {/* Name */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. Monthly Premium"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              {/* Duration + Price row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Duration (days) *
                  </label>
                  <input
                    type="number"
                    value={form.durationDays}
                    onChange={(e) => setField("durationDays", e.target.value)}
                    placeholder="30"
                    min="1"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="1500"
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setField("sortOrder", e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
                  {form.description.length}/500
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={cancel} disabled={isPending}>
                  <X className="mr-1 h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-3.5 w-3.5" />
                  )}
                  {mode === "create" ? "Create" : "Save"}
                </Button>
              </div>
            </div>
          )}

          {/* ── Plans list ───────────────────────────────────── */}
          {plans.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : plans.isError ? (
            <ErrorState title="Couldn't load plans" onRetry={() => plans.refetch()} />
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No plans yet"
              description="Create your first membership plan to get started"
              actionLabel={canManage ? "New Plan" : undefined}
              onAction={canManage ? startCreate : undefined}
            />
          ) : (
            <>
              {/* Active plans */}
              {activePlans.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Plans ({activePlans.length})
                  </h3>
                  <div className="divide-y rounded-lg border bg-card">
                    {activePlans.map((plan) => (
                      <PlanRow
                        key={plan.id}
                        plan={plan}
                        canManage={canManage}
                        isEditing={editingId === plan.id}
                        onEdit={() => startEdit(plan)}
                        onToggle={() => setConfirmDeactivateId(plan.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive plans */}
              {inactivePlans.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Inactive Plans ({inactivePlans.length})
                  </h3>
                  <div className="divide-y rounded-lg border bg-card opacity-70">
                    {inactivePlans.map((plan) => (
                      <PlanRow
                        key={plan.id}
                        plan={plan}
                        canManage={canManage}
                        isEditing={editingId === plan.id}
                        onEdit={() => startEdit(plan)}
                        onToggle={() => {
                          // Reactivate — no confirmation needed
                        }}
                        reactivate
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Deactivation confirmation dialog ─────────────── */}
          {confirmDeactivateId && (
            <DeactivateDialog
              planId={confirmDeactivateId}
              planName={sorted.find((p) => p.id === confirmDeactivateId)?.name ?? ""}
              onClose={() => setConfirmDeactivateId(null)}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Plan Row ─────────────────────────────────────────────────

function PlanRow({
  plan,
  canManage,
  isEditing,
  onEdit,
  onToggle,
  reactivate,
}: {
  plan: Plan;
  canManage: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onToggle: () => void;
  reactivate?: boolean;
}) {
  const toggleMut = useTogglePlanStatus(plan.id);

  function handleReactivate() {
    toggleMut.mutate(true, {
      onSuccess: () => toast.success(`${plan.name} reactivated`),
      onError: (e: any) => toast.error(e.response?.data?.error ?? "Failed to reactivate"),
    });
  }

  const durationLabel =
    plan.durationDays >= 365
      ? `${Math.round(plan.durationDays / 365)}y`
      : plan.durationDays >= 30
        ? `${Math.round(plan.durationDays / 30)}mo`
        : `${plan.durationDays}d`;

  return (
    <div className={cn("p-4", isEditing && "ring-2 ring-primary ring-inset")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{plan.name}</p>
          {plan.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {plan.description}
            </p>
          )}

          {/* Meta chips */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              <Calendar className="h-3 w-3" />
              {plan.durationDays} days ({durationLabel})
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
              <IndianRupee className="h-3 w-3" />
              {formatMoney(plan.price)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              <ArrowUpDown className="h-3 w-3" />
              Order: {plan.sortOrder}
            </span>
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onEdit}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Edit plan"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {reactivate ? (
              <button
                onClick={handleReactivate}
                disabled={toggleMut.isPending}
                className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
                title="Reactivate plan"
              >
                {toggleMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
              </button>
            ) : (
              <button
                onClick={onToggle}
                disabled={toggleMut.isPending}
                className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
                title="Deactivate plan"
              >
                {toggleMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ToggleRight className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Deactivation Confirmation Dialog ─────────────────────────

function DeactivateDialog({
  planId,
  planName,
  onClose,
}: {
  planId: string;
  planName: string;
  onClose: () => void;
}) {
  const toggleMut = useTogglePlanStatus(planId);

  function handleDeactivate() {
    toggleMut.mutate(false, {
      onSuccess: () => {
        toast.success(`${planName} deactivated`);
        onClose();
      },
      onError: (e: any) => toast.error(e.response?.data?.error ?? "Failed to deactivate"),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-card p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="text-sm font-semibold">Deactivate Plan</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to deactivate <strong>{planName}</strong>? This plan
          will no longer appear when creating new memberships, but existing memberships
          using this plan will not be affected.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose} disabled={toggleMut.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeactivate}
            disabled={toggleMut.isPending}
          >
            {toggleMut.isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ToggleLeft className="mr-1 h-3.5 w-3.5" />
            )}
            Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
}
