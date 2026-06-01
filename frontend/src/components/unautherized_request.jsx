import { toast } from "react-toastify";
import { clearAuth } from "../utils/tokenStorage";

export default function handleUnauthorizedRequest(navigate) {
  const countdownDuration = 1; // Countdown duration in seconds
  const message = `Unauthorized request. Redirecting to login page...`;

  // Show the message
  toast.error(message, {
    toastId: 1,
  });

  // Redirect to login page after countdown
  setTimeout(() => {
    clearAuth();
    navigate("/login");
  }, countdownDuration * 1000);
}
