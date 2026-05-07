import { useEffect, useRef } from "react";
import { useParams, Link, useLocation, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/userstore";
import useCartStore from "../../store/cartStore";
import { useCheckEnrollment, useSyncPaymentIntent } from "../../api/payment";
import { paths } from "../../config/paths";

export default function Success() {
  const { t } = useTranslation();
  const { courseId } = useParams();
  const user = useUserStore((state) => state.user);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { syncPaymentIntent, isPending: isSyncing } = useSyncPaymentIntent();
  const syncedRef = useRef(false);
  const cartRemovedRef = useRef(false);
  const removeFromCart = useCartStore((s) => s.removeItem);

  const paymentIntentId = location.state?.paymentIntentId || searchParams.get("payment_intent") || "";

  const { isEnrolled, isLoading, isError } = useCheckEnrollment(courseId, user?._id, Boolean(user?._id && courseId));

  useEffect(() => {
    if (!paymentIntentId || !user?._id || syncedRef.current) return;
    const run = async () => {
      try {
        syncedRef.current = true;
        await syncPaymentIntent(paymentIntentId);
        await queryClient.invalidateQueries({ queryKey: ["enrollment", courseId, user._id] });
        await queryClient.invalidateQueries({ queryKey: ["enrollment-snapshot", courseId, user._id] });
      } catch { syncedRef.current = false; }
    };
    run();
  }, [paymentIntentId, user?._id, courseId, syncPaymentIntent, queryClient]);

  useEffect(() => {
    if (!isEnrolled || !courseId || cartRemovedRef.current) return;
    cartRemovedRef.current = true;
    removeFromCart(courseId);
  }, [isEnrolled, courseId, removeFromCart]);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-10 text-center max-w-sm w-full">
        {!isEnrolled && !isError && (
          <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        )}
        {isEnrolled && (
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
        {isError && (
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
        )}

        <h1 className={`text-xl font-extrabold ${isEnrolled ? "text-gray-900 dark:text-white" : isError ? "text-red-600" : "text-gray-900 dark:text-white"}`}>
          {isError
            ? t("billing.success.verificationFailed")
            : isEnrolled
              ? t("billing.success.enrolled")
              : t("billing.success.finalizing")}
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {isError && t("billing.success.supportError")}
          {!isEnrolled && !isError && (isSyncing ? t("billing.success.savingPayment") : t("billing.success.confirmingPayment"))}
          {isEnrolled && t("billing.success.paymentProcessed")}
        </p>

        {isEnrolled && (
          <Link to={paths.student} className="mt-6 inline-flex items-center justify-center h-11 px-6 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
            {t("billing.success.goMyCourses")}
          </Link>
        )}
        {isError && (
          <Link to="/support" className="mt-4 text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline block">
            {t("billing.success.contactSupport")}
          </Link>
        )}
      </div>
    </div>
  );
}
