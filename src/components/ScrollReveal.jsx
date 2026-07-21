import React, { useEffect, useRef, useState } from "react";

export default function ScrollReveal({
  children,
  className = "",
  direction = "up", // up, down, left, right, scale, none
  delay = 0, // ms
  duration = 800, // ms
  threshold = 0.05,
  once = true,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px", // triggers slightly before coming into view
      }
    );

    const currentRef = elementRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, once]);

  const getDirectionStyle = () => {
    switch (direction) {
      case "up":
        return "translate-y-8";
      case "down":
        return "-translate-y-8";
      case "left":
        return "translate-x-8";
      case "right":
        return "-translate-x-8";
      case "scale":
        return "scale-[0.96]";
      case "none":
      default:
        return "";
    }
  };

  const style = {
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  };

  return (
    <div
      ref={elementRef}
      style={style}
      className={`transition-all ${
        isVisible
          ? "opacity-100 translate-y-0 translate-x-0 scale-100"
          : `opacity-0 ${getDirectionStyle()}`
      } ${className}`}
    >
      {children}
    </div>
  );
}
