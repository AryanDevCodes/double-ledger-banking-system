import { ReactNode } from "react";
import { motion } from "framer-motion";

export default function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="layout-shell"
    >
      {children}
    </motion.div>
  );
}
