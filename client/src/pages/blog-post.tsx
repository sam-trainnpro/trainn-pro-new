import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Tag, ArrowLeft, User } from "lucide-react";
import Header from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "../../../hooks/use-auth-simple";
import type { BlogPost } from "@shared/schema";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  
  // Temporary fallback to prevent crashes
  let user = null;
  
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    console.log("AuthProvider not available, using fallback");
  }

  // Fetch the blog post by slug
  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-12 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back to Blog */}
          <div className="mb-6">
            <Link href="/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>

          {/* Admin Edit Button */}
          {user?.role === 'admin' && (
            <div className="mb-6">
              <Link href={`/blog/admin/edit/${post.id}`}>
                <Button variant="outline">Edit Post</Button>
              </Link>
            </div>
          )}

          <article>
            {/* Header */}
            <header className="mb-8">
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>

              {/* Meta information */}
              <div className="flex items-center gap-4 text-gray-600 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime} min read</span>
                </div>
                <span>•</span>
                <span>{format(new Date(post.publishedAt!), 'MMMM d, yyyy')}</span>
                {post.status !== 'published' && (
                  <>
                    <span>•</span>
                    <Badge variant="outline">{post.status}</Badge>
                  </>
                )}
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl text-gray-600 mt-4 leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </header>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="mb-8">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br>') }}
              />
            </div>
          </article>

          {/* Call to Action */}
          <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Start Your Fitness Journey?
              </h3>
              <p className="text-gray-600 mb-6">
                Join thousands of others who are transforming their lives with Trainn's expert coaches and classes.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/classes">
                  <Button size="lg">Browse Classes</Button>
                </Link>
                <Link href="/coaches">
                  <Button variant="outline" size="lg">Find Coaches</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Related Posts Section - Placeholder for future enhancement */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Continue Reading</h3>
            <div className="text-center py-8 text-gray-500">
              <Link href="/blog">
                <Button variant="outline">View All Blog Posts</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}