import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "../../../hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Copy, MessageCircle, Send } from "lucide-react";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  // Get user's referral code
  const { data: referralData } = useQuery({
    queryKey: ['/api/referrals/my-code'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/referrals/my-code');
      return response.json();
    },
    enabled: isOpen
  });

  const referralCode = referralData?.referralCode;
  const referralLink = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : '';
  
  const shareMessage = `Hey! I want to invite you to try Trainn with a $10 discount on your first paid class. Trainn builds stronger communities through fitness, creativity, and play. Use my referral link: ${referralLink}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link copied!",
        description: "Referral link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    setIsSharing(true);
    let shareUrl = '';

    switch (platform) {
      case 'messages':
        // SMS link
        shareUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'messenger':
        shareUrl = `https://m.me/?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'share':
        // Use Web Share API if available
        if (navigator.share) {
          navigator.share({
            title: 'Join Trainn with $10 off!',
            text: shareMessage,
            url: referralLink,
          }).catch(console.error);
          setIsSharing(false);
          return;
        }
        // Fallback to copy link
        handleCopyLink();
        setIsSharing(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    
    setTimeout(() => setIsSharing(false), 1000);
  };

  if (!referralCode) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            Refer a friend and get $5
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FF6B6B">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
            </svg>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3 text-sm text-gray-600">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-coral-500 font-bold mt-0.5">•</span>
                <span>Give your friend $10 off their first class</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-coral-500 font-bold mt-0.5">•</span>
                <span>Have your friend complete the class</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-coral-500 font-bold mt-0.5">•</span>
                <span>Receive $5 off your next class booking</span>
              </li>
            </ul>
          </div>

          {/* Share Options - All in a Row */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-center text-gray-700">Share with friends:</p>
            <div className="flex justify-center items-center gap-1 mx-auto max-w-xs">
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-2 hover:bg-green-50 border-0"
                onClick={() => handleShare('messages')}
                disabled={isSharing}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#34C759">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5 13h-4l-2 2v-2H7v-8h10v8z"/>
                </svg>
                <span className="text-xs text-gray-600">Messages</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-2 hover:bg-green-50 border-0"
                onClick={() => handleShare('whatsapp')}
                disabled={isSharing}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span className="text-xs text-gray-600">WhatsApp</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-2 hover:bg-blue-50 border-0"
                onClick={() => handleShare('messenger')}
                disabled={isSharing}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0084FF">
                  <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.13 3.26L19.764 8l-6.573 6.963z"/>
                </svg>
                <span className="text-xs text-gray-600">Messenger</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-2 hover:bg-gray-50 border-0"
                onClick={handleCopyLink}
                disabled={isSharing}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#6B7280">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                <span className="text-xs text-gray-600">Copy Link</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-1 h-auto py-2 px-2 hover:bg-gray-50 border-0"
                onClick={() => handleShare('share')}
                disabled={isSharing}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16,6 12,2 8,6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span className="text-xs text-gray-600">Share</span>
              </Button>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center">
            Limited time offer. T&Cs apply.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}