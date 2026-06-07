import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  Loader2,
  Check,
  AlertCircle,
  User,
  FileText,
} from "lucide-react";
import { useMembers, useMember } from "@/features/members/hooks/use-members";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { MEMBERSHIPS } from "@/api/endpoints";
import { queryKeys } from "@/lib/query-keys";
import { useRecordPayment } from "../hooks/use-payments";
import { PaymentProgress } from "../components/PaymentProgress";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { formatMoney, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ApiResponse, Membership } from "@/api/types";

type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer";

const METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "bank_transfer", label: "Bank", icon: Building },
];

// TODO [Future]: View Receipt — after recording a payment, navigate to the
//   PaymentDetailPage and show a "View Receipt" button inline (or show the
//   receipt in a bottom-sheet modal) so the user can immediately share/print.
//
// TODO [Future]: Quick Payment workflow — allow recording a payment directly
//   from the MemberDetailPage or MembershipDetailPage via an inline panel
//   (similar to FreezeDialog) instead of navigating to a separate page.
//   This would eliminate the context-switch for the highest-frequency action.

export default function PaymentNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recordPayment = useRecordPayment();

  // Pre-select member/membership if passed via URL
  const preselectedMemberId = searchParams.get("memberId") ?? "";
  const preselectedMembershipId = searchParams.get("membershipId") ?? "";

  // State
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(preselectedMemberId);
  const [selectedMembershipId, setSelectedMembershipId] = useState(preselectedMembershipId);
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]!);
  const [notes, setNotes] = useState("");

  // Queries
  const members = useMembers({
    page: 1,
    limit: 10,
    search: memberSearch || undefined,
    status: "active",
  });

  const memberships = useQuery({
    queryKey: queryKeys.memberships.member(selectedMemberId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Membership[]>>(
        MEMBERSHIPS.MEMBER_LIST(selectedMemberId)
      );
      return res.data.data;
    },
    staleTime: 60_000,
    enabled: !!selectedMemberId,
  });

  const selectedMembership = useMemo(
    () => memberships.data?.find((ms) => ms.id === selectedMembershipId),
    [memberships.data, selectedMembershipId]
  );

  const outstanding = selectedMembership
    ? parseFloat(selectedMembership.outstandingAmount)
    : 0;

  // Fetch pre-selected member by ID (in case they aren't in the search results)
  const preselectedMember = useMember(preselectedMemberId);

  const selectedMember = useMemo(() => {
    // First try search results, then fallback to direct-fetch
    const fromList = members.data?.items.find((m) => m.id === selectedMemberId);
    if (fromList) return fromList;
    if (preselectedMember.data && preselectedMember.data.id === selectedMemberId) {
      return preselectedMember.data;
    }
    return undefined;
  }, [members.data, selectedMemberId, preselectedMember.data]);

  // Auto-fill amount when a pre-selected membership loads
  useEffect(() => {
    if (preselectedMembershipId && selectedMembership && amount === "") {
      const msOutstanding = parseFloat(selectedMembership.outstandingAmount);
      if (msOutstanding > 0) setAmount(msOutstanding);
    }
  }, [preselectedMembershipId, selectedMembership]); // eslint-disable-line react-hooks/exhaustive-deps

  const isValid =
    !!selectedMemberId &&
    typeof amount === "number" &&
    amount > 0 &&
    !!paymentDate &&
    (!selectedMembershipId || amount <= outstanding);

  async function handleSubmit() {
    if (!isValid || typeof amount !== "number") return;
    try {
      await recordPayment.mutateAsync({
        memberId: selectedMemberId,
        membershipId: selectedMembershipId || undefined,
        amount,
        paymentMethod,
        paymentDate,
        notes: notes || undefined,
      });
      toast.success(`Payment of ${formatMoney(amount)} recorded`);
      navigate(ROUTES.PAYMENTS);
    } catch {
      toast.error("Failed to record payment");
    }
  }

  return (
    <>
      <PageHeader title="Record Payment" showBack backTo={ROUTES.PAYMENTS} />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-lg space-y-5">

          {/* ─── Step 1: Select Member ────────────── */}
          <section>
            <label className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="h-3 w-3" />
              Member
            </label>

            {selectedMemberId && selectedMember ? (
              <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary/5 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <p className="text-sm font-medium">{selectedMember.name}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedMemberId("");
                    setSelectedMembershipId("");
                    setAmount("");
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search member by name or phone..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {memberSearch && members.isLoading && (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                )}
                {memberSearch && members.data && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border">
                    {members.data.items.length === 0 ? (
                      <p className="p-3 text-center text-xs text-muted-foreground">
                        No members found
                      </p>
                    ) : (
                      members.data.items.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMemberId(m.id);
                            setMemberSearch("");
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent/50"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {m.name.charAt(0)}
                          </div>
                          <span className="font-medium">{m.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ─── Step 2: Select Membership (optional) */}
          {selectedMemberId && (
            <section>
              <label className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <FileText className="h-3 w-3" />
                Membership (optional)
              </label>

              {memberships.isLoading ? (
                <Skeleton className="h-16 w-full rounded-lg" />
              ) : memberships.isError ? (
                <ErrorState
                  title="Couldn't load memberships"
                  onRetry={() => memberships.refetch()}
                />
              ) : !memberships.data || memberships.data.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No memberships for this member.
                </p>
              ) : (
                <div className="space-y-2">
                  {/* None option */}
                  <button
                    onClick={() => setSelectedMembershipId("")}
                    className={cn(
                      "w-full rounded-lg border-2 p-2.5 text-left text-xs transition-colors",
                      !selectedMembershipId
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    General payment (not linked to membership)
                  </button>

                  {memberships.data
                    .filter((ms) => ms.status === "active" || ms.status === "frozen")
                    .map((ms) => {
                      const msOutstanding = parseFloat(ms.outstandingAmount);
                      return (
                        <button
                          key={ms.id}
                          onClick={() => {
                            setSelectedMembershipId(ms.id);
                            // Auto-fill amount with outstanding
                            if (msOutstanding > 0) {
                              setAmount(msOutstanding);
                            }
                          }}
                          className={cn(
                            "w-full rounded-lg border-2 p-3 text-left transition-colors",
                            selectedMembershipId === ms.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{ms.planName}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(ms.startDate)} - {formatDate(ms.endDate)}
                            </span>
                          </div>
                          {msOutstanding > 0 && (
                            <div className="mt-2">
                              <PaymentProgress
                                paid={parseFloat(ms.paidAmount)}
                                total={parseFloat(ms.totalAmount) - parseFloat(ms.discountAmount)}
                              />
                            </div>
                          )}
                          {msOutstanding <= 0 && (
                            <p className="mt-1 text-[10px] text-green-600 font-semibold">Fully paid</p>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}
            </section>
          )}

          {/* ─── Step 3: Payment Details ──────────── */}
          {/* ─── Pay Full Outstanding Shortcut ──── */}
          {selectedMemberId && selectedMembershipId && outstanding > 0 && (
            <button
              onClick={() => {
                setAmount(outstanding);
                setPaymentMethod("cash");
              }}
              className="flex w-full items-center gap-3 rounded-lg border-2 border-green-200 bg-green-50 p-3 text-left transition-colors hover:border-green-300 hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:hover:bg-green-900"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Banknote className="h-5 w-5 text-green-700 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  Pay Full Outstanding
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {formatMoney(outstanding)} via Cash — tap to fill
                </p>
              </div>
            </button>
          )}

          {selectedMemberId && (
            <section className="space-y-4">
              {/* Amount */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedMembershipId && outstanding > 0 ? outstanding : undefined}
                  step={50}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Enter amount..."
                  className="mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {selectedMembershipId && outstanding > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-[10px] text-muted-foreground">
                      Outstanding: <span className="font-semibold text-destructive">{formatMoney(outstanding)}</span>
                    </p>
                    <button
                      onClick={() => setAmount(outstanding)}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      Fill full amount
                    </button>
                  </div>
                )}
                {typeof amount === "number" && selectedMembershipId && amount > outstanding && outstanding > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    Cannot exceed outstanding balance
                  </p>
                )}
              </div>

              {/* Payment method */}
              <div>
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
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Notes */}
              <div>
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
              </div>
            </section>
          )}

          {/* ─── Payment Preview ──────────────────── */}
          {selectedMemberId && typeof amount === "number" && amount > 0 && (
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Preview
              </p>
              <div className="space-y-1.5">
                <PreviewRow label="Member" value={selectedMember?.name ?? "—"} />
                {selectedMembership && (
                  <PreviewRow label="Membership" value={selectedMembership.planName} />
                )}
                <PreviewRow label="Amount" value={formatMoney(amount)} bold />
                <PreviewRow label="Method" value={capitalize(paymentMethod)} />
                <PreviewRow label="Date" value={formatDate(paymentDate)} />
                {selectedMembership && outstanding > 0 && (
                  <>
                    <div className="border-t pt-1.5">
                      <PreviewRow
                        label="Outstanding After"
                        value={formatMoney(Math.max(outstanding - amount, 0))}
                        danger={outstanding - amount > 0}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ─── Submit ──────────────────────────── */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!isValid || recordPayment.isPending}
          >
            {recordPayment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Record Payment
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
  danger,
}: {
  label: string;
  value: string;
  bold?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm",
          bold && "font-bold",
          danger && "text-destructive"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
