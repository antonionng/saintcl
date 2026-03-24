import { companyRoles } from "@/components/landing/content";

export function UseCaseGrid() {
  return (
    <section id="teams" className="py-18 lg:py-30">
      <div className="site-shell border-t border-white/8 pt-14">
        <div className="space-y-8">
          <div className="max-w-3xl space-y-3">
            <p className="app-kicker">Teams / roles</p>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.04]">
              Make every team AI-powered with agents that follow through.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companyRoles.map((item) => (
              <div key={item.title} className="border border-white/8 bg-black p-5">
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
