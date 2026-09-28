import { useEffect, useState, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import confetti from "canvas-confetti";
import "./styles.css";

// Dynamic data: change these and the receipt updates
const ticket = {
  id: "0128034399434",
  amount: "$100.00",
  date: "19 Aug 2026 - 20:17",
  status: "CONFIRMED",
  name: "Prasanna kumar",
  card: "•••• 8237",
};

// Build barcode bars from the ticket id (SVG)
function Barcode({ code }) {
  let x = 0;
  const bars = code.split("").flatMap((d, i) => {
    const n = Number(d);
    const out = [];
    [1 + (n % 3), 1 + ((n + i) % 2)].forEach((w, k) => {
      if (k === 0) out.push(<rect key={`${i}-${k}`} x={x} y="0" width={w} height="44" />);
      x += w + 1.5;
    });
    return out;
  });
  return (
    <svg className="barcode" viewBox={`0 0 ${x} 44`} preserveAspectRatio="none" aria-label="Barcode">
      {bars}
    </svg>
  );
}

// Simple QR-like pattern from a seed (SVG)
function QrCode({ seed }) {
  const size = 21;
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const finder = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
      const on = finder
        ? r % 6 === 0 || c % 6 === 0 || (r % 6 > 1 && r % 6 < 5 && c % 6 > 1 && c % 6 < 5) || (c > 13 && (c - 14) % 6 === 0)
        : (seed.charCodeAt((r * size + c) % seed.length) + r * c) % 3 === 0;
      if (on) cells.push(<rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />);
    }
  }
  return (
    <svg className="qr" viewBox={`0 0 ${size} ${size}`} aria-label="QR code">
      {cells}
    </svg>
  );
}

const fireConfetti = () => {
  const end = Date.now() + 900;
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.5 } });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.5 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 } });
  frame();
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const printer = useAnimation();
  const receipt = useAnimation();
  const [run, setRun] = useState(0);

  const play = useCallback(async () => {
    // reset
    printer.set({ y: "-120%" });
    receipt.set({ y: "-105%" });
    // Step 2: printer screen comes down from top center
    await printer.start({ y: 0, transition: { type: "spring", stiffness: 90, damping: 16 } });
    // receipt slides out of the printer
    await receipt.start({ y: 0, transition: { duration: 1.6, ease: "easeOut" } });
    // Step 3: party paper once the receipt is fully down
    fireConfetti();
    // Step 4: after 3 seconds the receipt is dragged down and leaves
    await wait(3000);
    await receipt.start({ y: "130vh", transition: { duration: 1.1, ease: "easeIn" } });
    await printer.start({ y: "-120%", transition: { duration: 0.6 } });
  }, [printer, receipt]);

  useEffect(() => {
    play();
  }, [run, play]);

  return (
    <main className="stage">
      <div className="bg-blur" aria-hidden="true" />

      <motion.section className="printer-machine" initial={{ y: "-120%" }} animate={printer}>
        <div className="printer-slot" />
        <div className="printer-window">
          <motion.article className="receipt" initial={{ y: "-105%" }} animate={receipt}>
            <div className="confetti-dots" aria-hidden="true" />
            <svg className="bulb" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="7" width="16" height="10" rx="2" fill="none" stroke="#f5a623" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="2" fill="#f5a623" />
            </svg>
            <h1>Thank you!</h1>
            <p className="sub">Your ticket has been issued successfully</p>

            <dl className="rows">
              <div><dt>TICKET ID</dt><dd>{ticket.id}</dd></div>
              <div className="right"><dt>AMOUNT</dt><dd className="big">{ticket.amount}</dd></div>
              <div><dt>DATE &amp; TIME</dt><dd className="small">{ticket.date}</dd></div>
              <div className="right"><dt>STATUS</dt><dd><span className="badge">{ticket.status}</span></dd></div>
            </dl>

            <div className="payer">
              <span className="card"><i /><i /></span>
              <div>
                <strong>{ticket.name}</strong>
                <small>{ticket.card}</small>
              </div>
            </div>

            <Barcode code={ticket.id} />
            <p className="code">{ticket.id.slice(0, 1)} 8917261 275610</p>

            <div className="qr-box">
              <QrCode seed={ticket.id} />
              <small>Scan to verify authenticity</small>
            </div>
          </motion.article>
        </div>
      </motion.section>

      <button className="replay" onClick={() => setRun((n) => n + 1)}>Replay</button>
    </main>
  );
}
