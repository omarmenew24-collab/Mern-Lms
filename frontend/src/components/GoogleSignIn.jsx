import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import useStore from "../store/userstore";
import { useGoogleLogin } from "../api/auth";
import { paths } from "../config/paths";
import toast from "react-hot-toast";
const clientId =
  "174418105400-tvtocprb1jfrf14t8g7lqab62i48shhb.apps.googleusercontent.com";

export default function GoogleSignIn() {
  //const { googlelogin } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { googlelogin, isPending} = useGoogleLogin();


  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      console.log("Google credential:", credentialResponse.credential);

      const data = await googlelogin(credentialResponse.credential);
      const loggedInUser = data.userResponse;

      console.log("Logged in user:", loggedInUser);
      if (!loggedInUser) return;

      if (loggedInUser?.role === "teacher" ) {
        navigate("/teacher");
      }else if (loggedInUser?.role === "admin") {
        navigate(paths.admin);
      }else {
        navigate("/student");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex items-center h-10"> {/* ✅ align with navbar buttons */}
        {loading ? (
          <span className="text-gray-700 font-medium px-4 py-2">
            Logging in...
          </span>
        ) : (
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => toast.error("Google sign-in was cancelled or failed.")}
            width="150"  // optional: control width
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}
