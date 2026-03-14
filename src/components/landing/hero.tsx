"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const proofPoints = ["Set up in 60 seconds", "Connects to your systems", "Available 24/7"];

const categories = [
  {
    label: "Messaging",
    description: "Talk to your agents on the platforms you use most.",
    items: ["Slack", "WhatsApp", "Microsoft Teams"],
  },
  {
    label: "Knowledge base",
    description: "Connect to Google and Microsoft workspaces.",
    items: ["Google Workspace", "Microsoft 365", "Confluence"],
  },
  {
    label: "Privacy",
    description: "Your data stays yours. Always.",
    items: ["Data residency", "Role-based access", "Encryption at rest"],
  },
  {
    label: "Governance",
    description: "Full control over what agents can and cannot do.",
    items: ["Guardrails", "Audit trail", "Approval flows"],
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-14 pt-10 lg:pb-18 lg:pt-14">
      <div className="site-shell space-y-10 lg:space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex max-w-4xl flex-col items-center space-y-7 text-center"
        >
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[0.7rem] tracking-[0.18em] text-zinc-300">
            The agent infrastructure layer
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-[5.15rem] lg:leading-[0.94]">
              Deploy AI agents.
              <br />
              Run them everywhere.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg lg:text-[1.2rem]">
              One place to build, deploy, and govern AI agents across every channel and system your
              team already uses.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Get access</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/dashboard">See the platform</Link>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-1 text-sm text-zinc-400">
            {proofPoints.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/8 bg-white/[0.025] px-3.5 py-1.5"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2">
            {categories.map((cat) => (
              <Card
                key={cat.label}
                className="overflow-hidden rounded-[2rem] border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_30px_120px_rgba(0,0,0,0.25)]"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-white">
                    {cat.label}
                  </CardTitle>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {cat.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-xs text-zinc-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
