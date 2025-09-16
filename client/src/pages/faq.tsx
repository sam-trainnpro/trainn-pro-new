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

  // 🔽 ADD: build FAQPage JSON-LD from your faqs array
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
        {/* You can keep your current SEO or replace with your sheet’s copy */}
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

        {/* 🔽 ADD: inject JSON-LD */}
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
