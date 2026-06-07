import { useParams, useNavigate } from "react-router-dom";
import {
  Receipt,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  ExternalLink,
  Tag,
} from "lucide-react";
import { useExpense } from "../hooks/use-expenses";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/utils";

const METHOD_META: Record<string, { icon: typeof Banknote; label: string }> = {
  cash: { icon: Banknote, label: "Cash" },
  upi: { icon: Smartphone, label: "UPI" },
  card: { icon: CreditCard, label: "Card" },
  bank_transfer: { icon: Building, label: "Bank Transfer" },
};

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const expense = useExpense(id!);

  if (expense.isLoading) {
    return (
      <>
        <PageHeader title="Expense" showBack backTo={ROUTES.EXPENSES} />
        <div className="space-y-4 p-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </>
    );
  }

  if (expense.isError) {
    return (
      <>
        <PageHeader title="Expense" showBack backTo={ROUTES.EXPENSES} />
        <ErrorState
          title="Couldn't load expense"
          onRetry={() => expense.refetch()}
        />
      </>
    );
  }

  const e = expense.data!;
  const meta = METHOD_META[e.paymentMethod] ?? { icon: Receipt, label: "Other" };
  const MethodIcon = meta.icon;

  return (
    <>
      <PageHeader title="Expense Detail" showBack backTo={ROUTES.EXPENSES} />

      <div className="p-4 md:p-6">
        {/* ─── Amount Hero ─────────────────────────── */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <MethodIcon className="h-6 w-6 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                -{formatMoney(e.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {meta.label} · {formatDate(e.expenseDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
            <Tag className="h-3 w-3 text-primary" />
            <span className="text-xs font-semibold text-primary">{e.categoryName}</span>
          </div>
        </div>

        {/* ─── Details ───────────────────────────── */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <SectionCard title="Expense Details">
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Category" value={e.categoryName} />
              <DetailRow label="Amount" value={formatMoney(e.amount)} />
              <DetailRow label="Method" value={meta.label} />
              <DetailRow label="Date" value={formatDate(e.expenseDate)} />
              <DetailRow label="Recorded" value={formatDate(e.createdAt)} />
              {e.createdByName && (
                <DetailRow label="Recorded By" value={e.createdByName} />
              )}
            </div>
            {e.description && (
              <div className="mt-3 border-t pt-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Description
                </p>
                <p className="mt-0.5 text-sm">{e.description}</p>
              </div>
            )}
          </SectionCard>

          {/* Receipt */}
          {e.receiptUrl && (
            <SectionCard title="Receipt">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(e.receiptUrl!, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                View Receipt
              </Button>
              <p className="mt-2 truncate text-xs text-muted-foreground">
                {e.receiptUrl}
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
