import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleCta } from "@/components/landing/article-cta";
import { announcementCards, getAnnouncementBySlug } from "@/components/landing/content";
import { SiteFooter } from "@/components/landing/site-footer";

type NewsArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return announcementCards.map((item) => ({
    slug: item.slug,
  }));
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = getAnnouncementBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen text-white">
      <div className="site-shell py-10 lg:py-14">
        <div className="max-w-4xl space-y-10">
          <Link
            href="/#news"
            className="inline-flex items-center text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Back to news
          </Link>

          <article className="border-t border-white/8 pt-10">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-[0.72rem] uppercase tracking-[0.14em] text-zinc-500">
                <span>{article.category}</span>
                <span>{article.source}</span>
                <span>{article.publishedAt}</span>
                <span>{article.readTime}</span>
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl lg:text-[4.25rem] lg:leading-[0.96]">
                {article.title}
              </h1>

              <p className="max-w-3xl text-lg leading-8 text-zinc-300">{article.summary}</p>
            </div>

            <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[1.75rem] border border-white/8 bg-black">
              <Image
                src={article.imageSrc}
                alt={article.imageAlt}
                fill
                className="object-cover"
                priority
                sizes="(min-width: 1024px) 72rem, 100vw"
              />
            </div>

            <div className="mt-10 space-y-10 border-t border-white/8 pt-8">
              {article.sections.map((section) => (
                <section key={section.title} className="space-y-4">
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">{section.title}</h2>
                  <div className="space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="max-w-3xl text-base leading-8 text-zinc-400 sm:text-[1.02rem]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <ArticleCta />
          </article>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
