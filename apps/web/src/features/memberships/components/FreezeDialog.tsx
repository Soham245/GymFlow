import { useState } from "react";
import { Snowflake, Play, Loader2, X } from "lucide-react";
import { useFreezeMembership, useUnfreezeMembership } from "../hooks/use-memberships";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Freeze Dialog ──────────────────────────────────────────────

interface FreezeDialogProps {
  membershipId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function FreezeDialog({ membershipId, onComplete, onCancel }: FreezeDialogProps) {
  const freeze = useFreezeMembership(membershipId);
  const today = new Date().toISOString().split("T")[0]!;
  const [freezeStart, setFreezeStart] = useState(today);
  const [freezeEnd, setFreezeEnd] = useState("");
  const [reason, setReason] = useState("");

  async function handleFreeze() {
    try {
      await freeze.mutateAsync({
        freezeStart,
        freezeEnd: freezeEnd || undefined,
        reason: reason || undefined,
      });
      toast.success("Membership frozen");
      onComplete();
    } catch {
      toast.error("Failed to freeze membership");
    }
  }

  return (
    <div className="space-y-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold">Freeze Membership</h3>
        </div>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Freeze Start</label>
          <input
            type="date"
            value={freezeStart}
            onChange={(e) => setFreezeStart(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Freeze End (optional)</label>
          <input
            type="date"
            value={freezeEnd}
            min={freezeStart}
            onChange={(e) => setFreezeEnd(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Reason (optional)</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="e.g., Medical leave, Travel..."
          className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleFreeze} disabled={!freezeStart || freeze.isPending}>
          {freeze.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Snowflake className="h-4 w-4" />
          )}
          Freeze
        </Button>
      </div>
    </div>
  );
}

// ─── Unfreeze Dialog ────────────────────────────────────────────

interface UnfreezeDialogProps {
  membershipId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function UnfreezeDialog({ membershipId, onComplete, onCancel }: UnfreezeDialogProps) {
  const unfreeze = useUnfreezeMembership(membershipId);
  const today = new Date().toISOString().split("T")[0]!;
  const [unfreezeDate, setUnfreezeDate] = useState(today);

  async function handleUnfreeze() {
    try {
      await unfreeze.mutateAsync(unfreezeDate);
      toast.success("Membership unfrozen — end date extended");
      onComplete();
    } catch {
      toast.error("Failed to unfreeze membership");
    }
  }

  return (
    <div className="space-y-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-semibold">Unfreeze Membership</h3>
        </div>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        The end date will be extended by the number of frozen days.
      </p>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Unfreeze Date</label>
        <input
          type="date"
          value={unfreezeDate}
          onChange={(e) => setUnfreezeDate(e.target.value)}
          className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleUnfreeze} disabled={!unfreezeDate || unfreeze.isPending}>
          {unfreeze.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Unfreeze
        </Button>
      </div>
    </div>
  );
}
