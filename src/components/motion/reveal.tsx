import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "h1" | "h2" | "h3" | "p" | "span" | "li";
} & Omit<HTMLMotionProps<"div">, "children" | "className">;

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
  ...rest
}: RevealProps) {
  const Tag = motion[as as "div"];
  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 1,
        delay,
        ease: [0.32, 0.72, 0, 1],
      }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay, ease: [0.32, 0.72, 0, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
