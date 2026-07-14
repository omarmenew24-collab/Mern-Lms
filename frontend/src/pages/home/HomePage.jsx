import Hero from "../../components/Hero";
import HomeStatsStrip from "../../components/HomeStatsStrip";
import AdminHomeStatsQuickToggle from "../../components/AdminHomeStatsQuickToggle";
import HomeAnnouncementBanner from "../../components/HomeAnnouncementBanner";
import CourseCategories from "../../components/CourseCategories";
import WhyLearn from "../../components/WhyLearn";
import Footer from "../../components/Footer";
import { usePublicSiteBranding } from "../../api/admin";

const Home = () => {
  const { branding } = usePublicSiteBranding();
  const showPlatformStats = branding?.homePlatformStatsEnabled !== false;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HomeAnnouncementBanner />
      <Hero />
      {showPlatformStats ? (
        <div className="relative">
          <HomeStatsStrip />
          <AdminHomeStatsQuickToggle statsVisible />
        </div>
      ) : (
        <AdminHomeStatsQuickToggle statsVisible={false} />
      )}
      <CourseCategories />
      <WhyLearn />
      <Footer />
    </div>
  );
};

export default Home;
