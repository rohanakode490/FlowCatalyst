import React from "react";
import Navbar from "@/components/globals/navbar";
import { ContainerScroll } from "@/components/globals/container-scroll-animation";
import { Button } from "@/components/ui/button";
import { InfiniteMovingCards } from "@/components/globals/infinite-moving-cards";
import { Integrations } from "@/lib/constant";
import { Footer } from "@/components/footer/footer";
import { Pricing } from "@/components/pricing/pricing-component";

export default function Home() {
  return (
    <main className="bg-[#181825]">
      <Navbar />

      {/* Banner  */}
      <section className="h-screen w-full bg-neutral-950 rounded-md !overflow-visible relative flex flex-col items-center antialiased">
        <div className="absolute inset-0 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_35%,#223_100%)]">
          <div className="flex flex-col mt-[-100px] md:mt-[-50px]">
            {/* Banner Image  */}
            <ContainerScroll
              titleComponent={
                <div className="flex items-center justify-center flex-col">
                  <Button
                    size={"lg"}
                    className="p-8 mb-8 md:mb-0 text-2xl w-full sm:w-fit border-t-2 rounded-full border-[#4D4D4D] bg-[#1F1F1F] hover:bg-white group transition-all flex items-center justify-center gap-4 hover:shadow-xl hover:shadow-neutral-500 duration-500"
                  >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-500 to-neutral-600  md:text-center font-sans group-hover:bg-gradient-to-r group-hover:from-black goup-hover:to-black">
                      Start For Free Today
                    </span>
                  </Button>

                  <h1 className="text-5xl md:text-8xl md:pb-[50px] bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-600 font-sans font-bold">
                    Automate Your Work With FlowCatalyst
                  </h1>
                </div>
              }
            />
          </div>
        </div>
      </section>
      <section className="pt-24 md:mt-[27rem] mt-7">
        <div className="container px-4 py-4">
          <h2 className="text-3xl font-bold text-center">
            Popular Integrations
          </h2>

          <InfiniteMovingCards
            className="mt-[-15px]"
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
