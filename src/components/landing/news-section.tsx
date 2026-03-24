import Image from "next/image";
import Link from "next/link";

import { announcementCards, newsIntro } from "@/components/landing/content";

export function NewsSection() {
  const stories = announcementCards.slice(0, 4);

  return (
    <section id="news" className="py-18 lg:py-30">
      <div className="site-shell border-t border-white/8 pt-14">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="app-kicker">{newsIntro.kicker}</p>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.02]">
                {newsIntro.title}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/72">{newsIntro.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stories.map((story) => (
              <Link
                key={story.slug}
                href={`/news/${story.slug}`}
                className="group block overflow-hidden border border-white/8 bg-black transition-colors hover:border-white/16"
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b border-white/8 bg-black">
                  <Image
                    src={story.imageSrc}
                    alt={story.imageAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 100vw"
                  />
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-3 text-[0.68rem] uppercase tracking-[0.14em] text-white/60">
                    <span>{story.category}</span>
                    <span>{story.source}</span>
                    <span>{story.publishedAt}</span>
                    <span>{story.readTime}</span>
                  </div>
                  <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">{story.title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/72">{story.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
