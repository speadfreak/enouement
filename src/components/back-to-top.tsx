"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full glass-strong gradient-border text-foreground shadow-lg"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
