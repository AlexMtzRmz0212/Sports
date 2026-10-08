import { motion } from "motion/react";
import type { Venue } from "../lib/venues";
import "./Tunnel.css";

/** Walking out of the tunnel: dark, a point of light ahead, then the venue opens up. */
export default function Tunnel({ venue, onDone }: { venue: Venue; onDone: () => void }) {
  return (
    <motion.div
      className="tunnel"
      aria-hidden
      initial={{ "--hole": "1%" } as never}
      animate={{ "--hole": ["1%", "7%", "150%"] } as never}
      transition={{ duration: 1.15, times: [0, 0.42, 1], ease: [0.55, 0, 0.25, 1] }}
      onAnimationComplete={onDone}
    >
      <motion.p
        className="tunnel-sign"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -8] }}
        transition={{ duration: 1, times: [0, 0.2, 0.55, 0.8] }}
      >
        <span>{venue.id === "hub" ? "Back to" : `${venue.league}:`}</span>
        {venue.place}
      </motion.p>
    </motion.div>
  );
}
