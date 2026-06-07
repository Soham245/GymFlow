import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Save,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useMember, useUpdateMember } from "../hooks/use-members";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
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

type FieldErrors = Partial<Record<keyof FormData, string>>;

// ─── Validation (same as MemberNewPage) ──────────────────────

const PHONE_RE = /^\+?[0-9]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validate(form: FormData): FieldErrors {
  const errs: FieldErrors = {};

  if (!form.name.trim()) {
    errs.name = "Name is required";
  } else if (form.name.trim().length < 2) {
    errs.name = "Name must be at least 2 characters";
  } else if (form.name.trim().length > 255) {
    errs.name = "Name must be under 255 characters";
  }

  if (!form.phone.trim()) {
    errs.phone = "Phone is required";
  } else if (form.phone.trim().length < 10) {
    errs.phone = "Phone must be at least 10 digits";
  } else if (form.phone.trim().length > 15) {
    errs.phone = "Phone must be under 15 digits";
  } else if (!PHONE_RE.test(form.phone.trim())) {
    errs.phone = "Phone must contain only digits (optional + prefix)";
  }

  if (!form.joinDate) {
    errs.joinDate = "Join date is required";
  } else if (!DATE_RE.test(form.joinDate)) {
    errs.joinDate = "Join date must be YYYY-MM-DD";
  }

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errs.email = "Invalid email address";
  }

  if (form.dateOfBirth && !DATE_RE.test(form.dateOfBirth)) {
    errs.dateOfBirth = "Date of birth must be YYYY-MM-DD";
  }

  if (form.address.length > 500) {
    errs.address = "Address must be under 500 characters";
  }

  if (form.emergencyContactName.length > 255) {
    errs.emergencyContactName = "Name must be under 255 characters";
  }

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

export default function MemberEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const member = useMember(id!);
  const updateMember = useUpdateMember(id!);

  const [form, setForm] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<keyof FormData>>(new Set());
  const [showOptional, setShowOptional] = useState(false);

  // Populate form when member data loads
  useEffect(() => {
    if (member.data && !form) {
      const m = member.data;
      const initial: FormData = {
        name: m.name,
        phone: m.phone,
        email: m.email ?? "",
        gender: (m.gender as Gender) ?? "",
        dateOfBirth: m.dateOfBirth ?? "",
        address: m.address ?? "",
        emergencyContactName: m.emergencyContactName ?? "",
        emergencyContactPhone: m.emergencyContactPhone ?? "",
        joinDate: m.joinDate,
      };
      setForm(initial);
      // Auto-expand optional section if any optional fields have data
      if (m.email || m.gender || m.dateOfBirth || m.address || m.emergencyContactName || m.emergencyContactPhone) {
        setShowOptional(true);
      }
    }
  }, [member.data, form]);

  // ─── Loading ──────────────────────────────────────────
  if (member.isLoading || !form) {
    return (
      <>
        <PageHeader title="Edit Member" showBack backTo={ROUTES.MEMBER_DETAIL(id!)} />
        <div className="mx-auto max-w-lg space-y-4 p-4 md:p-6">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (member.isError) {
    return (
      <>
        <PageHeader title="Edit Member" showBack backTo={ROUTES.MEMBERS} />
        <ErrorState
          title="Couldn't load member"
          onRetry={() => member.refetch()}
        />
      </>
    );
  }

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
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
    if (!form) return;

    const errs = validate(form);
    setErrors(errs);
    setTouched(new Set(Object.keys(form) as Array<keyof FormData>));

    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      document.getElementById(`field-${firstKey}`)?.focus();
      return;
    }

    // Build payload with all fields (backend accepts partial)
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      joinDate: form.joinDate,
    };
    // Include optional fields — send empty string as undefined to clear them
    payload.email = form.email.trim() || undefined;
    payload.gender = form.gender || undefined;
    payload.dateOfBirth = form.dateOfBirth || undefined;
    payload.address = form.address.trim() || undefined;
    payload.emergencyContactName = form.emergencyContactName.trim() || undefined;
    payload.emergencyContactPhone = form.emergencyContactPhone.trim() || undefined;

    updateMember.mutate(payload as any, {
      onSuccess: () => {
        toast.success("Member updated successfully");
        navigate(ROUTES.MEMBER_DETAIL(id!));
      },
      onError: (err: any) => {
        const status = err.response?.status;
        const message = err.response?.data?.error?.message ?? "";
        const details = err.response?.data?.error?.details;

        if (status === 409) {
          setErrors({ phone: message || "Phone number already exists" });
          document.getElementById("field-phone")?.focus();
        } else if (status === 400 && details) {
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
          toast.error(message || "Failed to update member. Please try again.");
        }
      },
    });
  }

  return (
    <>
      <PageHeader title="Edit Member" showBack backTo={ROUTES.MEMBER_DETAIL(id!)} />

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
              <div className="space-y-3 rounded-lg border border-dashed bg-muted/20 p-4">
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
              onClick={() => navigate(ROUTES.MEMBER_DETAIL(id!))}
              disabled={updateMember.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={updateMember.isPending}
            >
              {updateMember.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
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

// ─── Shared input class ───────────────────────────────────────

function fieldClass(hasError: boolean): string {
  return cn(
    "w-full rounded-lg border bg-background px-4 py-3 text-sm transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-primary",
    "placeholder:text-muted-foreground",
    hasError && "border-destructive focus:ring-destructive"
  );
}
