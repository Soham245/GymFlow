import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  ShieldAlert,
  Wallet,
  UserCheck,
  ChevronRight,
  Package,
  Check,
} from "lucide-react";
import { useCreateMember } from "../hooks/use-members";
import { usePlans } from "@/features/memberships/hooks/use-memberships";
import { api } from "@/api/client";
import { MEMBERSHIPS } from "@/api/endpoints";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn, formatMoney } from "@/lib/utils";
import { toast } from "sonner";

type Gender = "male" | "female" | "other";

interface FormData {
  name: string;
  phone: string;
  email: string;
  gender: Gender | "";
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  joinDate: string;
}

const INITIAL: FormData = {
  name: "",
  phone: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  joinDate: new Date().toISOString().slice(0, 10), // today YYYY-MM-DD
};

// ─── Field-level error type ───────────────────────────────────

type FieldErrors = Partial<Record<keyof FormData, string>>;

// ─── Validation (mirrors shared Zod schemas) ──────────────────

const PHONE_RE = /^\+?[0-9]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validate(form: FormData): FieldErrors {
  const errs: FieldErrors = {};

  // Required: name
  if (!form.name.trim()) {
    errs.name = "Name is required";
  } else if (form.name.trim().length < 2) {
    errs.name = "Name must be at least 2 characters";
  } else if (form.name.trim().length > 255) {
    errs.name = "Name must be under 255 characters";
  }

  // Required: phone
  if (!form.phone.trim()) {
    errs.phone = "Phone is required";
  } else if (form.phone.trim().length < 10) {
    errs.phone = "Phone must be at least 10 digits";
  } else if (form.phone.trim().length > 15) {
    errs.phone = "Phone must be under 15 digits";
  } else if (!PHONE_RE.test(form.phone.trim())) {
    errs.phone = "Phone must contain only digits (optional + prefix)";
  }

  // Required: joinDate
  if (!form.joinDate) {
    errs.joinDate = "Join date is required";
  } else if (!DATE_RE.test(form.joinDate)) {
    errs.joinDate = "Join date must be YYYY-MM-DD";
  }

  // Optional: email
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errs.email = "Invalid email address";
  }

  // Optional: dateOfBirth
  if (form.dateOfBirth && !DATE_RE.test(form.dateOfBirth)) {
    errs.dateOfBirth = "Date of birth must be YYYY-MM-DD";
  }

  // Optional: address
  if (form.address.length > 500) {
    errs.address = "Address must be under 500 characters";
  }

  // Optional: emergencyContactName
  if (form.emergencyContactName.length > 255) {
    errs.emergencyContactName = "Name must be under 255 characters";
  }

  // Optional: emergencyContactPhone
  if (form.emergencyContactPhone.trim()) {
    if (!PHONE_RE.test(form.emergencyContactPhone.trim())) {
      errs.emergencyContactPhone = "Must contain only digits (optional + prefix)";
    } else if (form.emergencyContactPhone.trim().length < 10) {
      errs.emergencyContactPhone = "Must be at least 10 digits";
    }
  }

  return errs;
}

// ─── Page Component ───────────────────────────────────────────

export default function MemberNewPage() {
  const navigate = useNavigate();
  const createMember = useCreateMember();
  const plans = usePlans();

  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<keyof FormData>>(new Set());
  const [showOptional, setShowOptional] = useState(false);
  // Plan selection (optional — assign package on creation)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  // Post-creation success state
  const [createdMemberId, setCreatedMemberId] = useState<string | null>(null);

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on edit
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function markTouched(key: keyof FormData) {
    setTouched((prev) => new Set(prev).add(key));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs = validate(form);
    setErrors(errs);
    // Mark all fields touched so errors show
    setTouched(new Set(Object.keys(form) as Array<keyof FormData>));

    if (Object.keys(errs).length > 0) {
      // Focus the first error field
      const firstKey = Object.keys(errs)[0];
      const el = document.getElementById(`field-${firstKey}`);
      el?.focus();
      return;
    }

    // Build payload — only include non-empty optional fields
    const payload: Parameters<typeof createMember.mutate>[0] = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      joinDate: form.joinDate,
    };
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.gender) payload.gender = form.gender as Gender;
    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
    if (form.address.trim()) payload.address = form.address.trim();
    if (form.emergencyContactName.trim())
      payload.emergencyContactName = form.emergencyContactName.trim();
    if (form.emergencyContactPhone.trim())
      payload.emergencyContactPhone = form.emergencyContactPhone.trim();

    createMember.mutate(payload, {
      onSuccess: async (member) => {
        toast.success("Member created successfully");

        // If a plan was selected, also create the membership
        if (selectedPlanId) {
          try {
            await api.post(MEMBERSHIPS.CREATE(member.id), {
              planId: selectedPlanId,
              startDate: form.joinDate,
              discountAmount: 0,
            });
            toast.success("Membership plan assigned");
          } catch {
            toast.error("Member created but failed to assign plan. You can add it manually.");
          }
        }

        setCreatedMemberId(member.id);
      },
      onError: (err: any) => {
        const status = err.response?.status;
        const message = err.response?.data?.error?.message ?? err.response?.data?.error ?? "";
        const details = err.response?.data?.error?.details;

        if (status === 409) {
          // Duplicate phone
          setErrors({ phone: message || "Phone number already exists" });
          document.getElementById("field-phone")?.focus();
        } else if (status === 400 && details) {
          // Field validation errors from backend
          const fieldErrs: FieldErrors = {};
          for (const [key, msgs] of Object.entries(details)) {
            if (key in form) {
              fieldErrs[key as keyof FormData] = (msgs as string[])[0];
            }
          }
          if (Object.keys(fieldErrs).length > 0) {
            setErrors(fieldErrs);
          } else {
            toast.error(message || "Validation error");
          }
        } else {
          toast.error(message || "Failed to create member. Please try again.");
        }
      },
    });
  }

  // ─── Post-creation success screen ────────────────────────────

  if (createdMemberId) {
    return (
      <>
        <PageHeader title="Member Created" showBack backTo={ROUTES.MEMBERS} />

        <div className="flex flex-col items-center px-6 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">{form.name.trim()}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            has been added successfully
          </p>

          <p className="mt-6 text-sm font-medium text-muted-foreground">
            What would you like to do next?
          </p>

          <div className="mt-3 w-full max-w-xs space-y-2">
            <NextStepButton
              icon={Wallet}
              label="Record Payment"
              description="Record an advance or registration fee"
              color="bg-green-600 text-white"
              onClick={() => navigate(`${ROUTES.PAYMENT_NEW}?memberId=${createdMemberId}`)}
            />
            <NextStepButton
              icon={User}
              label="Go to Profile"
              description="View full member profile and details"
              color="bg-muted text-foreground"
              onClick={() => navigate(ROUTES.MEMBER_DETAIL(createdMemberId))}
            />
          </div>
        </div>
      </>
    );
  }

  // ─── Form ────────────────────────────────────────────────────

  return (
    <>
      <PageHeader title="New Member" showBack backTo={ROUTES.MEMBERS} />

      <div className="p-4 md:p-6">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-auto max-w-lg space-y-5"
        >
          {/* ── Required Fields ─────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Required Information
            </legend>

            <FormField
              id="field-name"
              label="Full Name"
              required
              error={touched.has("name") ? errors.name : undefined}
            >
              <input
                id="field-name"
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                onBlur={() => markTouched("name")}
                placeholder="e.g. Rahul Sharma"
                autoFocus
                autoComplete="name"
                className={fieldClass(touched.has("name") && !!errors.name)}
              />
            </FormField>

            <FormField
              id="field-phone"
              label="Phone Number"
              required
              error={touched.has("phone") ? errors.phone : undefined}
            >
              <input
                id="field-phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                onBlur={() => markTouched("phone")}
                placeholder="e.g. 9876543210"
                autoComplete="tel"
                className={fieldClass(touched.has("phone") && !!errors.phone)}
              />
            </FormField>

            <FormField
              id="field-joinDate"
              label="Join Date"
              required
              error={touched.has("joinDate") ? errors.joinDate : undefined}
            >
              <input
                id="field-joinDate"
                type="date"
                value={form.joinDate}
                onChange={(e) => setField("joinDate", e.target.value)}
                onBlur={() => markTouched("joinDate")}
                className={fieldClass(touched.has("joinDate") && !!errors.joinDate)}
              />
            </FormField>
          </fieldset>

          {/* ── Package / Plan Selection ────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Membership Package
            </legend>
            <p className="text-xs text-muted-foreground">
              Optionally assign a membership plan when creating this member.
            </p>

            {plans.isLoading ? (
              <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading plans...
              </div>
            ) : plans.isError ? (
              <p className="text-xs text-destructive">Failed to load plans</p>
            ) : plans.data && plans.data.filter((p) => p.isActive).length > 0 ? (
              <div className="space-y-2">
                {plans.data
                  .filter((p) => p.isActive)
                  .map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() =>
                        setSelectedPlanId(selectedPlanId === plan.id ? null : plan.id)
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                        selectedPlanId === plan.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-background hover:bg-accent/50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          selectedPlanId === plan.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        )}
                      >
                        {selectedPlanId === plan.id && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.durationDays} days
                          {plan.description && ` · ${plan.description}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-primary">
                        {formatMoney(Number(plan.price))}
                      </span>
                    </button>
                  ))}

                {selectedPlanId && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlanId(null)}
                    className="text-xs text-muted-foreground hover:text-destructive hover:underline"
                  >
                    Clear selection (no package)
                  </button>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                No active plans available. You can create plans in Settings.
              </p>
            )}
          </fieldset>

          {/* ── Optional Fields Toggle ──────────────────── */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex w-full items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm transition-colors hover:bg-accent/50"
          >
            <span className="text-muted-foreground">
              {showOptional ? "Hide" : "Show"} optional fields
            </span>
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                showOptional && "rotate-90"
              )}
            />
          </button>

          {/* ── Optional Fields ─────────────────────────── */}
          {showOptional && (
            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Additional Details
              </legend>

              <FormField
                id="field-email"
                label="Email"
                error={touched.has("email") ? errors.email : undefined}
              >
                <input
                  id="field-email"
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  onBlur={() => markTouched("email")}
                  placeholder="email@example.com"
                  autoComplete="email"
                  className={fieldClass(touched.has("email") && !!errors.email)}
                />
              </FormField>

              <FormField id="field-gender" label="Gender">
                <div className="flex gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setField("gender", form.gender === g ? "" : g)}
                      className={cn(
                        "flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors",
                        form.gender === g
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField
                id="field-dateOfBirth"
                label="Date of Birth"
                error={touched.has("dateOfBirth") ? errors.dateOfBirth : undefined}
              >
                <input
                  id="field-dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setField("dateOfBirth", e.target.value)}
                  onBlur={() => markTouched("dateOfBirth")}
                  className={fieldClass(touched.has("dateOfBirth") && !!errors.dateOfBirth)}
                />
              </FormField>

              <FormField
                id="field-address"
                label="Address"
                error={touched.has("address") ? errors.address : undefined}
              >
                <textarea
                  id="field-address"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  onBlur={() => markTouched("address")}
                  placeholder="Home address (optional)"
                  rows={2}
                  className={cn(
                    fieldClass(touched.has("address") && !!errors.address),
                    "resize-none"
                  )}
                />
              </FormField>

              {/* Emergency Contact */}
              <div className="rounded-lg border border-dashed bg-muted/20 p-4 space-y-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Emergency Contact
                </p>

                <FormField
                  id="field-emergencyContactName"
                  label="Contact Name"
                  error={touched.has("emergencyContactName") ? errors.emergencyContactName : undefined}
                >
                  <input
                    id="field-emergencyContactName"
                    type="text"
                    value={form.emergencyContactName}
                    onChange={(e) => setField("emergencyContactName", e.target.value)}
                    onBlur={() => markTouched("emergencyContactName")}
                    placeholder="e.g. Father's name"
                    className={fieldClass(touched.has("emergencyContactName") && !!errors.emergencyContactName)}
                  />
                </FormField>

                <FormField
                  id="field-emergencyContactPhone"
                  label="Contact Phone"
                  error={touched.has("emergencyContactPhone") ? errors.emergencyContactPhone : undefined}
                >
                  <input
                    id="field-emergencyContactPhone"
                    type="tel"
                    inputMode="tel"
                    value={form.emergencyContactPhone}
                    onChange={(e) => setField("emergencyContactPhone", e.target.value)}
                    onBlur={() => markTouched("emergencyContactPhone")}
                    placeholder="e.g. 9876543210"
                    className={fieldClass(touched.has("emergencyContactPhone") && !!errors.emergencyContactPhone)}
                  />
                </FormField>
              </div>
            </fieldset>
          )}

          {/* ── Actions ─────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(ROUTES.MEMBERS)}
              disabled={createMember.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMember.isPending}
            >
              {createMember.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <User className="mr-2 h-4 w-4" />
              )}
              Save Member
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Form Field Wrapper ───────────────────────────────────────

function FormField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// ─── Next Step Button ─────────────────────────────────────────

function NextStepButton({
  icon: Icon,
  label,
  description,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-transform active:scale-[0.98]",
        color
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs opacity-80">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
    </button>
  );
}

// ─── Shared input class ───────────────────────────────────────

function fieldClass(hasError: boolean): string {
  return cn(
    "w-full rounded-lg border bg-background px-4 py-3 text-sm transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-primary",
    "placeholder:text-muted-foreground",
    hasError && "border-destructive focus:ring-destructive"
  );
}
