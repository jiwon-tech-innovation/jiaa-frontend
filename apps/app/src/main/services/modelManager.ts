import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import AdmZip from 'adm-zip';

import { MODEL_NAME } from '../../common/constants';
const MODEL_URL = `https://project-jiaa-images.s3.ap-northeast-2.amazonaws.com/${encodeURIComponent(MODEL_NAME)}.zip`;

let currentDownloadPromise: Promise<{ success: boolean; error?: string }> | null = null;

export const getModelDirectory = () => {
    return path.join(app.getPath('userData'), 'live2d', MODEL_NAME);
};

export const checkModelExists = () => {
    const modelPath = path.join(getModelDirectory(), `${MODEL_NAME}.model3.json`);
    return fs.existsSync(modelPath);
};

const repairModelJson = (modelDir: string) => {
    const jsonPath = path.join(modelDir, `${MODEL_NAME}.model3.json`);
    if (!fs.existsSync(jsonPath)) {
        console.warn(`[ModelManager] repairModelJson: ${jsonPath} not found`);
        return;
    }

    try {
        const content = fs.readFileSync(jsonPath, 'utf8');
        const json = JSON.parse(content);

        // Recursive function to replace '椿' with MODEL_NAME in string values
        const fixStrings = (obj: any) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    // Replace '椿' which seems to be a hardcoded prefix in some models
                    if (obj[key].includes('椿')) {
                        const oldVal = obj[key];
                        obj[key] = obj[key].replace(/椿/g, MODEL_NAME);
                        console.log(`[ModelManager] Repaired reference: ${oldVal} -> ${obj[key]}`);
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    fixStrings(obj[key]);
                }
            }
        };

        fixStrings(json);

        fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf8');
        console.log(`[ModelManager] repairModelJson complete for ${jsonPath}`);
    } catch (err) {
        console.error(`[ModelManager] repairModelJson error:`, err);
    }
};

export const downloadAndExtractModel = async (onProgress?: (progress: number) => void) => {
    if (currentDownloadPromise) {
        console.log('[ModelManager] Download already in progress, waiting for existing promise...');
        return currentDownloadPromise;
    }

    if (checkModelExists()) {
        console.log('[ModelManager] Model already exists, skipping download');
        return { success: true };
    }

    currentDownloadPromise = (async () => {
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

            const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
                writer.on('finish', () => {
                    console.log(`[ModelManager] Download complete, extracting to ${live2dBaseDir}`);
                    try {
                        const zip = new AdmZip(zipPath);
                        zip.extractAllTo(live2dBaseDir, true);
                        console.log(`[ModelManager] Extraction complete`);

                        // Repair JSON references if necessary
                        repairModelJson(path.join(live2dBaseDir, MODEL_NAME));

                        // Clean up zip file
                        if (fs.existsSync(zipPath)) {
                            fs.unlinkSync(zipPath);
                        }
                        resolve({ success: true });
                    } catch (err: any) {
                        console.error(`[ModelManager] Extraction error:`, err);
                        resolve({ success: false, error: err.message });
                    }
                });

                writer.on('error', (err) => {
                    console.error(`[ModelManager] Writer error:`, err);
                    if (fs.existsSync(zipPath)) {
                        fs.unlinkSync(zipPath);
                    }
                    resolve({ success: false, error: err.message });
                });
            });

            return result;
        } catch (err: any) {
            console.error(`[ModelManager] Download error:`, err);
            return { success: false, error: err.message };
        } finally {
            currentDownloadPromise = null;
        }
    })();

    return currentDownloadPromise;
};
