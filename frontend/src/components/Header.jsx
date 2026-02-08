import GoogleSignIn from "./GoogleSignIn";
import HeaderLeftSide from "./HeaderComponents/HeaderLeftSide";
import HeaderCenter from "./HeaderComponents/HeaderCenter";
import { useDarkMode } from "../store/darkmode";
import HeaderRightSide from "./HeaderComponents/HeaderRightSide";

const Header = () => {
  const {darkMode} = useDarkMode();
 

  return (
    <nav className={`shadow-md sticky top-0 z-50 px-6 py-3 flex items-center justify-between ${
      darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
    }`}>
      {/* Left side */}
     <HeaderLeftSide/>

      {/* Center (Search bar) */}
     <HeaderCenter/>

      {/* Right side */}
      <HeaderRightSide/>
    </nav>
  );
};

export default Header;