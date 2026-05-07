import Hero from "../../components/Hero";
import HomeAnnouncementBanner from "../../components/HomeAnnouncementBanner";
import CourseCategories from "../../components/CourseCategories";
import WhyLearn from "../../components/WhyLearn";
import Footer from "../../components/Footer";
import TeachingRequests from "../../components/TeachingRequests";

const Home = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HomeAnnouncementBanner />
      <Hero />
      <CourseCategories />
      <TeachingRequests />
      <WhyLearn />
      <Footer />
    </div>
  );
};

export default Home;
