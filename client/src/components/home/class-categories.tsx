import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ClassCategory } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClassCategories() {
  const { data: categories, isLoading, error } = useQuery<ClassCategory[]>({
    queryKey: ['/api/categories'],
  });
  
  return (
    <section className="py-8 md:py-12 bg-[#F7F7F7]">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-heading font-bold mb-6">Explore Class Types</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>Error loading categories. Please try again later.</p>
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/classes?category=${category.id}`}>
                <div className="group rounded-xl overflow-hidden relative h-40 cursor-pointer">
                  <img 
                    src={category.image || `https://source.unsplash.com/random/600x400/?fitness,${category.name}`} 
                    alt={category.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-4">
                    <h3 className="text-white font-heading font-bold text-lg">{category.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No categories available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
