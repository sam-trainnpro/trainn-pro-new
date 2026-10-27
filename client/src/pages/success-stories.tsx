import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import PageMetadata from "@/components/page-metadata";

export default function SuccessStories() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageMetadata page="/success-stories" />
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-600 mb-4">
            Coming Soon
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Provider Success Stories
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            We haven't published documented provider case studies yet. This page
            will feature provider experiences when we can share attributable
            stories and explain the basis for any results.
          </p>
          <p className="text-gray-600 mb-8">
            In the meantime, learn about Trainn's provider platform or contact our
            team with questions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/provider-landing" className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition">
              Explore the Provider Platform
            </Link>
            <Link href="/contact" className="inline-block border border-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
