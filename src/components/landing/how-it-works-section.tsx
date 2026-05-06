import Image from "next/image";

import { howItWorksIntro, howItWorksSteps } from "@/components/landing/content";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-black">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 pb-[100px] lg:px-20">
        <div className="flex flex-col items-center gap-[18px] pb-[60px] pt-[100px] text-center">
          <SectionEyebrow label={howItWorksIntro.kicker} />
          <h2 className="max-w-[1100px] text-3xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-[64px] lg:leading-[64px]">
            {howItWorksIntro.title}
          </h2>
          <p className="max-w-[720px] text-[15px] leading-7 text-[#b5b5bd] lg:text-[18px] lg:leading-[27px]">
            {howItWorksIntro.description}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
          {howItWorksSteps.map((step) => (
            <article
              key={step.number}
              className="flex flex-col gap-[22px] rounded-2xl border border-[#1f1f23] bg-[#0a0a0a] p-9"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[14px] bg-white">
                  <span className="text-[13px] font-bold !text-black">{step.number}</span>
                </div>
                <span className="text-[11px] font-medium tracking-[0.2em] text-[#6e6e78]">
                  {step.label}
                </span>
              </div>
              <h3 className="text-2xl font-bold leading-tight tracking-[-0.03em] text-white lg:text-[32px] lg:leading-[34px]">
                {step.title}
              </h3>
              <p className="text-[14.5px] leading-[22px] text-[#b5b5bd]">{step.description}</p>
              <StepImagePreview alt={step.imageAlt} src={step.imageSrc} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-7 bg-[#404048]" />
      <span className="text-[12px] font-medium tracking-[0.22em] text-[#6e6e78]">{label}</span>
      <span className="h-px w-7 bg-[#404048]" />
    </div>
  );
}

function StepImagePreview({ alt, src }: { alt: string; src: string }) {
  return (
    <div className="relative aspect-[1000/360] overflow-hidden rounded-[10px] border border-[#1f1f23] bg-black">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 50vw, 100vw"
      />
    </div>
  );
}
