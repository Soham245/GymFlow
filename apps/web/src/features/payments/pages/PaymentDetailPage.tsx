import { useParams, useNavigate } from "react-router-dom";
import {
  Download,
  Eye,
  User,
  FileText,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
} from "lucide-react";
import { usePayment, getReceiptUrl } from "../hooks/use-payments";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectionCard } from "@/components/shared/SectionCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatMoney, formatPhone, cn } from "@/lib/utils";
import { tokenStore } from "@/api/client";

const METHOD_META: Record<string, { icon: typeof Banknote; label: string }> = {
  cash: { icon: Banknote, label: "Cash" },
  upi: { icon: Smartphone, label: "UPI" },
  card: { icon: CreditCard, label: "Card" },
  bank_transfer: { icon: Building, label: "Bank Transfer" },
};

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const payment = usePayment(id!);

  // ─── Loading ──────────────────────────────────────────
  if (payment.isLoading) {
    return (
      <>
        <PageHeader title="Payment" showBack backTo={ROUTES.PAYMENTS} />
        <div className="space-y-4 p-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (payment.isError) {
    return (
      <>
        <PageHeader title="Payment" showBack backTo={ROUTES.PAYMENTS} />
        <ErrorState
          title="Couldn't load payment"
          onRetry={() => payment.refetch()}
        />
      </>
    );
  }

  const p = payment.data!;
  const meta = METHOD_META[p.paymentMethod] ?? { icon: Banknote, label: "Cash" };
  const MethodIcon = meta.icon;

  function handleDownloadReceipt() {
    const url = getReceiptUrl(p.id);
    const token = tokenStore.getAccessToken();
    // Open in new tab with auth token as query param for PDF download
    window.open(`${url}?token=${token}`, "_blank");
  }

  return (
    <>
      <PageHeader title={p.receiptNumber} showBack backTo={ROUTES.PAYMENTS} />

      <div className="p-4 md:p-6">
        {/* ─── Amount Hero ─────────────────────────── */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <MethodIcon className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {formatMoney(p.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {meta.label} · {formatDate(p.paymentDate)}
              </p>
            </div>
          </div>
          <StatusBadge status={p.paymentStatus} />
        </div>

        {/* ─── Receipt Actions ────────────────────── */}
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={handleDownloadReceipt}>
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* ─── Details ───────────────────────────── */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <SectionCard title="Payment Details">
            <div className="grid grid-cols-2 gap-3">
              <DetailRow label="Receipt No." value={p.receiptNumber} />
              <DetailRow label="Amount" value={formatMoney(p.amount)} />
              <DetailRow label="Method" value={meta.label} />
              <DetailRow label="Status" value={capitalize(p.paymentStatus)} />
              <DetailRow label="Date" value={formatDate(p.paymentDate)} />
              <DetailRow label="Recorded" value={formatDate(p.createdAt)} />
            </div>
            {p.notes && (
              <div className="mt-3 border-t pt-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Notes
                </p>
                <p className="mt-0.5 text-sm">{p.notes}</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Links">
            {/* Member */}
            <button
              onClick={() => navigate(ROUTES.MEMBER_DETAIL(p.memberId))}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{p.memberName}</p>
                <p className="text-xs text-muted-foreground">{formatPhone(p.memberPhone)}</p>
              </div>
            </button>

            {/* Membership */}
            {p.membershipId && p.planName && (
              <button
                onClick={() => navigate(ROUTES.MEMBERSHIP_DETAIL(p.membershipId!))}
                className="mt-2 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <FileText className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">{p.planName}</p>
                  <p className="text-xs text-muted-foreground">Membership</p>
                </div>
              </button>
            )}
          </SectionCard>
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
