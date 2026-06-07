import { Building2, Construction } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ROUTES } from "@/lib/constants";

/**
 * TODO: Gym Profile editing
 * - Backend does not currently expose a gym profile edit endpoint
 * - When available, this page should show: gym name, address, phone, email, logo, GST number
 * - Owner-only: usePermission("settings:gym")
 */
export default function GymProfilePage() {
  return (
    <>
      <PageHeader
        title="Gym Profile"
        showBack
        backTo={ROUTES.SETTINGS}
        subtitle="Gym name, address, and contact details"
      />

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={Building2}
            title="Coming Soon"
            description="Gym profile editing will be available in a future update. This will let you manage your gym's name, address, contact details, and branding."
          />

          <div className="mt-4 rounded-lg border border-dashed bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Construction className="h-4 w-4" />
              <span className="text-xs font-medium">Planned Features</span>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• Edit gym name and branding</li>
              <li>• Update address and location</li>
              <li>• Manage contact phone and email</li>
              <li>• Upload gym logo</li>
              <li>• Set GST/tax information for receipts</li>
              <li>• Configure business hours</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
