import { useState } from "react"; // Added useState for local button loading
import { useParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import useStore from "../store/userstore";
import { useGetPaymentIntent } from "../api/payment"; // Updated to the Query hook

const stripePromise = loadStripe("pk_test_51S4KZSBiu0YNe79tH8owEYRj5FiJkp4OuV48AxirNSnO63d635fMWE7sUJKCPnQ897Lr1BP53pnuckQlqsQzXrVa0098hw6Qkt");

function CheckoutForm() {
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
      // 1. Trigger form validation
      const { error: submitError } = await elements.submit();
      if (submitError) {
        alert(submitError.message);
        setLoading(false);
        return;
      }

      // 2. Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
      
        elements,
        redirect: "if_required", 
        confirmParams: {
          return_url: `${window.location.origin}/success/${courseId}`,
        },
      });

      if (error) {
        console.error("Payment failed:", error.message);
        alert(error.message);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // ✅ Success: Navigate to the polling success page
        navigate(`/success/${courseId}`);
        console.log(" i am in success function")
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Complete Your Enrollment</h2>
      <form onSubmit={handleSubmit}>
        <PaymentElement />
        <button
          disabled={!stripe || loading}
          className={`w-full mt-6 py-3 px-4 rounded-md text-white font-semibold transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </form>
    </div>
  );
}

export default function Checkout() {
  const { courseId } = useParams();
  const { zuser } = useStore();
  
  // ✅ NO useEffect here. 
  // useQuery (useGetPaymentIntent) fires automatically on mount.
  const { data, isLoading, isError } = useGetPaymentIntent(courseId, zuser?._id);

  // Extract clientSecret from data (which is res.data from the queryFn)
  const clientSecret = data?.clientSecret;

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 font-semibold text-lg">
          Failed to initialize payment. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="animate-pulse text-gray-500 font-medium">
            {isLoading ? "Generating Secure Session..." : "Initializing Checkout..."}
          </div>
          <div className="mt-4 border-t-2 border-blue-600 border-solid rounded-full w-8 h-8 animate-spin"></div>
        </div>
      )}
    </div>
  );
}