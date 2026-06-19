import { motion } from "motion/react";

type Section = { label: string; notes: string[] };

export function NotePyramid({
  top,
  heart,
  base,
}: {
  top: string[];
  heart: string[];
  base: string[];
}) {
  const sections: Section[] = [
    { label: "Top Notes", notes: top },
    { label: "Heart Notes", notes: heart },
    { label: "Base Notes", notes: base },
  ];
  return (
    <div className="space-y-8 border-t border-border pt-10">
      {sections.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: i * 0.12, ease: [0.32, 0.72, 0, 1] }}
          className="grid grid-cols-[120px_1fr] gap-8 items-start"
        >
          <span className="eyebrow !text-accent pt-1">{s.label}</span>
          <div className="font-display italic text-2xl md:text-3xl leading-snug text-balance">
            {s.notes.join(" · ")}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
