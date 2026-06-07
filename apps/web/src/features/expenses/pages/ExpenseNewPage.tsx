import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Check,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  Tag,
  Link as LinkIcon,
} from "lucide-react";
import { useCreateExpense, useExpenseCategories } from "../hooks/use-expenses";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { formatMoney, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer";

const METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "bank_transfer", label: "Bank", icon: Building },
];

export default function ExpenseNewPage() {
  const navigate = useNavigate();
  const createExpense = useCreateExpense();
  const categories = useExpenseCategories();

  // State
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split("T")[0]!);
  const [receiptUrl, setReceiptUrl] = useState("");

  const selectedCategory = categories.data?.find((c) => c.id === categoryId);

  const isValid =
    !!categoryId &&
    typeof amount === "number" &&
    amount > 0 &&
    !!expenseDate;

  async function handleSubmit() {
    if (!isValid || typeof amount !== "number") return;
    try {
      await createExpense.mutateAsync({
        categoryId,
        amount,
        description: description || undefined,
        paymentMethod,
        expenseDate,
        receiptUrl: receiptUrl || undefined,
      });
      toast.success(`Expense of ${formatMoney(amount)} recorded`);
      navigate(ROUTES.EXPENSES);
    } catch {
      toast.error("Failed to record expense");
    }
  }

  return (
    <>
      <PageHeader title="Record Expense" showBack backTo={ROUTES.EXPENSES} />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-lg space-y-5">

          {/* ─── Category Selection ──────────────── */}
          <section>
            <label className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3 w-3" />
              Category
            </label>
            {categories.isLoading ? (
              <Skeleton className="h-16 w-full rounded-lg" />
            ) : categories.isError ? (
              <ErrorState
                title="Couldn't load categories"
                onRetry={() => categories.refetch()}
              />
            ) : !categories.data || categories.data.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No categories available. Ask your admin to create some.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.data.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors",
                      categoryId === cat.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ─── Amount ──────────────────────────── */}
          <section>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount (₹)
            </label>
            <input
              type="number"
              min={1}
              step={50}
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder="Enter amount..."
              className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* ─── Description ─────────────────────── */}
          <section>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="What was this expense for?"
              className="mt-1 w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* ─── Payment Method ──────────────────── */}
          <section>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Method
            </label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 py-3 transition-colors",
                    paymentMethod === m.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <m.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ─── Date ────────────────────────────── */}
          <section>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Expense Date
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* ─── Receipt URL ─────────────────────── */}
          <section>
            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <LinkIcon className="h-3 w-3" />
              Receipt URL (optional)
            </label>
            <input
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* ─── Preview ─────────────────────────── */}
          {typeof amount === "number" && amount > 0 && categoryId && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Expense Preview
              </p>
              <div className="space-y-1.5">
                <PreviewRow label="Category" value={selectedCategory?.name ?? "—"} />
                <PreviewRow label="Amount" value={formatMoney(amount)} bold />
                <PreviewRow label="Method" value={capitalize(paymentMethod)} />
                <PreviewRow label="Date" value={formatDate(expenseDate)} />
                {description && <PreviewRow label="Description" value={description} />}
                {receiptUrl && <PreviewRow label="Receipt" value="Attached" />}
              </div>
            </div>
          )}

          {/* ─── Submit ──────────────────────────── */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!isValid || createExpense.isPending}
          >
            {createExpense.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Record Expense
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

function PreviewRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm", bold && "font-bold")}>
        {value}
      </span>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
