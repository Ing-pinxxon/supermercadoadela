"use client";

import { useState } from "react";
import { pesos } from "@/lib/dinero";

/**
 * Gráficas en SVG, sin librerías. Los colores vienen de una paleta validada
 * para daltonismo; el texto nunca lleva el color de la serie.
 */
const SERIE_1 = "#2a78d6"; // azul
const SERIE_2 = "#eb6834"; // naranja
const SUPERFICIE = "#ffffff";
const REJILLA = "#e5e7eb";
const TINTA_2 = "#52514e";

function ejeY(max: number) {
  if (max <= 0) return [0];
  const paso = Math.pow(10, Math.floor(Math.log10(max)));
  const escalon = max / paso > 5 ? paso * 2 : max / paso > 2 ? paso : paso / 2;
  const marcas: number[] = [];
  for (let v = 0; v <= max + escalon * 0.001; v += escalon) marcas.push(v);
  return marcas;
}

function corto(monto: number) {
  const m = Math.abs(monto);
  if (m >= 1_000_000) return `${(monto / 1_000_000).toFixed(1)}M`;
  if (m >= 1_000) return `${Math.round(monto / 1_000)}k`;
  return String(Math.round(monto));
}

export type PuntoSerie = { etiqueta: string; valor: number };

/**
 * Serie(s) en el tiempo. Una sola serie no lleva leyenda: el título ya dice qué
 * se está mirando.
 */
export function GraficaLineas({
  series,
  alto = 220,
}: {
  series: { nombre: string; puntos: PuntoSerie[]; color?: string }[];
  alto?: number;
}) {
  const [activo, setActivo] = useState<number | null>(null);

  const n = series[0]?.puntos.length ?? 0;
  if (n === 0) return null;

  const ancho = 700;
  const izq = 52;
  const der = 12;
  const arriba = 12;
  const abajo = 28;
  const anchoUtil = ancho - izq - der;
  const altoUtil = alto - arriba - abajo;

  const max = Math.max(
    ...series.flatMap((s) => s.puntos.map((p) => p.valor)),
    0,
  );
  const marcas = ejeY(max);
  const tope = marcas[marcas.length - 1] || 1;

  const x = (i: number) => izq + (n === 1 ? anchoUtil / 2 : (i / (n - 1)) * anchoUtil);
  const y = (v: number) => arriba + altoUtil - (v / tope) * altoUtil;

  const colores = [SERIE_1, SERIE_2];
  const saltoEtiqueta = Math.max(1, Math.ceil(n / 7));

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-gray-600">
          {series.map((s, i) => (
            <span key={s.nombre} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ background: s.color ?? colores[i] }}
              />
              {s.nombre}
            </span>
          ))}
        </div>
      )}

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${ancho} ${alto}`}
          className="w-full min-w-[320px]"
          role="img"
          aria-label={`Gráfica de ${series.map((s) => s.nombre).join(" y ")}`}
          onMouseLeave={() => setActivo(null)}
        >
          {marcas.map((v) => (
            <g key={v}>
              <line
                x1={izq}
                x2={ancho - der}
                y1={y(v)}
                y2={y(v)}
                stroke={REJILLA}
                strokeWidth={1}
              />
              <text
                x={izq - 8}
                y={y(v) + 4}
                textAnchor="end"
                fontSize={11}
                fill={TINTA_2}
              >
                {corto(v)}
              </text>
            </g>
          ))}

          {series[0].puntos.map((p, i) =>
            i % saltoEtiqueta === 0 ? (
              <text
                key={p.etiqueta}
                x={x(i)}
                y={alto - 8}
                // Las de los extremos se anclan hacia adentro para que no se
                // salgan del lienzo.
                textAnchor={
                  i === 0 ? "start" : i > n - 1 - saltoEtiqueta ? "end" : "middle"
                }
                fontSize={11}
                fill={TINTA_2}
              >
                {p.etiqueta}
              </text>
            ) : null,
          )}

          {activo !== null && (
            <line
              x1={x(activo)}
              x2={x(activo)}
              y1={arriba}
              y2={arriba + altoUtil}
              stroke={REJILLA}
              strokeWidth={1}
            />
          )}

          {series.map((s, si) => {
            const color = s.color ?? colores[si];
            const d = s.puntos
              .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.valor)}`)
              .join(" ");
            return (
              <g key={s.nombre}>
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {activo !== null && s.puntos[activo] && (
                  <circle
                    cx={x(activo)}
                    cy={y(s.puntos[activo].valor)}
                    r={4}
                    fill={color}
                    stroke={SUPERFICIE}
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}

          {/* Zonas de captura anchas: el dedo no tiene que acertarle al punto. */}
          {series[0].puntos.map((p, i) => (
            <rect
              key={p.etiqueta}
              x={x(i) - anchoUtil / (2 * Math.max(n - 1, 1))}
              y={arriba}
              width={anchoUtil / Math.max(n - 1, 1)}
              height={altoUtil}
              fill="transparent"
              onMouseEnter={() => setActivo(i)}
              onTouchStart={() => setActivo(i)}
            />
          ))}
        </svg>
      </div>

      <p className="mt-2 min-h-[1.25rem] text-xs text-gray-600">
        {activo !== null && series[0].puntos[activo] ? (
          <>
            <span className="font-medium">{series[0].puntos[activo].etiqueta}</span>
            {series.map((s, i) => (
              <span key={s.nombre} className="ml-3 tabular">
                {series.length > 1 && `${s.nombre}: `}
                {pesos(s.puntos[activo]?.valor ?? 0)}
              </span>
            ))}
          </>
        ) : (
          "Toca la gráfica para ver los valores."
        )}
      </p>
    </div>
  );
}

/** Barras horizontales: comparar magnitudes con nombres largos. */
export function GraficaBarras({
  datos,
  color = SERIE_1,
}: {
  datos: { etiqueta: string; valor: number; detalle?: string }[];
  color?: string;
}) {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(...datos.map((d) => d.valor), 0) || 1;

  return (
    <ul className="space-y-2">
      {datos.map((d, i) => (
        <li
          key={d.etiqueta}
          onMouseEnter={() => setActivo(i)}
          onMouseLeave={() => setActivo(null)}
        >
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">
              {d.etiqueta}
              {d.detalle && (
                <span className="ml-1 text-xs text-gray-400">{d.detalle}</span>
              )}
            </span>
            <span className="tabular shrink-0 font-medium">{pesos(d.valor)}</span>
          </div>
          <div className="mt-1 h-2.5 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-r-full transition-opacity"
              style={{
                width: `${Math.max((d.valor / max) * 100, 1.5)}%`,
                background: color,
                opacity: activo === null || activo === i ? 1 : 0.55,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
