import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
      <Card className="w-full">
        <CardContent className="space-y-5">
          <div className="h-5 w-44 rounded bg-white/10" />
          <div className="space-y-3">
            <div className="h-3 rounded bg-white/8" />
            <div className="h-3 w-3/4 rounded bg-white/8" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-24 rounded bg-white/5" />
            <div className="h-24 rounded bg-white/5" />
            <div className="h-24 rounded bg-white/5" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
