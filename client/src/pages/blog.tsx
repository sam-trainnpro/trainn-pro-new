import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Tag, User } from "lucide-react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../../hooks/use-auth-simple";
import type { BlogPost } from "@shared/schema";

export default function BlogPage() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Temporary fallback to prevent crashes
  let user = null;
  
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (error) {
    console.log("AuthProvider not available, using fallback");
  }

  // Fetch published blog posts
  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
    enabled: true,
  });

  // Get all unique tags from posts
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags || [])));

  // Filter posts by selected tag
  const filteredPosts = selectedTag 
    ? posts.filter(post => post.tags?.includes(selectedTag))
    : posts;

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trainn Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Expert fitness tips, sports drills, music and art guides, and inspiring stories from the Trainn community
          </p>
          
          {/* Admin Create Post Button */}
          {user?.role === 'admin' && (
            <div className="mt-6">
              <Link href="/blog/admin">
                <Button>Manage Blog Posts</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Filter by Topic</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All Posts
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {selectedTag ? `No posts found for "${selectedTag}"` : "No blog posts yet"}
            </h3>
            <p className="text-gray-500">
              {selectedTag ? "Try selecting a different topic or view all posts." : "Check back soon for our latest fitness tips and guides!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <Card key={post.id} className="group hover:shadow-lg transition-shadow duration-300">
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="overflow-hidden rounded-t-lg">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime} min read</span>
                    <span>•</span>
                    <span>{format(new Date(post.publishedAt!), 'MMM d, yyyy')}</span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  
                  {post.excerpt && (
                    <p className="text-gray-600 line-clamp-3 text-sm">
                      {post.excerpt}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent>
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="outline" className="w-full">
                      Read More
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}