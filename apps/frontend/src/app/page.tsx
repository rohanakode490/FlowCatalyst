import React from "react";
import Navbar from "@/components/globals/navbar";
import { ContainerScroll } from "@/components/globals/container-scroll-animation";
import { Button } from "@/components/ui/button";
import { InfiniteMovingCards } from "@/components/globals/infinite-moving-cards";
import { Integrations } from "@/lib/constant";
import { Footer } from "@/components/footer/footer";
import { Pricing } from "@/components/pricing/pricing-component";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black [background:radial-gradient(125%_125%_at_50%_10%,#000_35%,#223_100%)] bg-fixed">
      <Navbar />

      {/* Banner  */}
      <section className="w-full !overflow-visible relative antialiased">
        <div className="relative w-full">
          <div className="container px-4 pt-24 pb-10 md:pt-28 md:pb-16">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="flex flex-col items-start">
                <Button
                  size={"lg"}
                  className="p-8 text-2xl w-full sm:w-fit border-t-2 rounded-full border-[#4D4D4D] bg-[#1F1F1F] hover:bg-white group transition-all flex items-center justify-center gap-4 hover:shadow-xl hover:shadow-neutral-500 duration-500"
                  asChild
                >
                  <Link href="/login">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-500 to-neutral-600 md:text-center font-sans group-hover:bg-gradient-to-r group-hover:from-black goup-hover:to-black">
                      Start For Free Today
                    </span>
                  </Link>
                </Button>

                <h1 className="mt-8 text-5xl md:text-7xl lg:text-6xl xl:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-600 font-sans font-bold">
                  Automate Your Work With Flowentis
                </h1>

                <p className="mt-6 max-w-2xl text-neutral-300/90 text-lg md:text-xl leading-relaxed">
                  Flowentis is a visual automation platform that lets you
                  connect tools like GitHub, Google Sheets, and Email to handle
                  your repetitive tasks in minutes. Build custom workflows that
                  run silently in the background, keeping your data in sync and
                  your focus where it matters most.
                </p>
              </div>

              <div className="lg:justify-self-end w-full">
                <div className="relative w-full max-w-2xl mx-auto lg:mx-0 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src="/app-preview.gif"
                      alt="Flowentis app preview"
                      fill
                      unoptimized
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container px-4 py-10 md:py-14">
          <ContainerScroll
            showHeader={false}
            className="h-[42rem] md:h-[52rem] p-0"
            cardClassName="mt-0"
          />
        </div>
      </section>

      <section>
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center">
            Popular Integrations
          </h2>

          <InfiniteMovingCards
            items={Integrations}
            direction="right"
            speed="normal"
          />
        </div>
      </section>

      <section>
        <Pricing />
      </section>
      <Footer />
    </main>
  );
}
