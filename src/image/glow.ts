enum Colors {
  GOLD = '#ffd700',
  PURPLE = '#7d26cd',
  BLUE = '#87ceeb',
}

const GLOW = {
  GOLD: `<filter id="gold-glow" x="-5000%" y="-5000%" width="10000%" height="10000%">
<feFlood result="flood" flood-color="${Colors.GOLD}" flood-opacity="1"/>
<feComposite in="flood" result="mask" in2="SourceGraphic" operator="in"/>
<feMorphology in="mask" result="dilated" operator="dilate" radius="10"/>
<feGaussianBlur in="dilated" result="blurred" stdDeviation="5"/>
<feMerge>
  <feMergeNode in="blurred"/>
  <feMergeNode in="SourceGraphic"/>
</feMerge>
</filter>`,

  PURPLE: `<filter id="purple-glow" x="-5000%" y="-5000%" width="10000%" height="10000%">
<feFlood result="flood" flood-color="${Colors.PURPLE}" flood-opacity="1"/>
<feComposite in="flood" result="mask" in2="SourceGraphic" operator="in"/>
<feMorphology in="mask" result="dilated" operator="dilate" radius="10"/>
<feGaussianBlur in="dilated" result="blurred" stdDeviation="5"/>
<feMerge>
  <feMergeNode in="blurred"/>
  <feMergeNode in="SourceGraphic"/>
</feMerge>
</filter>`,

  BLUE: `<filter id="blue-glow" x="-5000%" y="-5000%" width="10000%" height="10000%">
<feFlood result="flood" flood-color="${Colors.BLUE}" flood-opacity="1"/>
<feComposite in="flood" result="mask" in2="SourceGraphic" operator="in"/>
<feMorphology in="mask" result="dilated" operator="dilate" radius="10"/>
<feGaussianBlur in="dilated" result="blurred" stdDeviation="5"/>
<feMerge>
  <feMergeNode in="blurred"/>
  <feMergeNode in="SourceGraphic"/>
</feMerge>
</filter>`,
}

export function generateGlow(color: keyof typeof GLOW) {
  return `<svg height="515" width="115">
  <defs>
    <symbol id="bg" viewBox="0 0 302.22 1333.94">
      <path d="M0.01 168.12l0 -9.64c4.32,-21.34 12,-32.33 25.46,-25.58 -2.35,-10.3 -1.53,-26.06 5.79,-25.96 19.18,0.25 29.95,-3.14 40.24,-13.16 -4.5,-66.43 51.39,-54.26 79.61,-93.78l0 0c28.22,39.52 84.1,27.34 79.61,93.78 10.29,10.02 21.06,13.41 40.24,13.16 7.32,-0.1 8.13,15.66 5.79,25.96 13.46,-6.75 21.14,4.24 25.46,25.58l0 9.64 0.01 0 0 1004.21 -0.01 0 0 3.13c-4.32,21.34 -12,32.33 -25.46,25.58 2.35,10.3 1.53,26.06 -5.79,25.96 -19.18,-0.25 -29.95,3.14 -40.24,13.16 4.5,66.43 -51.39,54.26 -79.61,93.78l0 0c-28.22,-39.52 -84.1,-27.34 -79.61,-93.78 -10.29,-10.02 -21.06,-13.41 -40.24,-13.16 -7.32,0.1 -8.13,-15.66 -5.79,-25.96 -13.46,6.75 -21.14,-4.24 -25.46,-25.58l0 -3.13 -0.01 0 0 -1004.21 0.01 0z"/>
    </symbol>
    ${GLOW[color]}
  </defs>
  <use href="#bg" style="filter:url(#${color.toLowerCase()}-glow)" width="100%" fill="${
    Colors[color]
  }" height="100%"/>
</svg>`
}
