/** «07:00» → minutos desde la medianoche. */
export const minutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

/** «22:00» → «10 p. m.»; «07:30» → «7:30 a. m.». */
export function horaLegible(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "a. m." : "p. m."}`;
}
