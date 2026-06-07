import { useState } from "react";
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Check,
  X,
  Tag,
  AlertTriangle,
} from "lucide-react";
import {
  useExpenseCategories,
  useExpenses,
  useCreateCategory,
  useUpdateCategory,
  useToggleCategoryStatus,
} from "@/features/expenses/hooks/use-expenses";
import { usePermission } from "@/hooks/use-permission";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ExpenseCategory } from "@/api/types";

type Mode = null | "create" | { editing: ExpenseCategory };

export default function CategoriesPage() {
  const canManage = usePermission("categories:manage");
  const categories = useExpenseCategories(true); // include inactive
  const [mode, setMode] = useState<Mode>(null);

  return (
    <>
      <PageHeader
        title="Expense Categories"
        showBack
        backTo={ROUTES.SETTINGS}
        actions={
          canManage && !mode ? (
            <Button size="sm" onClick={() => setMode("create")}>
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          ) : undefined
        }
        mobileActions={
          canManage && !mode ? (
            <button
              onClick={() => setMode("create")}
              className="rounded-md p-1.5 text-primary"
            >
              <Plus className="h-5 w-5" />
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-lg space-y-4">

          {/* Create / Edit Form */}
          {mode && (
            <CategoryForm
              initialData={mode === "create" ? undefined : mode.editing}
              onClose={() => setMode(null)}
            />
          )}

          {/* List */}
          {categories.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : categories.isError ? (
            <ErrorState
              title="Couldn't load categories"
              onRetry={() => categories.refetch()}
            />
          ) : categories.data!.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No categories yet"
              description="Create expense categories to organize your spending."
              actionLabel={canManage ? "Add Category" : undefined}
              onAction={canManage ? () => setMode("create") : undefined}
            />
          ) : (
            <div className="divide-y rounded-lg border bg-card">
              {categories.data!.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  canManage={canManage}
                  onEdit={() => setMode({ editing: cat })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Category Form ────────────────────────────────────────────

function CategoryForm({
  initialData,
  onClose,
}: {
  initialData?: ExpenseCategory;
  onClose: () => void;
}) {
  const isEditing = !!initialData;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(initialData?.id ?? "");

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");

  const isValid = name.trim().length >= 2;
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Category updated");
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Category created");
      }
      onClose();
    } catch {
      toast.error(isEditing ? "Failed to update category" : "Failed to create category");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isEditing ? "Edit Category" : "New Category"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Rent, Utilities, Supplies..."
            maxLength={100}
            autoFocus
            className="mt-0.5 h-9 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
            maxLength={500}
            className="mt-0.5 h-9 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!isValid || isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isEditing ? "Save" : "Create"}
        </Button>
      </div>
    </form>
  );
}

// ─── Category Row ─────────────────────────────────────────────

function CategoryRow({
  category,
  canManage,
  onEdit,
}: {
  category: ExpenseCategory;
  canManage: boolean;
  onEdit: () => void;
}) {
  const toggleStatus = useToggleCategoryStatus(category.id);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // Fetch usage count — limit=1 so we only need the total from meta
  const usage = useExpenses({ categoryId: category.id, limit: 1 });
  const expenseCount = usage.data?.total ?? 0;

  async function handleToggle() {
    // If deactivating and has expenses, show confirmation first
    if (category.isActive && expenseCount > 0 && !confirmDeactivate) {
      setConfirmDeactivate(true);
      return;
    }

    try {
      await toggleStatus.mutateAsync(!category.isActive);
      toast.success(category.isActive ? "Category deactivated" : "Category activated");
      setConfirmDeactivate(false);
    } catch {
      toast.error("Failed to update status");
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            category.isActive ? "bg-primary/10" : "bg-muted"
          )}
        >
          <Tag
            className={cn(
              "h-5 w-5",
              category.isActive ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-sm font-medium",
                !category.isActive && "text-muted-foreground line-through"
              )}
            >
              {category.name}
            </p>
            {/* Usage count badge */}
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {usage.isLoading ? "…" : `${expenseCount} expense${expenseCount !== 1 ? "s" : ""}`}
            </span>
          </div>
          {category.description && (
            <p className="truncate text-xs text-muted-foreground">
              {category.description}
            </p>
          )}
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onEdit}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={handleToggle}
              disabled={toggleStatus.isPending}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                category.isActive
                  ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  : "text-muted-foreground hover:bg-accent"
              )}
              title={category.isActive ? "Deactivate" : "Activate"}
            >
              {toggleStatus.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : category.isActive ? (
                <ToggleRight className="h-5 w-5" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Deactivation confirmation */}
      {confirmDeactivate && (
        <div className="mx-4 mb-3 rounded-lg border-2 border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                This category has {expenseCount} expense{expenseCount !== 1 ? "s" : ""}
              </p>
              <p className="mt-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                Existing expenses will keep their category name. New expenses won't be able to use this category.
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setConfirmDeactivate(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 bg-amber-600 text-xs text-white hover:bg-amber-700"
                  onClick={handleToggle}
                  disabled={toggleStatus.isPending}
                >
                  {toggleStatus.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Deactivate"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
