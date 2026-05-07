import HeaderLeftSide from "./HeaderComponents/HeaderLeftSide";
import HeaderCenter from "./HeaderComponents/HeaderCenter";
import HeaderRightSide from "./HeaderComponents/HeaderRightSide";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <nav className="h-16 flex items-center justify-between px-6">
        <HeaderLeftSide />
        <HeaderCenter />
        <HeaderRightSide />
      </nav>
    </header>
  );
};

export default Header;
