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
  const referralLink = referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : '';
  
  const shareMessage = `Hey! I want to invite you to try Trainn with a $5 discount on your first paid class. Trainn builds stronger communities through fitness, creativity, and play. Use my referral link: ${referralLink}`;

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
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'messenger':
        shareUrl = `https://m.me/?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'share':
        // Use Web Share API if available
        if (navigator.share) {
          navigator.share({
            title: 'Join Trainn with $5 off!',
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
          <DialogTitle className="text-xl font-bold text-center">
            Refer a friend and get $5
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Benefits */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-coral-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Give your friend $5 off their first class</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-coral-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Have your friend complete the class</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-coral-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Receive $5 off your next class booking</span>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center">
            Limited time offer. T&Cs apply.
          </p>

          {/* Share Options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-3"
              onClick={() => handleShare('messages')}
              disabled={isSharing}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">Messages</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-3"
              onClick={() => handleShare('whatsapp')}
              disabled={isSharing}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span className="text-xs">WhatsApp</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-3"
              onClick={() => handleShare('messenger')}
              disabled={isSharing}
            >
              <Send className="h-5 w-5" />
              <span className="text-xs">Messenger</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-3"
              onClick={handleCopyLink}
              disabled={isSharing}
            >
              <Copy className="h-5 w-5" />
              <span className="text-xs">Copy Link</span>
            </Button>
          </div>

          {/* Share button for mobile native share */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => handleShare('share')}
            disabled={isSharing}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16,6 12,2 8,6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Share
          </Button>
          
          {/* Your referral code display */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Your referral code:</p>
            <p className="font-mono text-sm font-semibold">{referralCode}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}