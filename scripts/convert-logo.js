import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_ASSETS_DIR = path.join(__dirname, '../src/assets');

async function convertAssets() {
    const file = 'microsun-logo.png';
    const filePath = path.join(SRC_ASSETS_DIR, file);

    if (fs.existsSync(filePath)) {
        const webpPath = filePath.replace('.png', '.webp');
        console.log(`Converting: ${file} -> ${path.basename(webpPath)}`);

        try {
            await sharp(filePath)
                .webp({ quality: 90 }) // Slightly higher quality for logo
                .toFile(webpPath);

            console.log(`Created: ${webpPath}`);
            // Optional: fs.unlinkSync(filePath); 
            // I'll keep the original for a moment just in case, but code will switch to webp
        } catch (err) {
            console.error(`Error converting ${file}:`, err);
        }
    } else {
        console.error('Logo file not found:', filePath);
    }
}

console.log('Starting Asset conversion...');
convertAssets();
