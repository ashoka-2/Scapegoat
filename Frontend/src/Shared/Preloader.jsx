import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const Preloader = ({ isReady = false, onComplete }) => {
    const containerRef = useRef();
    const countRef = useRef();
    const logoCharsRef = useRef([]);
    const topPanelRef = useRef();
    const bottomPanelRef = useRef();
    const [percentage, setPercentage] = useState(0);

    // Initial sequence: Count up and Logo reveal
    useEffect(() => {
        const tl = gsap.timeline();
        
        // Counter Animation
        const counter = { val: 0 };
        gsap.to(counter, {
            val: 100,
            duration: 2.5,
            ease: "power2.inOut",
            onUpdate: () => setPercentage(Math.floor(counter.val))
        });

        // Logo Characters Entrance
        tl.fromTo(logoCharsRef.current, 
            { y: 100, opacity: 0, rotateX: -90 },
            { 
                y: 0, 
                opacity: 1, 
                rotateX: 0, 
                stagger: 0.1, 
                duration: 1.2, 
                ease: "expo.out",
                delay: 0.2
            }
        );

        // Continuous floating/glitch effect while waiting
        gsap.to(logoCharsRef.current, {
            y: -10,
            duration: 2,
            repeat: -1,
            yoyo: true,
            stagger: 0.05,
            ease: "sine.inOut"
        });

    }, []);

    // Exit sequence: Shutter Reveal
    useEffect(() => {
        if (isReady && percentage === 100) {
            const exitTl = gsap.timeline({
                onComplete: onComplete
            });

            exitTl.to(countRef.current, {
                opacity: 0,
                y: -20,
                duration: 0.5,
                ease: "power2.in"
            })
            .to(logoCharsRef.current, {
                letterSpacing: "2em",
                opacity: 0,
                scale: 2,
                duration: 1,
                stagger: 0.02,
                ease: "expo.in"
            }, "-=0.3")
            .to(topPanelRef.current, {
                y: "-100%",
                duration: 1.2,
                ease: "expo.inOut"
            }, "-=0.5")
            .to(bottomPanelRef.current, {
                y: "100%",
                duration: 1.2,
                ease: "expo.inOut"
            }, "-=1.2");
        }
    }, [isReady, percentage, onComplete]);

    const logo = "SCAPEGOAT";

    return (
        <div ref={containerRef} className="fixed inset-0 z-[9999] flex flex-col justify-center items-center pointer-events-none">
            
            {/* Split Panels */}
            <div ref={topPanelRef} className="absolute top-0 left-0 w-full h-[50.5%] bg-[#0a0a0a] z-10 border-b border-white/5 shadow-2xl"></div>
            <div ref={bottomPanelRef} className="absolute bottom-0 left-0 w-full h-[50.5%] bg-[#0a0a0a] z-10 border-t border-white/5 shadow-2xl"></div>

            {/* Content Layer */}
            <div className="relative z-20 flex flex-col items-center">
                
                {/* Logo with individual char spans */}
                <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-hidden">
                    {logo.split("").map((char, i) => (
                        <span 
                            key={i} 
                            ref={el => logoCharsRef.current[i] = el}
                            className="text-[1.7rem] min-[420px]:text-3xl sm:text-6xl md:text-9xl font-black tracking-widest text-white uppercase inline-block select-none"
                            style={{ textShadow: "0 0 30px rgba(255,255,255,0.1)" }}
                        >
                            {char}
                        </span>
                    ))}
                </div>

                {/* Counter */}
                <div ref={countRef} className="flex flex-col items-center gap-4">
                    <div className="w-64 h-[2px] bg-white/10 relative overflow-hidden">
                        <div 
                            className="absolute top-0 left-0 h-full bg-accent transition-all duration-300 shadow-[0_0_15px_rgba(250,106,101,0.5)]"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl md:text-5xl font-mono font-black text-white italic">{percentage}</span>
                        <span className="text-xs font-bold text-accent tracking-[0.5em] uppercase">%</span>
                    </div>
                    <p className="text-[8px] sm:text-[9px] font-black tracking-[0.4em] sm:tracking-[0.8em] uppercase text-white/30 ml-2 whitespace-nowrap">
                        {isReady ? "Identity Verified" : "Syncing Binary Aesthetic"}
                    </p>
                </div>
            </div>

            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-accent/5 rounded-full blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[30vw] h-[30vw] bg-blue-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
        </div>
    );
};

export default Preloader;
