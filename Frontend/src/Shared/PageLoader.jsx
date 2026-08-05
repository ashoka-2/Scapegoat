import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const GSAPLoader = () => {
    const ringRef = useRef(null);
    const dotsRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Main rotating ring
            gsap.to(ringRef.current, {
                rotation: 360,
                duration: 2,
                repeat: -1,
                ease: "none"
            });

            // Pulsing dots stagger
            gsap.to(".loading-dot", {
                scale: 1.5,
                opacity: 0.5,
                duration: 0.8,
                repeat: -1,
                yoyo: true,
                stagger: {
                    each: 0.2,
                    repeat: -1
                }
            });
        });
        return () => ctx.revert();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-8">
            <div className="relative">
                {/* Outer decorative ring */}
                <div 
                    ref={ringRef}
                    className="w-20 h-20 border-t-2 border-b-2 border-accent border-l-transparent border-r-transparent rounded-full opacity-20"
                />
                
                {/* Inner pulsing logo/icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center animate-pulse">
                        <i className="ri-shining-line text-accent text-2xl" />
                    </div>
                </div>
            </div>

            {/* GSAP Stagger Dots */}
            <div ref={dotsRef} className="flex gap-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="loading-dot w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                ))}
            </div>
            
            <p className="text-[10px] font-black tracking-[0.5em] uppercase text-foreground/20 animate-pulse">
                Synchronizing
            </p>
        </div>
    );
};

const PageLoader = ({ skeleton: Skeleton, ...props }) => {
    // If a specific skeleton component is passed, render it
    if (Skeleton) {
        return <Skeleton {...props} />;
    }

    // Otherwise, fallback to the premium GSAP loader
    return <GSAPLoader />;
};

export default PageLoader;
