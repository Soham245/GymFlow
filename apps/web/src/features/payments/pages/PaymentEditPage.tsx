import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Save,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
} from "lucide-react";
import { usePayment, useUpdatePayment } from "../hooks/use-payments";
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

export default function PaymentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const payment = usePayment(id!);
  const updatePayment = useUpdatePayment(id!);

  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (payment.data && !initialized) {
      const p = payment.data;
      setAmount(parseFloat(p.amount));
      setPaymentMethod(p.paymentMethod as PaymentMethod);
      setPaymentDate(p.paymentDate);
      setNotes(p.notes ?? "");
      setInitialized(true);
    }
  }, [payment.data, initialized]);

  if (payment.isLoading || !initialized) {
    return (
      <>
        <PageHeader title="Edit Payment" showBack backTo={ROUTES.PAYMENT_DETAIL(id!)} />
        <div className="mx-auto max-w-lg space-y-4 p-4 md:p-6">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </>
    );
  }

  if (payment.isError) {
    return (
      <>
        <PageHeader title="Edit Payment" showBack backTo={ROUTES.PAYMENTS} />
        <ErrorState title="Couldn't load payment" onRetry={() => payment.refetch()} />
      </>
    );
  }

  const p = payment.data!;
  const isValid = typeof amount === "number" && amount > 0 && !!paymentDate;

  async function handleSubmit() {
    if (!isValid || typeof amount !== "number") return;
    try {
      await updatePayment.mutateAsync({
        amount,
        paymentMethod,
        paymentDate,
        notes: notes || null,
      });
      toast.success("Payment updated");
      navigate(ROUTES.PAYMENT_DETAIL(id!));
    } catch {
      toast.error("Failed to update payment");
    }
  }

  return (
    <>
      <PageHeader title="Edit Payment" showBack backTo={ROUTES.PAYMENT_DETAIL(id!)} />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-lg space-y-5">
          {/* Context info */}
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">Receipt</p>
            <p className="text-sm font-semibold">{p.receiptNumber}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Member: <span className="font-medium text-foreground">{p.memberName}</span>
              {p.planName && (
                <> &middot; Plan: <span className="font-medium text-foreground">{p.planName}</span></>
              )}
            </p>
          </div>

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
            {p.membershipId && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Changing the amount will adjust the linked membership balance.
              </p>
            )}
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
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* Notes */}
          <section>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="Any notes..."
              className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(ROUTES.PAYMENT_DETAIL(id!))}
              disabled={updatePayment.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isValid || updatePayment.isPending}
            >
              {updatePayment.isPending ? (
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
