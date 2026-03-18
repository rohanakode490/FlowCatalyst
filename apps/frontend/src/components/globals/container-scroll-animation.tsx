"use client";

import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "motion/react";
import Image from "next/image";

type ContainerScrollProps = {
  titleComponent?: React.ReactNode;
  showHeader?: boolean;
  className?: string;
  contentClassName?: string;
  cardClassName?: string;
};

export const ContainerScroll = ({
  titleComponent,
  showHeader = true,
  className,
  contentClassName,
  cardClassName,
}: ContainerScrollProps) => {
  const containerRef = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start start"],
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className={`flex items-center justify-center relative ${className}`}
      ref={containerRef}
    >
      <div
        className={`w-full relative ${
          contentClassName ?? "pt-2 md:pb-10 md:pt-8"
        }`}
        style={{
          perspective: "1000px",
        }}
      >
        {showHeader && titleComponent ? (
          <Header translate={translate} titleComponent={titleComponent} />
        ) : null}
        <Card rotate={rotate} scale={scale} className={cardClassName} />
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div relative z-20 max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

// Aceternity UI component
export const Card = ({
  rotate,
  scale,
  className,
}: {
  rotate: any;
  scale: any;
  className?: string;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate, // rotate in X-axis
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className={`relative z-10 max-w-5xl mt-10 md:mt-12 mx-auto h-[30rem] md:h-[40rem] w-full p-3 sm:p-6 bg-[#222222] rounded-[30px] shadow-2xl ${
        className ?? ""
      }`}
    >
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden 
        bg-[#333333] 
        before:content-[''] before:block before:pt-[56.25%] sm:before:pt-[45%] md:before:pt-[40%]"
      >
        <Image
          src="/temp-banner.png"
          fill
          alt="bannerImage"
          priority
          quality={80}
          sizes="(max-width: 640px) 100vw,
         (max-width: 768px) 90vw,
         (max-width: 1024px) 80vw,
         75vw"
          className="object-cover"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        />
      </div>
    </motion.div>
  );
};
