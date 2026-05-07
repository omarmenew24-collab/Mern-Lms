import { Link } from "react-router-dom";
import { ArrowLeft, SlidersHorizontal, ShieldCheck } from "lucide-react";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import RefundPolicyForm from "../../components/admin/RefundPolicyForm";
import MoneyBackGuaranteeForm from "../../components/admin/MoneyBackGuaranteeForm";

export default function AdminFinancialSettingsPage() {
  const user = useUserStore((s) => s.user);
  return (
    <AccountSettingsLayout
      title="Financial policy"
      subtitle="Refund rules and optional money-back messaging for paid courses."
      navItems={getAccountNavItems(user)}
    >
      <Link
        to={paths.admin}
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4 rtl-flip" />
        Back to admin overview
      </Link>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Refund policy</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Refunds apply to card payments only. Enrollments are revoked when a refund completes.
            </p>
          </div>
        </div>
        <RefundPolicyForm />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm mt-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Money-back guarantee (optional)</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Public message on course pages. Independent of refund automation—use both together or only one.
            </p>
          </div>
        </div>
        <MoneyBackGuaranteeForm />
      </div>
    </AccountSettingsLayout>
  );
}
