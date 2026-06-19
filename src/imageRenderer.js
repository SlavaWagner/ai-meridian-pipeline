import fs from 'fs';
import { PNG } from 'pngjs';
import chalk from 'chalk';

/**
 * Reads a PNG image file and downsamples it into a high-fidelity ANSI colored 
 * terminal pixel representation using half-height blocks (▀) for double vertical resolution.
 * 
 * @param {string} imagePath Absolute path to the source PNG file
 * @param {number} targetWidth The target terminal columns width (defaults to 76)
 * @returns {Promise<string>} The parsed and formatted ANSI color string block
 */
export function renderPixelImage(imagePath, targetWidth = 76, leftOffset = 5) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(imagePath)) {
      return reject(new Error(`Image path not found: ${imagePath}`));
    }

    fs.createReadStream(imagePath)
      .pipe(new PNG())
      .on('parsed', function () {
        const sourceWidth = this.width;
        const sourceHeight = this.height;
        
        // Calculate target height maintaining aspect ratio
        const scale = targetWidth / sourceWidth;
        const targetHeight = Math.round(sourceHeight * scale);
        
        // Ensure height is even for pairing top/bottom half blocks
        const finalHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;
        
        let output = '';
        const offsetStr = ' '.repeat(leftOffset);

        // Helper to get average color of a box in source image
        const getAverageColor = (xStart, xEnd, yStart, yEnd) => {
          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          let count = 0;

          // Convert coordinates to integers and clamp within bounds
          const xStartInt = Math.floor(xStart);
          const xEndInt = Math.min(sourceWidth, Math.ceil(xEnd));
          const yStartInt = Math.floor(yStart);
          const yEndInt = Math.min(sourceHeight, Math.ceil(yEnd));

          for (let sy = yStartInt; sy < yEndInt; sy++) {
            for (let sx = xStartInt; sx < xEndInt; sx++) {
              const idx = (sourceWidth * sy + sx) << 2;
              rSum += this.data[idx];
              gSum += this.data[idx + 1];
              bSum += this.data[idx + 2];
              count++;
            }
          }

          // Fallback to nearest neighbor if the area maps to zero pixels
          if (count === 0) {
            const clampX = Math.min(sourceWidth - 1, Math.max(0, Math.floor(xStart)));
            const clampY = Math.min(sourceHeight - 1, Math.max(0, Math.floor(yStart)));
            const idx = (sourceWidth * clampY + clampX) << 2;
            return { r: this.data[idx], g: this.data[idx+1], b: this.data[idx+2] };
          }

          return {
            r: Math.round(rSum / count),
            g: Math.round(gSum / count),
            b: Math.round(bSum / count)
          };
        };
        
        for (let y = 0; y < finalHeight; y += 2) {
          let line = '';
          const yStart1 = (y / finalHeight) * sourceHeight;
          const yEnd1 = ((y + 1) / finalHeight) * sourceHeight;
          const yStart2 = ((y + 1) / finalHeight) * sourceHeight;
          const yEnd2 = ((y + 2) / finalHeight) * sourceHeight;

          for (let x = 0; x < targetWidth; x++) {
            const xStart = (x / targetWidth) * sourceWidth;
            const xEnd = ((x + 1) / targetWidth) * sourceWidth;
            
            // Average top half character cell color
            const c1 = getAverageColor(xStart, xEnd, yStart1, yEnd1);
            
            // Average bottom half character cell color
            const c2 = getAverageColor(xStart, xEnd, yStart2, yEnd2);
            
            // Render upper block with foreground = top pixel, background = bottom pixel
            line += chalk.rgb(c1.r, c1.g, c1.b).bgRgb(c2.r, c2.g, c2.b)('▀');
          }
          // Offset left dynamically to center the graphic
          output += offsetStr + line + '\n';
        }
        
        resolve(output);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}
