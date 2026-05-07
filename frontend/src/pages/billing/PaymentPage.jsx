import { useState } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormatter } from "../../lib/i18nFormatters";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Building2, CreditCard, Lock, MessageCircle, Landmark } from "lucide-react";
import useUserStore from "../../store/userstore";
import { useGetPaymentIntent, useEnrollmentSnapshot } from "../../api/payment";
import {
  usePublicManualPaymentMethods,
  useCreateManualPaymentOrder,
  useSubmitManualPaymentProof,
} from "../../api/manualPayment";
import { useGetCourseById } from "../../api/course";
import { paths } from "../../config/paths";
import { getStripePublishableKey } from "../../config/stripePublishable";

const publishableKey = getStripePublishableKey();
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const SUPPORT_WHATSAPP_DIGITS = (
  typeof import.meta.env.VITE_SUPPORT_WHATSAPP === "string"
    ? import.meta.env.VITE_SUPPORT_WHATSAPP.replace(/\D/g, "")
    : ""
);

function CheckoutForm() {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message);
        setLoading(false);
        return;
      }
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}${paths.checkoutSuccess(courseId)}`,
        },
      });
      if (error) {
        toast.error(error.message);
      } else if (paymentIntent?.status === "succeeded") {
        navigate(paths.checkoutSuccess(courseId), {
          state: { paymentIntentId: paymentIntent.id },
        });
      }
    } catch {
      toast.error(t("billing.checkout.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-brand-500" />
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("billing.checkout.completeEnrollment")}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("billing.checkout.paymentDetailsHint")}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <PaymentElement />
          <button
            disabled={!stripe || loading}
            className="w-full mt-6 h-11 flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            {loading ? t("billing.checkout.processing") : t("billing.checkout.payNow")}
          </button>
          <p className="text-[11px] text-center text-gray-400 mt-3">{t("billing.checkout.securedByStripe")}</p>
        </form>
      </div>
    </div>
  );
}

function ManualPaymentSection({ courseId, courseTitle }) {
  const { t } = useTranslation();
  const { money } = useFormatter();
  const navigate = useNavigate();
  const [methodId, setMethodId] = useState("");
  const [order, setOrder] = useState(null);
  const [txRef, setTxRef] = useState("");
  const [senderName, setSenderName] = useState("");
  const [paymentDate, setPaymentDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [file, setFile] = useState(null);

  const { data: methods = [], isLoading: methodsLoading } = usePublicManualPaymentMethods();
  const { mutateAsync: createOrder, isPending: creating } = useCreateManualPaymentOrder();
  const { mutateAsync: submitProof, isPending: submitting } = useSubmitManualPaymentProof();

  const selectedMethod = methods.find((m) => String(m._id) === String(methodId));

  const startOrder = async () => {
    if (!methodId) {
      toast.error(t("billing.checkout.chooseMethod"));
      return;
    }
    try {
      const res = await createOrder({ courseId, paymentMethodId: methodId });
      setOrder(res.order);
      if (res.reused) toast.success(t("billing.checkout.resumeExisting"));
    } catch {
      /* toast from hook */
    }
  };

  const onSubmitProof = async (e) => {
    e.preventDefault();
    if (!order?._id) return;
    if (!file) {
      toast.error(t("billing.checkout.uploadReceipt"));
      return;
    }
    try {
      const res = await submitProof({
        orderId: order._id,
        transactionRef: txRef,
        senderName,
        paymentDate,
        receiptFile: file,
      });
      if (res?.order) setOrder(res.order);
    } catch {
      /* toast from hook */
    }
  };

  const whatsappHref =
    SUPPORT_WHATSAPP_DIGITS.length >= 8
      ? (() => {
          const text = [
            `${t("billing.checkout.manualPayment")} — ${order?.orderNumber || "order"}`,
            courseTitle ? `${t("accountNav.courses")}: ${courseTitle}` : "",
            courseId ? `${t("notifications.viewCourse")}: ${window.location.origin}${paths.course(courseId)}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          return `https://wa.me/${SUPPORT_WHATSAPP_DIGITS}?text=${encodeURIComponent(text)}`;
        })()
      : null;

  if (methodsLoading) {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">{t("billing.checkout.loadingPaymentOptions")}</p>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/90 dark:bg-amber-950/20 px-5 py-4 text-sm text-amber-900 dark:text-amber-100">
        {t("billing.checkout.manualUnavailable")}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            {t("billing.checkout.paymentMethod")}
          </label>
          <select
            value={methodId}
            onChange={(e) => setMethodId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
          >
            <option value="">{t("billing.checkout.selectMethod")}</option>
            {methods.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          {selectedMethod ? (
            <div className="mt-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 text-sm space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">{selectedMethod.name}</p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="text-gray-500">{t("billing.checkout.accountWallet")}</span>{" "}
                <span className="font-mono">{selectedMethod.accountNumber}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="text-gray-500">{t("billing.checkout.accountHolder")}</span> {selectedMethod.accountHolder}
              </p>
              {selectedMethod.instructions ? (
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap pt-1 border-t border-gray-200 dark:border-gray-700">
                  {selectedMethod.instructions}
                </p>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            disabled={!methodId || creating}
            onClick={startOrder}
            className="mt-5 w-full h-11 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {creating ? t("billing.checkout.starting") : t("billing.checkout.continueToProof")}
          </button>
        </div>
      </div>
    );
  }

  const amountLabel =
    typeof order.amount === "number"
      ? money(order.amount)
      : "—";

  if (order.status === "awaiting_verification" || order.status === "approved") {
    return (
      <div className="max-w-md mx-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-center space-y-3">
        <Landmark className="w-10 h-10 mx-auto text-emerald-500" />
        <h3 className="font-bold text-gray-900 dark:text-white">
          {order.status === "approved" ? t("billing.checkout.paymentApproved") : t("billing.checkout.proofReceived")}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {order.status === "approved"
            ? t("billing.checkout.approvedHint")
            : t("billing.checkout.pendingHint")}
        </p>
        <p className="text-xs font-mono text-gray-500">Order {order.orderNumber}</p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            to={paths.studentManualPayments}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 text-white text-sm font-semibold"
          >
            {t("billing.checkout.viewPaymentStatus")}
          </Link>
          <button
            type="button"
            onClick={() => navigate(paths.home)}
            className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            {t("billing.checkout.backHome")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("billing.checkout.amountDue")}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{amountLabel}</p>
          <p className="text-xs font-mono text-gray-500 mt-1">Order {order.orderNumber}</p>
          {courseTitle ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{courseTitle}</p>
          ) : null}
        </div>
        <div className="px-5 py-4 space-y-2 text-sm">
          <p className="font-semibold text-gray-900 dark:text-white">{order.paymentMethod?.name}</p>
          <p>
            <span className="text-gray-500">{t("billing.checkout.sendTo")}</span>{" "}
            <span className="font-mono">{order.paymentMethod?.accountNumber}</span>
          </p>
          <p>
            <span className="text-gray-500">{t("billing.checkout.accountHolder")}</span> {order.paymentMethod?.accountHolder}
          </p>
          {order.paymentMethod?.instructions ? (
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap pt-2 border-t border-gray-100 dark:border-gray-800">
              {order.paymentMethod.instructions}
            </p>
          ) : null}
        </div>
      </div>

      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {t("billing.checkout.sendWhatsapp")}
        </a>
      ) : null}

      <form onSubmit={onSubmitProof} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t("billing.checkout.submitProof")}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("billing.checkout.submitProofHint")}
        </p>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("billing.checkout.transactionRef")}</label>
          <input
            required
            value={txRef}
            onChange={(e) => setTxRef(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            placeholder={t("billing.checkout.transactionRefPlaceholder")}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("billing.checkout.senderName")}</label>
          <input
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            placeholder={t("billing.checkout.senderNamePlaceholder")}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("billing.checkout.paymentDate")}</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("billing.checkout.receiptLabel")}</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-600 dark:text-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? t("billing.checkout.uploadSubmitting") : t("billing.checkout.submitForVerification")}
        </button>
      </form>
    </div>
  );
}

export default function Checkout() {
  const { t } = useTranslation();
  const { courseId } = useParams();
  const { user } = useUserStore();
  const [mode, setMode] = useState(() => (publishableKey ? "card" : "manual"));

  const { isEnrolled, isLoading: enrollmentLoading } = useEnrollmentSnapshot(
    courseId,
    user?._id,
  );

  const { data: courseData } = useGetCourseById(courseId, Boolean(courseId && user?._id));
  const courseTitle = courseData?.title || "";

  const allowStripeFetch = Boolean(
    user?._id && !enrollmentLoading && !isEnrolled && mode === "card",
  );
  const { data, isLoading, isError, error } = useGetPaymentIntent(
    courseId,
    user?._id,
    allowStripeFetch,
  );
  const clientSecret = data?.clientSecret;

  if (!user?._id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-16">
        <p className="text-gray-800 dark:text-gray-200 font-medium text-center mb-4">{t("billing.checkout.signInToPurchase")}</p>
        <Link
          to={paths.login}
          state={{ from: paths.checkoutCourse(courseId) }}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {t("billing.checkout.signIn")}
        </Link>
      </div>
    );
  }

  if (enrollmentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("billing.checkout.checkingEnrollment")}</p>
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-16">
        <p className="text-gray-800 dark:text-gray-200 font-medium text-center max-w-sm mb-2">
          {t("billing.checkout.alreadyEnrolled")}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
          {t("billing.checkout.alreadyEnrolledHint")}
        </p>
        <Link
          to={paths.courseWorkspace(courseId)}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          {t("billing.checkout.goWorkspace")}
        </Link>
        <Link
          to={paths.course(courseId)}
          className="mt-3 text-sm text-brand-600 dark:text-brand-400 hover:underline"
        >
          {t("billing.checkout.viewCoursePage")}
        </Link>
      </div>
    );
  }

  const stripeError = mode === "card" && isError;
  if (stripeError) {
    const msg =
      error?.response?.data?.message ||
      t("billing.checkout.failedInitialize");
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16 px-4">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <p className="text-red-500 font-medium">{msg}</p>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            {t("billing.checkout.useManualInstead")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-xl mx-auto mb-8 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("billing.checkout.checkoutTitle")}</h1>
        {courseTitle ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{courseTitle}</p>
        ) : null}
      </div>

      <div className="max-w-md mx-auto flex rounded-xl border border-gray-200 dark:border-gray-800 p-1 bg-gray-100/80 dark:bg-gray-900/80 mb-8">
        <button
          type="button"
          disabled={!publishableKey}
          onClick={() => setMode("card")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === "card"
              ? "bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          } ${!publishableKey ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <CreditCard className="w-4 h-4" />
          {t("billing.checkout.cardStripe")}
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === "manual"
              ? "bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          {t("billing.checkout.manualPayment")}
        </button>
      </div>

      {!publishableKey && mode === "card" ? (
        <p className="max-w-md mx-auto text-center text-sm text-amber-700 dark:text-amber-300 mb-6">
          {t("billing.checkout.stripeNotConfigured")}{" "}
          <code className="text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code>.
        </p>
      ) : null}

      {mode === "card" && publishableKey ? (
        clientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm />
          </Elements>
        ) : (
          <div className="flex flex-col items-center justify-center pt-12">
            <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? t("billing.checkout.generatingSession") : t("billing.checkout.initializingCheckout")}
            </p>
          </div>
        )
      ) : (
        <ManualPaymentSection courseId={courseId} courseTitle={courseTitle} />
      )}
    </div>
  );
}
