"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const OpenAICodexAnimatedBackground = () => {
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden")}>
      {/* Gradiente base violeta */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 dark:from-violet-950 dark:via-purple-900 dark:to-fuchsia-950" />
      
      {/* Capas animadas de gradientes violeta */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-violet-400/30 via-transparent to-purple-400/30"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <motion.div
        className="absolute inset-0 bg-gradient-to-bl from-fuchsia-400/20 via-transparent to-violet-400/20"
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [90, 0, 90],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <motion.div
        className="absolute inset-0 bg-gradient-to-tl from-purple-400/25 via-transparent to-fuchsia-400/25"
        animate={{
          scale: [1.1, 1.3, 1.1],
          rotate: [45, 135, 45],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Overlay de textura sutil */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
      </div>
    </div>
  );
};
