import { Star, StarHalf } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  image: string;
  rating: number;
  comment: string;
}

export default function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Jennifer K.",
      image: "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      rating: 5,
      comment: "I've tried many fitness platforms before, but Trainn has been a game-changer. The coaches are top-notch and I love being able to work out outdoors. The booking process is seamless and I've seen amazing results!"
    },
    {
      id: 2,
      name: "Marcus T.",
      image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      rating: 5,
      comment: "As someone who travels a lot for work, Trainn has been perfect for me. I can find great workouts wherever I am, and the coaches are extremely professional. The app makes it easy to stay consistent with my fitness routine."
    },
    {
      id: 3,
      name: "Sophia L.",
      image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
      rating: 4.5,
      comment: "I joined Trainn to find strength classes, but ended up trying so many different fitness styles thanks to the variety of classes. Plus I found some great sports classes for my kids for after school and on the weekends."
    }
  ];

  // Helper to render rating stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="text-[#FFCC00] fill-[#FFCC00] h-4 w-4" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="text-[#FFCC00] fill-[#FFCC00] h-4 w-4" />);
    }
    
    return stars;
  };

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-10">What Our Members Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-[#F7F7F7] rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img 
                    src={testimonial.image} 
                    alt={`${testimonial.name} Avatar`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-3">
                  <h4 className="font-medium">{testimonial.name}</h4>
                  <div className="flex items-center">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600">{testimonial.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
