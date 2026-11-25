/**
 * La calle de diciembre de la portada: cielo con estrellas, los cerros con
 * Monserrate iluminado y las luces de los barrios, casas coloniales con
 * balcones, faroles, guirnaldas de bombillos que se reflejan en el piso mojado
 * y adornos de neón colgando. Todo en SVG, armado aquí (no pesa como una foto).
 *
 * Es JavaScript a propósito: es puro dibujo con números, y así no hay que
 * anotar cada coordenada. Siempre sale igual (el azar tiene semilla fija).
 */
import { mezclar } from "./vitrina";

/** Números «al azar» que siempre salen iguales. */
function azar(semilla) {
  let s = semilla;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function calle() {
  const VX = 500, VY = 292, F = 170, OJO = 1.6, X0 = 4.6, r = azar(11);
  const pr = (X, h, Z) => [VX + F * X / Z, VY - F * (h - OJO) / Z];
  const p = (X, h, Z) => pr(X, h, Z).map(n => n.toFixed(1)).join(",");
  const poli = (pts, a) => `<polygon points="${pts.join(" ")}" ${a}/>`;
  const linea = (a, b, ex) => { const [x1, y1] = pr(...a), [x2, y2] = pr(...b); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ${ex}/>`; };
  const colores = ["#ffe14d", "#ff3b5c", "#3ec7ff", "#39ff88", "#ffb347"];
  let defs = "", cielo = "", lejos = "", casas = "", piso = "", luces = "", adornos = "";

  defs += `<linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03051a"/><stop offset=".42" stop-color="#0b1136"/><stop offset=".7" stop-color="#1e1744"/><stop offset="1" stop-color="#3b1d3e"/></linearGradient>
    <radialGradient id="ciudad" cx=".5" cy="1" r=".6"><stop offset="0" stop-color="#ff8a4a" stop-opacity=".38"/><stop offset="1" stop-color="#ff8a4a" stop-opacity="0"/></radialGradient>
    <radialGradient id="santuario"><stop offset="0" stop-color="#fff2c4" stop-opacity=".95"/><stop offset=".25" stop-color="#ffd27a" stop-opacity=".5"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
    <linearGradient id="piso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#191626"/><stop offset=".35" stop-color="#141119"/><stop offset="1" stop-color="#07070a"/></linearGradient>
    <linearGradient id="muro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".4"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
    <linearGradient id="ventana" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a0"/><stop offset="1" stop-color="#ff9b3d"/></linearGradient><linearGradient id="portal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9782f"/><stop offset=".6" stop-color="#8a4518"/><stop offset="1" stop-color="#4a220b"/></linearGradient>
    <radialGradient id="farol"><stop offset="0" stop-color="#fff1c2" stop-opacity=".95"/><stop offset=".2" stop-color="#ffc867" stop-opacity=".45"/><stop offset="1" stop-color="#ff9d3d" stop-opacity="0"/></radialGradient>`;
  for (const c of colores) defs += `<radialGradient id="h${c.slice(1)}"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset=".28" stop-color="${c}" stop-opacity=".42"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;

  // Cielo, estrellas y luz de la ciudad
  cielo += `<rect width="1000" height="460" fill="url(#cielo)"/>`;
  for (let i = 0; i < 90; i++) {
    const x = r() * 1000, y = r() * 230, rad = .4 + r() * 1.1, tw = r() < .3;
    cielo += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" fill="#fff" fill-opacity="${(.35 + r() * .6).toFixed(2)}" ${tw ? `class="ne-titila" style="--t:${(2 + r() * 3).toFixed(1)}s;--d:${(-r() * 4).toFixed(1)}s"` : ""}/>`;
  }
  cielo += `<ellipse cx="500" cy="300" rx="560" ry="120" fill="url(#ciudad)"/>`;

  // Los cerros: Monserrate con su santuario iluminado y las luces de los barrios en la ladera
  const curva = pts => { let d = `M${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i], [nx, ny] = pts[i + 1]; d += ` Q${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`; } const u = pts[pts.length - 1]; return d + ` L${u[0]} ${u[1]}`; };
  const cerroLejos = [[0, 236], [90, 224], [180, 212], [260, 200], [330, 186], [400, 172], [450, 158], [488, 140], [505, 134], [522, 140], [552, 156], [600, 170], [640, 160], [672, 152], [700, 160], [760, 180], [840, 198], [920, 214], [1000, 226]];
  const cerroCerca = [[0, 262], [110, 252], [210, 246], [300, 238], [390, 230], [470, 236], [560, 230], [650, 236], [740, 244], [830, 250], [920, 258], [1000, 262]];
  lejos += `<path d="${curva(cerroLejos)} L1000 300 L0 300Z" fill="#131a40"/><path d="${curva(cerroLejos)}" fill="none" stroke="#5d6bc4" stroke-opacity=".25" stroke-width="1.2"/>`;
  lejos += `<ellipse cx="505" cy="128" rx="34" ry="22" fill="url(#santuario)"/>
    <g fill="#f7dfa0"><rect x="497" y="124" width="16" height="10" rx="1"/><rect x="495" y="117" width="4.5" height="10"/><rect x="510.5" y="117" width="4.5" height="10"/><path d="M495 117l2.2-4 2.3 4zM510.5 117l2.2-4 2.3 4z"/><rect x="503.5" y="119" width="3" height="5"/></g>
    <circle cx="672" cy="150" r="2.4" fill="#fff4d0"/><ellipse cx="672" cy="150" rx="14" ry="10" fill="url(#santuario)" opacity=".6"/>`;
  const altoCerca = x => { for (let i = 0; i < cerroCerca.length - 1; i++) { const [x1, y1] = cerroCerca[i], [x2, y2] = cerroCerca[i + 1]; if (x >= x1 && x <= x2) return y1 + (y2 - y1) * (x - x1) / (x2 - x1); } return 260; };
  lejos += `<path d="${curva(cerroCerca)} L1000 300 L0 300Z" fill="#0a0d24"/>`;
  for (let i = 0; i < 230; i++) {
    const x = r() * 1000, y0 = altoCerca(x) + 4, y = y0 + r() * (298 - y0), tono = r();
    lejos += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.5 + r() * .7).toFixed(2)}" fill="${tono < .62 ? "#ffcf8a" : tono < .86 ? "#fff6e0" : "#9fd8ff"}" fill-opacity="${(.45 + r() * .5).toFixed(2)}"/>`;
  }
  lejos += `<rect x="0" y="262" width="1000" height="40" fill="#ff9a66" fill-opacity=".06"/>`;

  // Piso: andenes, adoquín mojado
  piso += poli([p(-X0, 0, .5), p(X0, 0, .5), p(X0, 0, 80), p(-X0, 0, 80)], `fill="url(#piso)"`);
  for (const s of [-1, 1]) {
    piso += poli([p(s * X0, 0, .5), p(s * (X0 - .9), 0, .5), p(s * (X0 - .9), 0, 80), p(s * X0, 0, 80)], `fill="#1c1820"`);
    piso += `<polyline points="${p(s * (X0 - .9), 0, .5)} ${p(s * (X0 - .9), 0, 80)}" stroke="#4a3d45" stroke-width="1.4" fill="none"/>`;
  }
  for (let z = .7; z < 60; z *= 1.16) piso += linea([-(X0 - .9), 0, z], [X0 - .9, 0, z], `stroke="#fff" stroke-opacity=".035" stroke-width="1"`);
  for (let x = -3.4; x <= 3.41; x += .5) piso += linea([x, 0, .6], [x, 0, 70], `stroke="#fff" stroke-opacity=".028" stroke-width="1"`);

  // Casas coloniales a lado y lado
  const zs = [.9, 2.5, 4.3, 6.4, 9, 12.5, 17, 23, 32, 46], murosPts = [];
  const muros = [["#43302a", "#5c2a22"], ["#2c3550", "#1f2a40"], ["#463a2a", "#5a3a1f"], ["#36293e", "#4a2236"], ["#2e3e37", "#20332a"], ["#41292f", "#5a2430"], ["#30364a", "#24283a"], ["#3e3428", "#4a3220"], ["#33293a", "#2a2032"]];
  for (const s of [-1, 1]) {
    for (let i = zs.length - 2; i >= 0; i--) {
      const z1 = zs[i], z2 = zs[i + 1], alto = 6.1 + r() * 1.1, [color, zocalo] = muros[(i * 2 + (s > 0 ? 3 : 0)) % muros.length], X = s * X0;
      const niebla = Math.min(.72, (z1 - .9) / 34);
      // techo inclinado y alero de teja
      casas += poli([p(X, alto, z1), p(X, alto, z2), p(X * 1.35, alto + 1.7, z2), p(X * 1.35, alto + 1.7, z1)], `fill="#22110c"`);
      casas += poli([p(X, 0, z1), p(X, alto, z1), p(X, alto, z2), p(X, 0, z2)], `fill="${color}"`);
      casas += poli([p(X, 0, z1), p(X, .95, z1), p(X, .95, z2), p(X, 0, z2)], `fill="${zocalo}"`);
      casas += poli([p(X, 0, z1), p(X, alto, z1), p(X, alto, z2), p(X, 0, z2)], `fill="url(#muro)"`);
      murosPts.push([p(X, 0, z1), p(X, alto, z1), p(X, alto, z2), p(X, 0, z2)]);
      // cornisa bajo el alero y franja entre pisos
      casas += poli([p(X, alto - .62, z1), p(X, alto - .44, z1), p(X, alto - .44, z2), p(X, alto - .62, z2)], `fill="${mezclar(color, "#fff", .18)}"`);
      casas += poli([p(X, 3.02, z1), p(X, 3.14, z1), p(X, 3.14, z2), p(X, 3.02, z2)], `fill="${mezclar(color, "#fff", .1)}"`);
      casas += linea([X, 0, z1], [X, alto, z1], `stroke="#000" stroke-opacity=".45" stroke-width="${Math.max(.6, 3 / z1).toFixed(2)}"`);
      casas += poli([p(X, alto, z1), p(X, alto, z2), p(X * .9, alto - .32, z2), p(X * .9, alto - .32, z1)], `fill="#6a2d1c"`);
      for (let z = z1 + .2; z < z2; z += .32) casas += linea([X, alto, z], [X * .9, alto - .32, z], `stroke="#3a160d" stroke-width="${Math.max(.5, 1.6 / z).toFixed(2)}"`);
      // ventanas del segundo piso
      const n = z2 - z1 > 3 ? 2 : 1, lado = (z2 - z1) / n;
      for (let k = 0; k < n; k++) {
        const zc = z1 + lado * (k + .5), za = zc - .45, zb = zc + .45, luz = r() < .72 && z1 > 1;
        if (luz) casas += poli([p(X, 3.3, za - .3), p(X, 5.2, za - .3), p(X, 5.2, zb + .3), p(X, 3.3, zb + .3)], `fill="#ffb860" fill-opacity=".14"`);
        casas += poli([p(X, 3.55, za), p(X, 4.95, za), p(X, 4.95, zb), p(X, 3.55, zb)], `fill="${luz ? "url(#ventana)" : "#120f19"}" stroke="#2a1a10" stroke-width="${Math.max(.6, 3.2 / zc).toFixed(2)}"`);
        casas += linea([X, 3.55, zc], [X, 4.95, zc], `stroke="#2a1a10" stroke-opacity=".8" stroke-width="${Math.max(.4, 1.8 / zc).toFixed(2)}"`);
        casas += linea([X, 4.3, za], [X, 4.3, zb], `stroke="#2a1a10" stroke-opacity=".8" stroke-width="${Math.max(.4, 1.8 / zc).toFixed(2)}"`);
        // contraventanas de madera: abiertas si caben, cerradas en la casa más cercana
        const madera = ["#2f5a3c", "#7a2e20", "#2a4f78", "#5c3a1d"][(i + k + (s > 0 ? 1 : 0)) % 4], gl = Math.max(.3, 1.2 / zc).toFixed(2);
        const hojas = lado > 1.76 ? [[za - .4, za - .04], [zb + .04, zb + .4]] : [[za, zc - .01], [zc + .01, zb]];
        for (const [a, b] of hojas) {
          casas += poli([p(X, 3.55, a), p(X, 4.95, a), p(X, 4.95, b), p(X, 3.55, b)], `fill="${mezclar(madera, "#0a0810", lado > 1.76 ? .38 : .55)}" stroke="#140c07" stroke-width="${Math.max(.4, 1.6 / zc).toFixed(2)}"`);
          for (const h of [3.85, 4.15, 4.45, 4.75]) casas += linea([X, h, a], [X, h, b], `stroke="#000" stroke-opacity=".32" stroke-width="${gl}"`);
        }
      }
      // puerta y vitrina del primer piso
      const zp = z1 + (z2 - z1) * .3, abierta = r() < (z1 < 3 ? .15 : .4);
      casas += poli([p(X, 0, zp - .55), p(X, 2.35, zp - .55), p(X, 2.35, zp + .55), p(X, 0, zp + .55)], `fill="${abierta ? "url(#portal)" : "#25160d"}" stroke="#140c07" stroke-width="${Math.max(.5, 2.4 / zp).toFixed(2)}"`);
      if (abierta) piso += poli([p(X, 0, zp - .55), p(X, 0, zp + .55), p(X * .55, 0, zp + .9), p(X * .55, 0, zp - .9)], `fill="#ffb35c" fill-opacity=".1"`);
      if (n === 2 && z1 < 20) {
        const zv = z1 + (z2 - z1) * .72, neon = colores[(i + (s > 0 ? 2 : 0)) % colores.length];
        casas += poli([p(X, 1, zv - .7), p(X, 2.3, zv - .7), p(X, 2.3, zv + .7), p(X, 1, zv + .7)], `fill="url(#ventana)" fill-opacity=".85"`);
        casas += poli([p(X, .92, zv - .78), p(X, 2.38, zv - .78), p(X, 2.38, zv + .78), p(X, .92, zv + .78)], `fill="none" stroke="${neon}" stroke-opacity=".35" stroke-width="${(7 / zv).toFixed(2)}"`);
        casas += poli([p(X, .92, zv - .78), p(X, 2.38, zv - .78), p(X, 2.38, zv + .78), p(X, .92, zv + .78)], `fill="none" stroke="${neon}" stroke-width="${(2.4 / zv).toFixed(2)}"`);
      }
      // balcón de madera
      if (r() < .62 && z1 < 16) {
        const za = z1 + .25, zb = z2 - .25, Xb = X * .86;
        casas += poli([p(X, 3.35, za), p(Xb, 3.35, za), p(Xb, 3.35, zb), p(X, 3.35, zb)], `fill="#3e2413"`);
        casas += poli([p(X, 3.2, za), p(Xb, 3.2, za), p(Xb, 3.35, za), p(X, 3.35, za)], `fill="#2a170c"`);
        const g = Math.max(.6, 3 / za).toFixed(2);
        for (let z = za; z <= zb + .01; z += .2) casas += linea([Xb, 3.35, z], [Xb, 4.22, z], `stroke="#6b4220" stroke-width="${(+g * .7).toFixed(2)}"`);
        casas += linea([Xb, 4.22, za], [Xb, 4.22, zb], `stroke="#8a5a30" stroke-width="${g}"`);
        casas += linea([X, 4.22, za], [Xb, 4.22, za], `stroke="#8a5a30" stroke-width="${g}"`);
        casas += linea([X, 4.22, zb], [Xb, 4.22, zb], `stroke="#8a5a30" stroke-width="${g}"`);
        // materas con flores sobre la baranda
        for (const f of [.18, .5, .82]) {
          const z = za + (zb - za) * f, [mx, my] = pr(Xb, 4.22, z), t = F / z;
          casas += `<path d="M${(mx - t * .09).toFixed(1)} ${my.toFixed(1)}h${(t * .18).toFixed(1)}l-${(t * .03).toFixed(1)} ${(t * .13).toFixed(1)}h-${(t * .12).toFixed(1)}z" fill="#9a4a2a"/>`;
          for (let q = 0; q < 5; q++) {
            const fx = mx + (q - 2) * t * .045, fy = my - t * (.035 + (q % 2) * .05);
            casas += `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="${(t * .036).toFixed(2)}" fill="${q % 2 ? "#2f7a3e" : ["#ff5c7a", "#ffd166", "#ff8fab", "#f4f4f4"][(q + i) % 4]}"/>`;
          }
        }
      }
      if (niebla > .02) casas += poli([p(X, 0, z1), p(X, alto, z1), p(X * 1.35, alto + 1.7, z1), p(X * 1.35, alto + 1.7, z2), p(X, alto, z2), p(X, 0, z2)], `fill="#151a3a" fill-opacity="${niebla.toFixed(2)}"`);
      // farol de pared
      if (i % 2 === 0 && z1 < 18) {
        const [fx, fy] = pr(X * .93, 3, z1 + .2), t = F / (z1 + .2), [bx, by] = pr(X, 3.25, z1 + .2);
        luces += `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="${(t * 1.5).toFixed(1)}" fill="url(#farol)"/>`;
        luces += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${fx.toFixed(1)}" y2="${(fy - t * .14).toFixed(1)}" stroke="#16100b" stroke-width="${Math.max(.6, t * .03).toFixed(2)}"/>`;
        luces += `<path d="M${(fx - t * .08).toFixed(1)} ${(fy - t * .12).toFixed(1)}h${(t * .16).toFixed(1)}l${(t * .03).toFixed(1)} ${(t * .26).toFixed(1)}h-${(t * .22).toFixed(1)}z" fill="#ffe7a8"/>`;
        luces += `<path d="M${(fx - t * .1).toFixed(1)} ${(fy - t * .12).toFixed(1)}h${(t * .2).toFixed(1)}l-${(t * .1).toFixed(1)} -${(t * .08).toFixed(1)}z" fill="#16100b"/>`;
        const [gx, gy] = pr(X * .78, 0, z1 + .2);
        piso += `<ellipse cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" rx="${(t * 1.1).toFixed(1)}" ry="${(t * .28).toFixed(1)}" fill="url(#farol)" opacity=".55"/>`;
        const [rx, ry] = pr(X * .62, 0, z1 + .2);
        piso += `<ellipse cx="${rx.toFixed(1)}" cy="${(ry + t * .35).toFixed(1)}" rx="${(t * .14).toFixed(1)}" ry="${(t * .7).toFixed(1)}" fill="url(#farol)" opacity=".5"/>`;
      }
    }
  }

  // Guirnaldas de bombillos cruzando la calle, con su reflejo en el piso mojado
  const cuerdas = [[2.3, 1.3], [3.2, 1.2], [4.4, 1.1], [6, 1], [8.2, .9], [11.5, .8], [16, .7], [22, .6]];
  let n = 0;
  cuerdas.forEach(([z, comba], ci) => {
    const alto = X => 6 - comba * (1 - (X / X0) ** 2);
    let d = "";
    for (let k = 0; k <= 40; k++) { const X = -X0 + 2 * X0 * k / 40, [x, y] = pr(X, alto(X), z); d += `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`; }
    luces += `<path d="${d}" fill="none" stroke="#1d1d26" stroke-width="${Math.max(.6, 2.6 / z).toFixed(2)}"/>`;
    for (let X = -X0 + .25; X < X0 - .1; X += .42) {
      const c = colores[n % colores.length], [x, y] = pr(X, alto(X) - .08, z), halo = F * .3 / z, nucleo = Math.max(.7, F * .05 / z);
      const tw = n % 3 === 0;
      luces += `<g ${tw ? `class="ne-titila" style="--t:${(2.4 + (n % 5) * .5).toFixed(1)}s;--d:${(-(n % 7) * .45).toFixed(2)}s"` : ""}><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${halo.toFixed(1)}" fill="url(#h${c.slice(1)})"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${nucleo.toFixed(2)}" fill="${mezclar(c, "#fff", .55)}"/></g>`;
      if (ci < 5) {
        const [gx, gy] = pr(X, 0, z);
        if (gy < 470) piso += `<ellipse cx="${gx.toFixed(1)}" cy="${(gy + F * .25 / z).toFixed(1)}" rx="${(F * .06 / z).toFixed(1)}" ry="${(F * .5 / z).toFixed(1)}" fill="url(#h${c.slice(1)})" opacity=".55"/>`;
      }
      n++;
    }
    // adornos de neón colgando de las dos primeras guirnaldas
    if (ci < 2) {
      const lista = ci === 0 ? [[-3.3, "#3ec7ff", "bola"], [-1.5, "#ff3b5c", "bola"], [1.6, "#ffe14d", "estrella"], [3.4, "#f5c451", "bola"]] : [[-2.4, "#39ff88", "bola"], [2.5, "#ff3b5c", "bola"]];
      for (const [X, c, tipo] of lista) {
        const [x, y] = pr(X, alto(X), z), L = F * .38 / z, R = F * .17 / z, cy = y + L + R;
        const forma = tipo === "bola"
          ? `<circle cx="${x.toFixed(1)}" cy="${cy.toFixed(1)}" r="${R.toFixed(1)}"/><path d="M${(x - R * .9).toFixed(1)} ${(cy - R * .15).toFixed(1)} Q${x.toFixed(1)} ${(cy + R * .45).toFixed(1)} ${(x + R * .9).toFixed(1)} ${(cy - R * .15).toFixed(1)}"/>`
          : `<path d="${Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R * .45 : R * 1.15; return `${k ? "L" : "M"}${(x + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join("")}Z"/>`;
        adornos += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(cy - R).toFixed(1)}" stroke="#777" stroke-width=".8"/>
          <g fill="none" stroke-linejoin="round"><g stroke="${c}" stroke-width="${(R * .5).toFixed(1)}" opacity=".22">${forma}</g><g stroke="${c}" stroke-width="${(R * .16).toFixed(2)}">${forma}</g><g stroke="#fff" stroke-opacity=".8" stroke-width="${(R * .055).toFixed(2)}">${forma}</g></g>`;
      }
    }
  });

  // Un solo SVG, para servirlo como imagen: el navegador lo dibuja una vez y lo guarda.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="460" viewBox="0 0 1000 460" preserveAspectRatio="xMidYMid slice"><defs>${defs}
    <clipPath id="muros">${murosPts.map(m => `<polygon points="${m.join(" ")}"/>`).join("")}</clipPath>
    <filter id="panete" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .34 0 0 0 -.13"/></filter>
    <filter id="ruido" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .06 0"/></filter></defs>
    ${cielo}${lejos}${piso}${casas}<rect width="1000" height="460" filter="url(#panete)" clip-path="url(#muros)"/>${luces}${adornos}
    <rect width="1000" height="460" filter="url(#ruido)"/></svg>`;
}
export function bokeh() {
  const r = azar(5), c = ["#ffe14d", "#ff3b5c", "#3ec7ff", "#ffb347", "#39ff88"];
  return Array.from({ length: 16 }, (_, i) => { const t = 6 + r() * 22; return `<span style="left:${(r() * 100).toFixed(1)}%;width:${t.toFixed(0)}px;height:${t.toFixed(0)}px;--c:${c[i % 5]};--o:${(.25 + r() * .4).toFixed(2)};--dur:${(11 + r() * 10).toFixed(1)}s;--del:${(-r() * 20).toFixed(1)}s;--x:${((r() - .5) * 80).toFixed(0)}px"></span>`; }).join("");
}

