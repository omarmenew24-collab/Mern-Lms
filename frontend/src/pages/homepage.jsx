import { useEffect, useState } from "react";
import {  Link } from "react-router-dom";
import Navbar from "../components/Header";
import { PlusCircle } from "lucide-react";
import { useDarkMode } from "../store/darkmode";
import Hero from "../components/Hero";
import CourseCategories from "../components/CourseCategories";
import WhyLearn from "../components/WhyLearn";
import Footer from "../components/Footer";
import TeachingRequests from "../components/TeachingRequests";

const Home = () => {
  const { darkMode} = useDarkMode();


  // Fetch logged-in user
  /* useEffect(() => {
          const getUser = async () => {
            const currentUser = await fetchUser();
            setUser(currentUser);
          };
          getUser();
        }, [fetchUser]);
      
   */
  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50"
      }`}
    >
      <Hero />

      <CourseCategories />

      <TeachingRequests />

      <WhyLearn />
      
      <Footer/>
  
    </div>
  );
};

export default Home;
