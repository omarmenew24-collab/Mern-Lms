import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import HeaderLeftSide from "./HeaderComponents/HeaderLeftSide";
import HeaderCenter from "./HeaderComponents/HeaderCenter";
import HeaderRightSide from "./HeaderComponents/HeaderRightSide";
import MobileNav from "./HeaderComponents/MobileNav";

const Header = () => {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <nav className="h-16 flex items-center justify-between gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={t("nav.openMenu")}
          className="md:hidden shrink-0 -ms-1 rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <HeaderLeftSide />
        <HeaderCenter />
        <HeaderRightSide />
      </nav>

      <MobileNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
};

export default Header;
