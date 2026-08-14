import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../header/Header";
import SideBar from "../sidebar/SideBar";
import Footer from "../footer/Footer";
import "../index.css";

const MOBILE_SIDEBAR_BREAKPOINT = 1001;

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((open) => !open);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_SIDEBAR_BREAKPOINT) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isSidebarOpen]);

  return (
    <>
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="body_section">
        <SideBar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <div className="main_section">
          <Outlet />
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Layout;
