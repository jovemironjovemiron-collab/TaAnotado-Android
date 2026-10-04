const strip = (s        ) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const units                         = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  catorze: 14,
  quatorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
};
const tens                         = {
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
};
const hundreds                         = {
  cem: 100,
  cento: 100,
  duzentos: 200,
  duzentas: 200,
  trezentos: 300,
  trezentas: 300,
  quatrocentos: 400,
  quatrocentas: 400,
  quinhentos: 500,
  quinhentas: 500,
  seiscentos: 600,
  seiscentas: 600,
  setecentos: 700,
  setecentas: 700,
  oitocentos: 800,
  oitocentas: 800,
  novecentos: 900,
  novecentas: 900,
};
const isNumberWord = (w        ) =>
  w in units || w in tens || w in hundreds || w === "mil" || w === "e";
function parseWords(words          ) {
  let total = 0,
    current = 0,
    used = false;
  for (const w of words) {
    if (w === "e") continue;
    if (w === "mil") {
      total += (current || 1) * 1000;
      current = 0;
      used = true;
    } else if (w in hundreds) {
      current += hundreds[w];
      used = true;
    } else if (w in tens) {
      current += tens[w];
      used = true;
    } else if (w in units) {
      current += units[w];
      used = true;
    } else return null;
  }
  return used ? total + current : null;
}
export function normalizePortuguese(input        ) {
  const base = strip(input)
    .replace(/\br\$\s*/g, "")
    .replace(/(\d)\.(\d{3})\b/g, "$1$2")
    .replace(/(\d),(\d{2})\b/g, "$1.$2");
  const tokens = base.split(/(\s+|[,.!?;:])/);
  const out           = [];
  for (let i = 0; i < tokens.length;) {
    const token = tokens[i];
    if (
      !token ||
      /^\s+$|^[,.!?;:]$/.test(token) ||
      !isNumberWord(token) ||
      token === "e"
    ) {
      out.push(token);
      i++;
      continue;
    }
    let j = i;
    const words           = [];
    while (j < tokens.length) {
      const w = tokens[j];
      if (/^\s+$/.test(w)) {
        j++;
        continue;
      }
      if (!isNumberWord(w)) break;
      words.push(w);
      j++;
    }
    const n = parseWords(words);
    if (n === null) {
      out.push(token);
      i++;
    } else {
      out.push(`${n} `);
      i = j;
    }
  }
  return out
    .join("")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\bconto(s)?\b/g, "reais")
    .trim();
}
export const parseMoney = (raw        ) => Number(raw.replace(",", "."));
