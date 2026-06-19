// Pre-rendered, high-fidelity Meridian Ads Pipeline 3D Isometric Cube Logo
import chalk from 'chalk';

export const LOGO_WIDTH = 45;

export function getStaticLogo(leftOffset = 5) {
  const offset = ' '.repeat(leftOffset);
  
  // Custom styled solid block design (back-compatible with standard terminal color spaces)
  const cyan = chalk.hex('#06b6d4');
  const blue = chalk.hex('#3b82f6');
  const magenta = chalk.hex('#d946ef');
  
  const lines = [
    offset + "                              " + cyan("▄▄") + cyan("██") + cyan("▄▄") + "         ",
    offset + "                            " + cyan("▄") + cyan("████████") + cyan("▄") + "       ",
    offset + "                          " + cyan("▄") + cyan("████████████") + cyan("▄") + "     ",
    offset + "                          " + blue("███████") + blue("▌") + magenta("▐") + magenta("███████") + "   ",
    offset + "                  " + cyan("▄▄") + cyan("██") + cyan("▄▄") + "  " + blue("███████") + blue("▌") + magenta("▐") + magenta("███████") + "   ",
    offset + "                " + cyan("▄") + cyan("████████") + cyan("▄") + blue("███████") + blue("▌") + magenta("▐") + magenta("███████") + "   ",
    offset + "              " + cyan("▄") + cyan("████████████") + cyan("▄") + blue("█████") + blue("▌") + magenta("▐") + magenta("█████") + magenta("▀") + "    ",
    offset + "              " + blue("███████") + blue("▌") + magenta("▐") + magenta("███████") + blue("███") + blue("▌") + magenta("▐") + magenta("███") + magenta("▀") + "      ",
    offset + "      " + cyan("▄▄") + cyan("██") + cyan("▄▄") + "  " + blue("███████") + blue("▌") + magenta("▐") + magenta("███████") + " " + blue("▀▀") + blue("▌") + magenta("▐") + magenta("▀▀") + "        ",
    offset + "    " + cyan("▄") + cyan("████████") + cyan("▄") + blue("███████") + blue("▌") + magenta("▐") + magenta("███████") + "               ",
    offset + "  " + cyan("▄") + cyan("████████████") + cyan("▄") + blue("█████") + blue("▌") + magenta("▐") + magenta("█████") + magenta("▀") + "                ",
    offset + "  " + blue("███████") + blue("▌") + magenta("▐") + magenta("███████") + blue("███") + blue("▌") + magenta("▐") + magenta("███") + magenta("▀") + "                  ",
    offset + "  " + blue("███████") + blue("▌") + magenta("▐") + magenta("███████") + " " + blue("▀▀") + blue("▌") + magenta("▐") + magenta("▀▀") + "                    ",
    offset + "  " + blue("███████") + blue("▌") + magenta("▐") + magenta("███████") + "                           ",
    offset + "   " + blue("▀") + blue("█████") + blue("▌") + magenta("▐") + magenta("█████") + magenta("▀") + "                            ",
    offset + "     " + blue("▀") + blue("███") + blue("▌") + magenta("▐") + magenta("███") + magenta("▀") + "                              ",
    offset + "       " + blue("▀▀") + blue("▌") + magenta("▐") + magenta("▀▀") + "                                ",
    offset + "                                             ",
  ];
  return lines.join('\n');
}
