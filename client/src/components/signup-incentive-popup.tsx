import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/use-auth-simple";
import { X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const POPUP_DELAY_MS = 45000;
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DISMISS_TIMESTAMP_KEY = 'trainn_popup_dismissed_at';
const HAS_LOGGED_IN_KEY = 'trainn_has_logged_in';

export default function SignupIncentivePopup() {
  const { user, isLoading } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user) return;
    if (localStorage.getItem(HAS_LOGGED_IN_KEY) === 'true') return;

    const dismissedAt = localStorage.getItem(DISMISS_TIMESTAMP_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_COOLDOWN_MS) {
        return;
      }
    }

    const timer = setTimeout(() => {
      if (!localStorage.getItem(HAS_LOGGED_IN_KEY)) {
        setShowPopup(true);
      }
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [user, isLoading]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_TIMESTAMP_KEY, Date.now().toString());
    setShowPopup(false);
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close popup"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Get $5 Off Your First Class!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Create a free account today and receive $5 credit toward your first fitness, sports, or creative class.
          </p>

          <Link href="/auth?signup=true&welcome_credit=true">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
              onClick={handleDismiss}
            >
              Create Free Account
            </Button>
          </Link>

          <p className="text-xs text-gray-400 mt-4">
            No credit card required. Credit applies to any class.
          </p>
        </div>
      </div>
    </div>
  );
}
