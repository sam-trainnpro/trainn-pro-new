import { Helmet } from "react-helmet";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FAQPage() {
  const faqs = [
    {
      id: "booking",
      question: "How do I book a class?",
      answer:
        "You can browse classes by category, location, or date. Once you find a class you like, click \"Book Now\", choose your number of spots, and complete payment — it's that easy!",
    },
    {
      id: "book-for-friend",
      question: "Can I book for a friend too?",
      answer:
        "Yes! You can reserve multiple spots in a class. Just adjust the quantity when booking. Some providers even offer promo codes for group bookings!",
    },
    {
      id: "class-details-after-booking",
      question: "Where can I find my class details after booking?",
      answer:
        "Once booked, your class details will appear under \"My Bookings\" in your account. You'll also get a confirmation email with all the info you need.",
    },
    {
      id: "provider-cancellation",
      question: "What if a class gets canceled by the provider?",
      answer:
        "If a provider cancels a class, you'll be notified automatically and issued a full refund — no action needed on your part.",
    },
    {
      id: "promo-codes",
      question: "How do promo codes work?",
      answer:
        "Promo codes can be entered at checkout. Some codes apply only to:\n• Specific classes or providers\n• Group bookings (e.g., 2+ spots)\n• First-time users",
    },
    {
      id: "packages",
      question: "What are class packages, and how do they work?",
      answer:
        "Packages let you buy multiple classes upfront (e.g., 5, 10, or 20 classes) at a discount. You can apply your credits to future bookings with that provider.",
    },
    {
      id: "package-expiration",
      question: "Do class packages expire?",
      answer:
        "Yes. Each package comes with an expiration:\n• 5-class: 60 days\n• 10-class: 90 days\n• 20-class: 180 days\n\n(Note expiration period starts from the purchase date.)",
    },
    {
      id: "charging",
      question: "When do I get charged?",
      answer:
        "You're charged at the time of booking. For packages, you're charged once upfront, and you can redeem class credits later.",
    },
    {
      id: "support-contact",
      question: "Who do I contact if something goes wrong?",
      answer:
        "If you have any issues with a booking, class, or provider, just reach out to us via support@trainn.pro, and we'll take care of it. Expect response within 24 hours.",
    },
    {
      id: "cancellation",
      question: "What is your cancellation policy?",
      answer:
        "You can cancel your booking up to 24 hours before the scheduled class time for a full refund. Cancellations made less than 24 hours before the class will not receive a refund. No-shows will not receive a refund. For recurring bookings, each individual session follows the same cancellation policy. To cancel your booking, please log in to your account and navigate to your bookings and click the Cancel button.",
    },
    {
      id: "no-slots",
      question: "What happens if there are no more slots available?",
      answer:
        "If a class is fully booked, you can join the waitlist by clicking the 'Join Waitlist' button on the class page (feature pending). You'll be automatically notified if a spot becomes available due to cancellations. You can also browse similar classes with the same coach or explore alternative time slots. We recommend booking early to secure your preferred spots.",
    },
    {
      id: "refund-issues",
      question: "What happens if I didn't get a refund?",
      answer:
        "If you haven't received your expected refund, please check your payment method as refunds typically take 3-5 business days to process. Contact our customer support team (support@trainn.pro) with your booking information (class, date, price), and we'll investigate the issue immediately. We'll provide you with an expected resolution timeline.",
    },
    {
      id: "insurance",
      question: "Does your company provide insurance?",
      answer:
        "We recommend that participants have their own personal health and accident insurance. Our providers are expected and encouraged to maintain professional liability insurance.",
    },
  ];
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "url": "https://trainn.pro/faq",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer,
      },
    })),
  };

  return (
    <>
      <Helmet>
        <title>Trainn Pro FAQ | Classes, Coaches & Booking Questions</title>
        <meta
          name="description"
          content="Get answers to booking classes, cancellations, refunds, insurance, waitlists and more on Trainn Pro."
        />
        <link rel="canonical" href="https://trainn.pro/faq" />
        <meta property="og:title" content="Trainn Pro FAQ" />
        <meta
          property="og:description"
          content="Answers to common questions about Trainn Pro classes, cancellations, refunds and more."
        />
        <meta property="og:type" content="website" />

        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about booking classes, cancellation policies, and using our platform.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Common Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left text-lg font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-2">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Still have questions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Email Support</h4>
                  <p className="text-muted-foreground">support@trainn.pro</p>
                  <p className="text-sm text-muted-foreground">
                    Response within 24 hours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}
