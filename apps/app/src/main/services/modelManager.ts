import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import AdmZip from 'adm-zip';

const MODEL_URL = 'https://project-jiaa-images.s3.ap-northeast-2.amazonaws.com/Hiyori.zip';
const MODEL_NAME = 'Hiyori';

export const getModelDirectory = () => {
    return path.join(app.getPath('userData'), 'live2d', MODEL_NAME);
};

export const checkModelExists = () => {
    const modelPath = path.join(getModelDirectory(), 'Hiyori.model3.json');
    return fs.existsSync(modelPath);
};

export const downloadAndExtractModel = async (onProgress?: (progress: number) => void) => {
    const live2dBaseDir = path.join(app.getPath('userData'), 'live2d');

    if (!fs.existsSync(live2dBaseDir)) {
        fs.mkdirSync(live2dBaseDir, { recursive: true });
    }

    const zipPath = path.join(app.getPath('temp'), `${MODEL_NAME}.zip`);

    try {
        console.log(`[ModelManager] Starting download from ${MODEL_URL}`);
        const response = await axios({
            url: MODEL_URL,
            method: 'GET',
            responseType: 'stream',
        });

        const totalLength = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedLength = 0;

        const writer = fs.createWriteStream(zipPath);
        response.data.pipe(writer);

        response.data.on('data', (chunk: Buffer) => {
            downloadedLength += chunk.length;
            if (onProgress && totalLength > 0) {
                const progress = Math.round((downloadedLength / totalLength) * 100);
                onProgress(progress);
            }
        });

        return new Promise<{ success: boolean; error?: string }>((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`[ModelManager] Download complete, extracting to ${live2dBaseDir}`);
                try {
                    const zip = new AdmZip(zipPath);
                    zip.extractAllTo(live2dBaseDir, true);
                    console.log(`[ModelManager] Extraction complete`);

                    // Clean up zip file
                    fs.unlinkSync(zipPath);
                    resolve({ success: true });
                } catch (err: any) {
                    console.error(`[ModelManager] Extraction error:`, err);
                    resolve({ success: false, error: err.message });
                }
            });

            writer.on('error', (err) => {
                console.error(`[ModelManager] Writer error:`, err);
                resolve({ success: false, error: err.message });
            });
        });
    } catch (err: any) {
        console.error(`[ModelManager] Download error:`, err);
        return { success: false, error: err.message };
    }
};
