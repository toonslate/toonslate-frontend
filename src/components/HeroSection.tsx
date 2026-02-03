import { Badge } from "@/components/ui/badge";

export const HeroSection = () => {
  return (
    <section className="mb-10 text-center">
      <Badge variant="secondary" className="mb-4">
        ✨ AI 기반 자동 번역
      </Badge>
      <h1 className="mb-3 text-3xl font-bold leading-tight">
        웹툰 번역,
        <br />
        AI가 자동으로
      </h1>
      <p className="text-muted-foreground">
        한국 웹툰을 업로드하면 자동으로 영어로 번역하고,
        <br />
        원본 디자인을 유지하며 텍스트를 합성합니다.
      </p>
    </section>
  );
};
