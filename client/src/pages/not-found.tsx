import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Helmet>
        <title>Page Not Found | Trainn</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="This page could not be found. Browse local classes or visit the Trainn blog." />
      </Helmet>
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            This page may have moved or is no longer available.
          </p>
          <p className="mt-4"><a href="/classes" className="text-primary underline">Browse classes</a> or <a href="/blog" className="text-primary underline">read the blog</a>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
