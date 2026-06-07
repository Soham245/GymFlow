import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Save,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  Tag,
  Link as LinkIcon,
} from "lucide-react";
import { useExpense, useUpdateExpense, useExpenseCategories } from "../hooks/use-expenses";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer";

const METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "bank_transfer", label: "Bank", icon: Building },
];

export default function ExpenseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const expense = useExpense(id!);
  const updateExpense = useUpdateExpense(id!);
  const categories = useExpenseCategories();

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [expenseDate, setExpenseDate] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Populate form from existing data
  useEffect(() => {
    if (expense.data && !initialized) {
      const e = expense.data;
      setCategoryId(e.categoryId);
      setAmount(parseFloat(e.amount));
      setDescription(e.description ?? "");
      setPaymentMethod(e.paymentMethod as PaymentMethod);
      setExpenseDate(e.expenseDate);
      setReceiptUrl(e.receiptUrl ?? "");
      setInitialized(true);
    }
  }, [expense.data, initialized]);

  if (expense.isLoading || !initialized) {
    return (
      <>
        <PageHeader title="Edit Expense" showBack backTo={ROUTES.EXPENSE_DETAIL(id!)} />
        <div className="mx-auto max-w-lg space-y-4 p-4 md:p-6">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </>
    );
  }

  if (expense.isError) {
    return (
      <>
        <PageHeader title="Edit Expense" showBack backTo={ROUTES.EXPENSES} />
        <ErrorState title="Couldn't load expense" onRetry={() => expense.refetch()} />
      </>
    );
  }

  const isValid = !!categoryId && typeof amount === "number" && amount > 0 && !!expenseDate;

  async function handleSubmit() {
    if (!isValid || typeof amount !== "number") return;
    try {
      await updateExpense.mutateAsync({
        categoryId,
        amount,
        description: description || undefined,
        paymentMethod,
        expenseDate,
        receiptUrl: receiptUrl || undefined,
      });
      toast.success("Expense updated");
      navigate(ROUTES.EXPENSE_DETAIL(id!));
    } catch {
      toast.error("Failed to update expense");
    }
  }

  return (
    <>
      <PageHeader title="Edit Expense" showBack backTo={ROUTES.EXPENSE_DETAIL(id!)} />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-lg space-y-5">
          {/* Category */}
          <section>
            <label className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3 w-3" />
              Category
            </label>
            {categories.isLoading ? (
              <Skeleton className="h-16 w-full rounded-lg" />
            ) : categories.data && categories.data.length > 0 ? (
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
            ) : null}
          </section>

          {/* Amount */}
          <section>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount (&#8377;)
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

          {/* Description */}
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

          {/* Payment Method */}
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

          {/* Date */}
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

          {/* Receipt URL */}
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(ROUTES.EXPENSE_DETAIL(id!))}
              disabled={updateExpense.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isValid || updateExpense.isPending}
            >
              {updateExpense.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
