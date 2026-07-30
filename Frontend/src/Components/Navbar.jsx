import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import { useAuth } from '../Features/auth/Hooks/useAuth';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const appName = "ScapeGoat";

const Navbar = ({ toggleTheme, isDarkMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const menuRef = useRef();
  const menuItemsRef = useRef([]);
  const profileWrapperRef = useRef();
  const profileDropdownRef = useRef();

  const { user } = useSelector((state) => state.auth);
  const { handleLogout } = useAuth();

  const tl = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileWrapperRef.current && !profileWrapperRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useGSAP(() => {
    if (profileDropdownRef.current) {
      if (profileMenuOpen) {
        gsap.to(profileDropdownRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: "back.out(1.5)",
          display: "block"
        });
      } else {
        gsap.to(profileDropdownRef.current, {
          opacity: 0,
          y: 10,
          scale: 0.95,
          duration: 0.3,
          ease: "power2.in",
          display: "none"
        });
      }
    }
  }, [profileMenuOpen]);

  // GSAP Animations for Full Screen Immersive Menu
  useGSAP(() => {
    tl.current = gsap.timeline({ paused: true })
      .to(menuRef.current, {
        display: 'flex',
        clipPath: 'circle(150% at 100% 0%)',
        duration: 1.2,
        ease: 'expo.inOut'
      })
      .fromTo(menuItemsRef.current,
        { y: 80, opacity: 0, skewY: 5 },
        { y: 0, opacity: 1, skewY: 0, duration: 0.8, stagger: 0.1, ease: 'power4.out' },
        "-=0.6"
      );
  }, { scope: menuRef });

  useEffect(() => {
    if (mobileMenuOpen) {
      tl.current?.play();
      document.body.style.overflow = 'hidden';
    } else {
      tl.current?.reverse();
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const controlNavbar = () => {
      // Don't hide navbar if menu is open
      if (mobileMenuOpen) {
        setIsVisible(true);
        return;
      }

      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;

        // At top check
        setIsScrolled(currentScrollY > 20);

        // Visibility Logic (Hide on scroll down, Show on scroll up)
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }

        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY, mobileMenuOpen]);

  const menuLinks = [
    { id: '01', name: 'Shop All', path: '/shop', desc: 'Latest products' },
    { id: '02', name: 'Categories', path: '/shop', desc: 'Sort by categories' },
    { id: '03', name: 'About Us', path: '/about', desc: 'Identity' },
    { id: '04', name: 'Contact Us', path: '/contact', desc: 'Contact Us' },
  ];

  const navLinks = [
    { name: 'Shop', path: '/shop' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[1000] px-6 md:px-12 py-4 flex items-center justify-between transition-all duration-700 ease-in-out transform ${isVisible ? 'translate-y-0' : '-translate-y-full'} ${isScrolled ? 'bg-background/50 backdrop-blur-2xl border-b border-border-theme/50 shadow-2xl py-3' : 'bg-transparent'}`}
      >
        <div className="hidden md:flex gap-10">
          {navLinks.map((link, index) => (
            <Link key={index} to={link.path} className="hover:text-accent transition-all hover:translate-y-[-2px] font-black tracking-[0.2em] uppercase text-[10px]">
              {link.name}
            </Link>
          ))}
        </div>

        {/* Circle Reveal Trigger */}
        <button
          className="md:hidden z-[2001] w-12 h-12 rounded-full border border-border-theme/50 bg-background/50 backdrop-blur-md flex items-center justify-center group active:scale-90 transition-all shadow-xl"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <div className="flex flex-col gap-1.5 items-end">
            <span className={`h-[1.5px] bg-foreground transition-all duration-500 ${mobileMenuOpen ? 'w-5 rotate-45 translate-y-[7.5px]' : 'w-5'}`}></span>
            <span className={`h-[1.5px] bg-foreground transition-all duration-300 ${mobileMenuOpen ? 'w-0 opacity-0' : 'w-3'}`}></span>
            <span className={`h-[1.5px] bg-foreground transition-all duration-500 ${mobileMenuOpen ? 'w-5 -rotate-45 -translate-y-[7.5px]' : 'w-5'}`}></span>
          </div>
        </button>

        {/* Brand Logo */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-2xl md:text-2xl font-[800] tracking-[0.1em] uppercase text-foreground hover:text-accent transition-all duration-500 hover:scale-105 active:scale-95">
          {appName}
        </Link>

        <div className="flex items-center gap-2 lg:gap-5">
          <button
            onClick={toggleTheme}
            className="hidden md:flex hover:text-accent transition-all hover:rotate-90 p-2 text-foreground items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/30"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <i className="ri-sun-fill text-xl"></i> : <i className="ri-moon-fill text-xl"></i>}
          </button>

          {user ? (
            <div className="relative hidden md:block" ref={profileWrapperRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-accent transition-all shadow-lg active:scale-95"
              >
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              </button>
              
              <div 
                ref={profileDropdownRef}
                className="absolute top-[calc(100%+24px)] right-0 w-72 bg-background/80 backdrop-blur-3xl border border-border-theme/40 rounded-[28px] shadow-[0_40px_80px_rgba(0,0,0,0.5)] py-4 z-50 overflow-hidden"
                style={{ opacity: 0, display: 'none', transform: 'translateY(10px) scale(0.95)' }}
              >
                {/* Premium Header */}
                <div className="px-6 py-4 border-b border-border-theme/20 mb-2 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-border-theme/50 shadow-inner">
                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover"/>
                  </div>
                  <div>
                    <p className="font-black text-lg truncate leading-tight">{user.fullname}</p>
                    <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">Verified User</p>
                  </div>
                </div>
                
                <div className="px-3 gap-1 flex flex-col">
                  <Link to="/profile" onClick={() => setProfileMenuOpen(false)} className="group flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-accent/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-variant/30 flex items-center justify-center group-hover:bg-accent group-hover:text-accent-content transition-all">
                        <i className="ri-user-line text-lg"></i>
                      </div>
                      <span className="font-bold text-sm group-hover:text-accent transition-all">My Profile</span>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all"></i>
                  </Link>

                  <Link to="/wishlist" onClick={() => setProfileMenuOpen(false)} className="group flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-accent/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-variant/30 flex items-center justify-center group-hover:bg-accent group-hover:text-accent-content transition-all">
                        <i className="ri-heart-line text-lg"></i>
                      </div>
                      <span className="font-bold text-sm group-hover:text-accent transition-all">My Wishlist</span>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all"></i>
                  </Link>
                  
                  <Link to="/orders" onClick={() => setProfileMenuOpen(false)} className="group flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-accent/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-variant/30 flex items-center justify-center group-hover:bg-accent group-hover:text-accent-content transition-all">
                        <i className="ri-shopping-cart-line text-lg"></i>
                      </div>
                      <span className="font-bold text-sm group-hover:text-accent transition-all">My Orders</span>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all"></i>
                  </Link>

                  {(user?.role === 'seller' || user?.role === 'admin') && (
                    <Link to="/seller/dashboard" onClick={() => setProfileMenuOpen(false)} className="group flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-accent/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-variant/30 flex items-center justify-center group-hover:bg-accent group-hover:text-accent-content transition-all">
                          <i className="ri-store-2-line text-lg"></i>
                        </div>
                        <span className="font-bold text-sm group-hover:text-accent transition-all">Seller Panel</span>
                      </div>
                      <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all"></i>
                    </Link>
                  )}

                  {user?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setProfileMenuOpen(false)} className="group flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-accent/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-variant/30 flex items-center justify-center group-hover:bg-accent group-hover:text-accent-content transition-all">
                          <i className="ri-shield-flash-line text-lg"></i>
                        </div>
                        <span className="font-bold text-sm group-hover:text-accent transition-all">Admin Control</span>
                      </div>
                      <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all"></i>
                    </Link>
                  )}
                </div>

                <div className="px-3 mt-4 pt-3 border-t border-border-theme/20">
                  <button 
                    onClick={() => { setProfileMenuOpen(false); handleLogout(); }} 
                    className="w-full group flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-red-500/10 transition-all"
                  >
                    <div className="flex items-center gap-3 text-red-500">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                        <i className="ri-logout-circle-line text-lg"></i>
                      </div>
                      <span className="font-bold text-sm tracking-widest uppercase">Logout</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="hidden md:flex items-center gap-2 px-8 py-2.5 bg-foreground text-background dark:bg-accent dark:text-accent-content rounded-full font-black hover:scale-105 active:scale-95 transition-all text-[10px] tracking-[0.3em] shadow-xl">LOGIN</Link>
          )}

          <button 
            
            className="flex items-center gap-2 border-2 border-accent text-accent dark:text-accent-content bg-accent/5 dark:bg-accent rounded-full pl-2 pr-5 py-2 hover:bg-accent hover:text-accent-content transition-all group font-black shadow-lg"
          >
            <i className="ri-shopping-bag-3-fill text-sm"></i>
            <span className="text-xs tracking-widest leading-none">
            </span>
          </button>
        </div>

      </nav>

      {/* Full Screen Immersive Menu */}
      <div
        ref={menuRef}
        className="fixed inset-0 bg-background z-[1500] hidden flex-col justify-center px-8 sm:px-24 overflow-hidden"
        style={{ clipPath: 'circle(0% at 100% 0%)' }}
      >
        {/* Close Button & Mobile Controls */}
        <div className="absolute top-4 left-6 right-6 md:right-12 flex items-center justify-between z-50">
          {/* Mobile Theme & Profile */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="hover:text-accent transition-all hover:rotate-90 p-2 text-foreground flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/30"
            >
              {isDarkMode ? <i className="ri-sun-fill text-xl"></i> : <i className="ri-moon-fill text-xl"></i>}
            </button>
            {user ? (
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-accent transition-all shadow-lg">
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              </Link>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-4 py-1.5 bg-foreground text-background dark:bg-accent dark:text-accent-content rounded-full font-black text-[10px] tracking-[0.3em]">LOGIN</Link>
            )}
          </div>

          {/* Mobile Menu Close Button */}
          <button
            className="w-12 h-12 ml-auto rounded-full border border-border-theme/50 bg-background/50 backdrop-blur-md flex items-center justify-center group active:scale-90 transition-all shadow-xl"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Menu"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <span className="absolute w-full h-[1.5px] bg-foreground rotate-45 transform transition-transform group-hover:rotate-90 duration-300"></span>
              <span className="absolute w-full h-[1.5px] bg-foreground -rotate-45 transform transition-transform group-hover:-rotate-90 duration-300"></span>
            </div>
          </button>
        </div>

        {/* Subtle Brand Watermark Background */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none">
          <h1 className="text-[20vw] font-black tracking-tighter">{appName.toUpperCase()}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full items-center gap-12 relative z-10 w-full mt-10 md:mt-0">
          <div className="flex flex-col gap-6 sm:gap-10">
            <div className="md:hidden lg:flex items-center gap-4 mb-4 sm:mb-8 opacity-60">
              <span className="w-8 h-[1px] bg-accent"></span>
              <p className="text-[10px] font-black tracking-[0.6em] uppercase text-gray-500">Digital Navigation</p>
            </div>
            {menuLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                ref={el => menuItemsRef.current[index] = el}
                className="group relative flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 opacity-0"
              >
                <div className="flex items-center gap-4 sm:gap-6 w-full border-b border-border-theme/10 sm:border-transparent pb-3 sm:pb-0">
                  <span className="text-[10px] sm:text-xs font-bold text-accent font-mono tracking-widest">{link.id}</span>
                  <div className="overflow-hidden flex-1 flex justify-between items-center group-hover:pl-2 sm:group-hover:pl-0 transition-all duration-500">
                    <h2 className="text-4xl sm:text-8xl font-black tracking-tighter group-hover:text-accent transition-all duration-500 group-hover:italic md:group-hover:translate-x-4">
                      {link.name.toUpperCase()}
                    </h2>
                    <i className="ri-arrow-right-up-line text-2xl text-border-theme/40 sm:hidden group-hover:text-accent group-hover:rotate-45 transition-all duration-500"></i>
                  </div>
                </div>
                <div className="hidden lg:block absolute left-full ml-12 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 mt-3 sm:mt-0">
                  <p className="text-xs uppercase tracking-[0.3em] font-bold text-gray-500">{link.desc}</p>
                  <div className="w-12 h-[2px] bg-accent mt-2"></div>
                </div>
              </Link>
            ))}
          </div>

          {/* Contact & Socials (Visible on Large Screens) */}
          <div className="hidden lg:flex flex-col gap-16 border-l border-border-theme/30 pl-24">
            <div ref={el => menuItemsRef.current[menuLinks.length] = el} className="opacity-0 space-y-6">
              <p className="text-[9px] font-black tracking-[0.6em] uppercase text-gray-400">Collaborate</p>
              <p className="text-3xl font-black block hover:text-accent transition-colors cursor-pointer tracking-tighter">hello@{appName.toLowerCase()}.co</p>
              <p className="max-w-xs text-xs text-gray-500 leading-relaxed italic uppercase tracking-wider">Redefining the binary boundary between tech and style.</p>
            </div>

            <div ref={el => menuItemsRef.current[menuLinks.length + 1] = el} className="opacity-0 space-y-8">
              <p className="text-[9px] font-black tracking-[0.6em] uppercase text-gray-400">Socials</p>
              <div className="flex flex-col gap-5 text-sm font-black uppercase tracking-[0.3em]">
                <a href="#" className="hover:text-accent transition-all flex items-center gap-4 group">
                  <span className="w-6 h-[1px] bg-gray-500 group-hover:w-12 group-hover:bg-accent transition-all"></span>
                  Instagram
                </a>
                <a href="#" className="hover:text-accent transition-all flex items-center gap-4 group">
                  <span className="w-6 h-[1px] bg-gray-500 group-hover:w-12 group-hover:bg-accent transition-all"></span>
                  X.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Footer */}
        <div ref={el => menuItemsRef.current[menuLinks.length + 2] = el} className="mt-auto py-12 flex justify-between items-end border-t border-border-theme/30 opacity-0 relative z-10 w-full">
          <div className="flex gap-12">
            {user && (
              <button onClick={handleLogout} className="text-xl font-black group flex flex-col items-start hover:text-accent transition-all">
                <span className="text-[8px] text-accent tracking-widest font-black uppercase mb-1 opacity-0 group-hover:opacity-100 transition-all text-left">Secure</span>
                <span className="group-hover:tracking-widest transition-all">LOGOUT </span>
              </button>
            )}
          </div>
          <div className="text-right uppercase space-y-1 sm:space-y-2">
            <p className="text-[8px] font-bold text-gray-500 tracking-[0.2em] sm:tracking-[0.4em] block">London • Mumbai • Tokyo • Paris</p>
            <p className="text-[9px] font-black tracking-[0.3em] sm:tracking-[0.5em] text-accent">© 2026 {appName.toUpperCase()} ® BINARY FASHION</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
