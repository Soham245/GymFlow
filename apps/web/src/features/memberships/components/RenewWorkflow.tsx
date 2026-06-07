import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  IndianRupee,
  Calendar,
  FileText,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
} from "lucide-react";
import { usePlans, useRenewMembership } from "../hooks/use-memberships";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatMoney, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Plan, MembershipDetail } from "@/api/types";

interface RenewWorkflowProps {
  membership: MembershipDetail;
  onComplete: () => void;
  onCancel: () => void;
}

type Step = "plan" | "discount" | "payment" | "review";
const STEPS: Step[] = ["plan", "discount", "payment", "review"];
const STEP_LABELS: Record<Step, string> = {
  plan: "Plan",
  discount: "Discount",
  payment: "Payment",
  review: "Confirm",
};

type PaymentChoice = "none" | "full" | "partial";
type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "bank_transfer", label: "Bank Transfer", icon: Building },
];

export function RenewWorkflow({ membership, onComplete, onCancel }: RenewWorkflowProps) {
  const plans = usePlans();
  const renew = useRenewMembership(membership.id);

  const [step, setStep] = useState<Step>("plan");
  const [selectedPlanId, setSelectedPlanId] = useState(membership.planId);
  const [startDate, setStartDate] = useState(() => {
    const endDate = new Date(membership.endDate);
    const tomorrow = new Date(endDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const today = new Date();
    const start = tomorrow > today ? tomorrow : today;
    return start.toISOString().split("T")[0]!;
  });
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Payment state
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("none");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const selectedPlan = useMemo(
    () => plans.data?.find((p) => p.id === selectedPlanId),
    [plans.data, selectedPlanId]
  );

  const netAmount = selectedPlan
    ? Math.max(parseFloat(selectedPlan.price) - discountAmount, 0)
    : 0;

  // Effective payment amount based on choice
  const effectivePayment =
    paymentChoice === "full" ? netAmount :
    paymentChoice === "partial" ? Math.min(paymentAmount, netAmount) :
    0;
  const outstandingAfterPayment = Math.max(netAmount - effectivePayment, 0);

  const stepIndex = STEPS.indexOf(step);

  function goNext() {
    // When entering payment step, default the partial amount to net
    if (step === "discount" && paymentChoice === "partial" && paymentAmount === 0) {
      setPaymentAmount(netAmount);
    }
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1]!);
    }
  }

  function goBack() {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1]!);
    } else {
      onCancel();
    }
  }

  async function handleConfirm() {
    if (!selectedPlanId || !startDate) return;
    try {
      await renew.mutateAsync({
        planId: selectedPlanId,
        startDate,
        discountAmount,
        notes: notes || undefined,
        // Payment info passed as part of notes for now — the backend
        // creates the membership, then a separate payment call is needed.
        // The RenewWorkflow will indicate payment intent in the toast.
      });
      if (effectivePayment > 0) {
        toast.success(
          `Membership renewed! Record the ${formatMoney(effectivePayment)} ${paymentMethod} payment from the Payments page.`,
          { duration: 6000 }
        );
      } else {
        toast.success("Membership renewed successfully!");
      }
      onComplete();
    } catch {
      toast.error("Failed to renew membership");
    }
  }

  const canProceed =
    step === "plan"
      ? !!selectedPlanId && !!startDate
      : step === "discount"
        ? discountAmount >= 0 && (!selectedPlan || discountAmount <= parseFloat(selectedPlan.price))
        : step === "payment"
          ? paymentChoice === "none" ||
            paymentChoice === "full" ||
            (paymentChoice === "partial" && paymentAmount > 0 && paymentAmount <= netAmount)
          : true;

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <button
              onClick={() => i < stepIndex && setStep(s)}
              disabled={i > stepIndex}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors",
                step === s && "bg-primary text-primary-foreground",
                i < stepIndex && "bg-primary/10 text-primary hover:bg-primary/20",
                i > stepIndex && "bg-muted text-muted-foreground"
              )}
            >
              {i < stepIndex ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="font-bold">{i + 1}</span>
              )}
              <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[200px]">
        {step === "plan" && (
          <PlanStep
            plans={plans.data}
            loading={plans.isLoading}
            error={plans.isError}
            onRetry={() => plans.refetch()}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            startDate={startDate}
            onStartDateChange={setStartDate}
          />
        )}
        {step === "discount" && selectedPlan && (
          <DiscountStep
            plan={selectedPlan}
            discountAmount={discountAmount}
            onDiscountChange={setDiscountAmount}
            notes={notes}
            onNotesChange={setNotes}
          />
        )}
        {step === "payment" && selectedPlan && (
          <PaymentStep
            netAmount={netAmount}
            paymentChoice={paymentChoice}
            onPaymentChoiceChange={setPaymentChoice}
            paymentAmount={paymentAmount}
            onPaymentAmountChange={setPaymentAmount}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
          />
        )}
        {step === "review" && selectedPlan && (
          <ReviewStep
            plan={selectedPlan}
            startDate={startDate}
            discountAmount={discountAmount}
            netAmount={netAmount}
            effectivePayment={effectivePayment}
            outstandingAfterPayment={outstandingAfterPayment}
            paymentMethod={paymentChoice !== "none" ? paymentMethod : null}
            notes={notes}
            currentMembership={membership}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4" />
          {stepIndex === 0 ? "Cancel" : "Back"}
        </Button>

        {step === "review" ? (
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={renew.isPending}
          >
            {renew.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirm Renewal
              </>
            )}
          </Button>
        ) : (
          <Button size="sm" onClick={goNext} disabled={!canProceed}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Plan Step ──────────────────────────────────────────────────

function PlanStep({
  plans,
  loading,
  error,
  onRetry,
  selectedPlanId,
  onSelectPlan,
  startDate,
  onStartDateChange,
}: {
  plans?: Plan[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
  startDate: string;
  onStartDateChange: (d: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Couldn't load plans" onRetry={onRetry} />;
  }

  const activePlans = plans?.filter((p) => p.isActive) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          <Calendar className="mr-1 inline h-3 w-3" />
          Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          <FileText className="mr-1 inline h-3 w-3" />
          Select Plan
        </p>
        <div className="space-y-2">
          {activePlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border-2 p-3 text-left transition-colors",
                selectedPlanId === plan.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <div>
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.durationDays} day{plan.durationDays !== 1 ? "s" : ""}
                  {plan.description && ` · ${plan.description}`}
                </p>
              </div>
              <p className="text-sm font-bold text-primary">
                {formatMoney(plan.price)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Discount Step ──────────────────────────────────────────────

function DiscountStep({
  plan,
  discountAmount,
  onDiscountChange,
  notes,
  onNotesChange,
}: {
  plan: Plan;
  discountAmount: number;
  onDiscountChange: (n: number) => void;
  notes: string;
  onNotesChange: (s: string) => void;
}) {
  const price = parseFloat(plan.price);
  const net = Math.max(price - discountAmount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">Selected Plan</p>
        <p className="text-sm font-semibold">
          {plan.name} — {formatMoney(plan.price)}
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          <Tag className="mr-1 inline h-3 w-3" />
          Discount Amount (₹)
        </label>
        <input
          type="number"
          min={0}
          max={price}
          step={50}
          value={discountAmount || ""}
          onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
          placeholder="0"
          className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {discountAmount > price && (
          <p className="mt-1 text-xs text-destructive">
            Discount cannot exceed plan price
          </p>
        )}
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Net Amount</span>
          <span className="text-lg font-bold text-primary">{formatMoney(net)}</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Notes (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          maxLength={500}
          placeholder="Any notes about this renewal..."
          className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}

// ─── Payment Step ───────────────────────────────────────────────

function PaymentStep({
  netAmount,
  paymentChoice,
  onPaymentChoiceChange,
  paymentAmount,
  onPaymentAmountChange,
  paymentMethod,
  onPaymentMethodChange,
}: {
  netAmount: number;
  paymentChoice: PaymentChoice;
  onPaymentChoiceChange: (c: PaymentChoice) => void;
  paymentAmount: number;
  onPaymentAmountChange: (n: number) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
}) {
  const effectivePayment =
    paymentChoice === "full" ? netAmount :
    paymentChoice === "partial" ? Math.min(paymentAmount, netAmount) :
    0;
  const outstanding = Math.max(netAmount - effectivePayment, 0);

  return (
    <div className="space-y-4">
      {/* Net amount reminder */}
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Net Amount Due</span>
          <span className="text-sm font-bold">{formatMoney(netAmount)}</span>
        </div>
      </div>

      {/* Payment choice */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          <IndianRupee className="mr-1 inline h-3 w-3" />
          Payment Now
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "none", label: "No Payment", desc: "Pay later" },
              { value: "full", label: "Full Payment", desc: formatMoney(netAmount) },
              { value: "partial", label: "Partial", desc: "Custom amount" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onPaymentChoiceChange(opt.value);
                if (opt.value === "partial" && paymentAmount === 0) {
                  onPaymentAmountChange(Math.round(netAmount / 2));
                }
              }}
              className={cn(
                "rounded-lg border-2 p-3 text-center transition-colors",
                paymentChoice === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <p className="text-xs font-semibold">{opt.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Partial amount input */}
      {paymentChoice === "partial" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Payment Amount (₹)
          </label>
          <input
            type="number"
            min={1}
            max={netAmount}
            step={50}
            value={paymentAmount || ""}
            onChange={(e) => onPaymentAmountChange(Number(e.target.value) || 0)}
            className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {paymentAmount > netAmount && (
            <p className="mt-1 text-xs text-destructive">
              Cannot exceed net amount
            </p>
          )}
        </div>
      )}

      {/* Payment method — shown for full/partial */}
      {paymentChoice !== "none" && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Payment Method
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => onPaymentMethodChange(m.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors",
                  paymentMethod === m.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <m.icon className="h-4 w-4" />
                <span className="text-[10px] font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment summary */}
      <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <SummaryRow label="Net Amount" value={formatMoney(netAmount)} />
        <SummaryRow
          label="Paid Now"
          value={effectivePayment > 0 ? formatMoney(effectivePayment) : "—"}
          highlight={effectivePayment > 0}
        />
        <div className="border-t pt-2">
          <SummaryRow
            label="Outstanding"
            value={formatMoney(outstanding)}
            bold
            danger={outstanding > 0}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Review Step ────────────────────────────────────────────────

function ReviewStep({
  plan,
  startDate,
  discountAmount,
  netAmount,
  effectivePayment,
  outstandingAfterPayment,
  paymentMethod,
  notes,
  currentMembership,
}: {
  plan: Plan;
  startDate: string;
  discountAmount: number;
  netAmount: number;
  effectivePayment: number;
  outstandingAfterPayment: number;
  paymentMethod: PaymentMethod | null;
  notes: string;
  currentMembership: MembershipDetail;
}) {
  const endDate = computeEndDate(startDate, plan.durationDays);

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">Review & Confirm Renewal</p>

      {/* Current → New */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Current
          </p>
          <p className="mt-1 text-sm font-medium">{currentMembership.planName}</p>
          <StatusBadge status={currentMembership.status} />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Ends {formatDate(currentMembership.endDate)}
          </p>
        </div>
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
            New
          </p>
          <p className="mt-1 text-sm font-semibold">{plan.name}</p>
          <StatusBadge status="active" />
          <p className="mt-1 text-[10px] text-muted-foreground">
            {formatDate(startDate)} → {formatDate(endDate)}
          </p>
        </div>
      </div>

      {/* Pricing + Payment breakdown */}
      <div className="space-y-2 rounded-lg border p-3">
        <SummaryRow label="Plan Price" value={formatMoney(plan.price)} />
        {discountAmount > 0 && (
          <SummaryRow label="Discount" value={`-${formatMoney(discountAmount)}`} highlight />
        )}
        <div className="border-t pt-2">
          <SummaryRow label="Net Amount" value={formatMoney(netAmount)} bold />
        </div>
        {effectivePayment > 0 && (
          <>
            <SummaryRow
              label={`Paid Now (${paymentMethod ? capitalize(paymentMethod) : ""})`}
              value={formatMoney(effectivePayment)}
              highlight
            />
            <div className="border-t pt-2">
              <SummaryRow
                label="Outstanding After"
                value={formatMoney(outstandingAfterPayment)}
                bold
                danger={outstandingAfterPayment > 0}
              />
            </div>
          </>
        )}
        {effectivePayment === 0 && (
          <SummaryRow
            label="Payment"
            value="No payment now"
          />
        )}
      </div>

      {notes && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Notes
          </p>
          <p className="mt-0.5 text-sm">{notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Shared Helpers ─────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  bold,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-xs", bold ? "font-semibold" : "text-muted-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "text-sm",
          bold && "font-bold",
          highlight && "text-green-600",
          danger && "text-destructive"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function computeEndDate(startDate: string, durationDays: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + durationDays - 1);
  return d.toISOString().split("T")[0]!;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
