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

export default function ProviderFAQPage() {
  const faqs = [
    {
      id: "commission",
      question: "How much is the platform commission?",
      answer:
        "We take a 15% commission on each class booking. The rest goes directly to you! This helps us cover payment processing, customer support, and platform improvements.",
    },
    {
      id: "cancellation-policy",
      question: "What's the class cancellation policy?",
      answer:
        "You can cancel a class anytime, but if students have already booked, we recommend giving at least 24 hours' notice. The students will get fully refunded, and no fees will be taken.",
    },
    {
      id: "duplicate-classes",
      question: "Can I duplicate classes to save time?",
      answer:
        "Yes! You can easily duplicate any class from your dashboard. Just go to your class list on My Calendar, click \"Duplicate,\" and edit the date, time, or any other details. You can also make a class recurring by checking the box in the Recurring Class field.",
    },
    {
      id: "payment-timing",
      question: "When do I get paid?",
      answer:
        "Payments are sent to your linked account within 5–7 business days after each class takes place.",
    },
    {
      id: "package-expiration",
      question: "What's the package expiration policy?",
      answer:
        "If you offer a set pack (5-class, 10-class, or 20-class packages), here's the default expiration: 5 packs expire after 60 days, 10 packs expire after 90 months and 20 packs expire after 180 days. Expiration starts from the date of purchase.",
    },
  ];
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "url": "https://trainn.pro/provider-faq",
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
        <title>Provider FAQ | Trainn Pro - For Fitness & Activity Providers</title>
        <meta
          name="description"
          content="Get answers about commissions, payments, class cancellations, duplicating classes and package policies for providers on Trainn Pro."
        />
        <link rel="canonical" href="https://trainn.pro/provider-faq" />
        <meta property="og:title" content="Provider FAQ | Trainn Pro" />
        <meta
          property="og:description"
          content="Answers to common questions for fitness and activity providers on Trainn Pro."
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
              Provider FAQ
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Common questions for fitness and activity providers about commissions, payments, class management, and platform policies.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Provider Questions</CardTitle>
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
              <CardTitle className="text-xl">Need more help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Have a provider-specific question that's not answered here? Our support team is ready to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Provider Support</h4>
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