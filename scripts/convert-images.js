import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public/images');

async function convertRecursively(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            await convertRecursively(filePath);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                const webpPath = filePath.replace(ext, '.webp');
                console.log(`Converting: ${file} -> ${path.basename(webpPath)}`);

                try {
                    await sharp(filePath)
                        .webp({ quality: 80 })
                        .toFile(webpPath);

                    // Delete original
                    fs.unlinkSync(filePath);
                    console.log(`Deleted: ${file}`);
                } catch (err) {
                    console.error(`Error converting ${file}:`, err);
                }
            }
        }
    }
}

console.log('Starting WebP conversion...');
if (fs.existsSync(PUBLIC_DIR)) {
    await convertRecursively(PUBLIC_DIR);
    console.log('Conversion complete!');
} else {
    console.error('Directory not found:', PUBLIC_DIR);
}
