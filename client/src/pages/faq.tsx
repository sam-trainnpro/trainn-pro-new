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
      answer: "You can cancel your booking up to 24 hours before the scheduled class time for a full refund. Cancellations made less than 24 hours before the class will incur a 50% cancellation fee. No-shows will not receive a refund. For recurring bookings, each individual session follows the same cancellation policy."
    },
    {
      id: "communication",
      question: "How do I communicate with my coach?",
      answer: "You can communicate with your coach through several ways: view their profile page for contact information, send messages through our platform's booking system, or contact them directly using the phone number or email provided in your booking confirmation. Many coaches also provide WhatsApp or other messaging platform details for quick communication."
    },
    {
      id: "no-slots",
      question: "What happens if there are no more slots available?",
      answer: "If a class is fully booked, you can join the waitlist by clicking the 'Join Waitlist' button on the class page. You'll be automatically notified if a spot becomes available due to cancellations. You can also browse similar classes with the same coach or explore alternative time slots. We recommend booking early to secure your preferred spots."
    },
    {
      id: "refund-issues",
      question: "What happens if I didn't get a refund?",
      answer: "If you haven't received your expected refund, please check your payment method as refunds typically take 3-5 business days to process. Contact our customer support team with your booking reference number, and we'll investigate the issue immediately. We'll provide you with a tracking reference and expected resolution timeline. All eligible refunds are processed automatically according to our cancellation policy."
    },
    {
      id: "insurance",
      question: "Does your company provide insurance?",
      answer: "All classes on our platform are covered by comprehensive liability insurance for your protection. However, we strongly recommend that participants have their own personal health and accident insurance. Our coaches are required to maintain professional liability insurance. For specific coverage details or to report an incident, please contact our support team immediately."
    }
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - Frequently Asked Questions | Trainn</title>
        <meta name="description" content="Find answers to frequently asked questions about Trainn's fitness class booking platform, cancellation policies, coach communication, and more." />
        <meta property="og:title" content="FAQ - Frequently Asked Questions | Trainn" />
        <meta property="og:description" content="Get answers to common questions about booking fitness classes, cancellation policies, refunds, and insurance coverage on Trainn." />
        <meta property="og:type" content="website" />
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
                  <p className="text-muted-foreground">support@trainn.com</p>
                  <p className="text-sm text-muted-foreground">Response within 24 hours</p>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Phone Support</h4>
                  <p className="text-muted-foreground">1-800-TRAINN</p>
                  <p className="text-sm text-muted-foreground">Mon-Fri 9AM-6PM PST</p>
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