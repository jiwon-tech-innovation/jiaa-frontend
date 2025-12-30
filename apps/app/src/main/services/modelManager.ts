import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import AdmZip from 'adm-zip';


let currentDownloadPromise: Promise<{ success: boolean; error?: string }> | null = null;

export const getModelDirectory = (modelName: string) => {
    return path.join(app.getPath('userData'), 'live2d', modelName);
};

export const checkModelExists = (modelName: string) => {
    const modelDir = getModelDirectory(modelName);
    if (!fs.existsSync(modelDir)) return false;

    const exactPath = path.join(modelDir, `${modelName}.model3.json`);
    if (fs.existsSync(exactPath)) return true;

    // Fallback: search for any .model3.json in the directory
    try {
        const files = fs.readdirSync(modelDir);
        return files.some(file => file.endsWith('.model3.json'));
    } catch (err) {
        console.error(`[ModelManager] checkModelExists error for ${modelName}:`, err);
        return false;
    }
};

const repairModelJson = (modelDir: string, modelName: string) => {
    try {
        // Find the main .model3.json in this directory
        const files = fs.readdirSync(modelDir);
        let jsonPath = path.join(modelDir, `${modelName}.model3.json`);

        if (!fs.existsSync(jsonPath)) {
            const foundJson = files.find(f => f.endsWith('.model3.json'));
            if (foundJson) {
                const oldPath = path.join(modelDir, foundJson);
                fs.renameSync(oldPath, jsonPath);
                console.log(`[ModelManager] Renamed ${foundJson} -> ${modelName}.model3.json`);
            } else {
                console.warn(`[ModelManager] No .model3.json found in ${modelDir}`);
                return;
            }
        }

        const content = fs.readFileSync(jsonPath, 'utf8');
        let json = JSON.parse(content);

        // Recursive function to replace original prefixes with modelName
        // We look for common patterns like '椿' or the original filename stem
        const originalStem = files.find(f => f.endsWith('.moc3'))?.replace('.moc3', '');

        const fixStrings = (obj: any) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    let val = obj[key];
                    // Replace '椿'
                    val = val.replace(/椿/g, modelName);
                    // Replace original stem if found (e.g., if extracting "Angel MaidFix1" but folder is "Angel Maid")
                    if (originalStem && val.includes(originalStem)) {
                        val = val.replace(new RegExp(originalStem, 'g'), modelName);
                    }
                    obj[key] = val;
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    fixStrings(obj[key]);
                }
            }
        };

        fixStrings(json);
        fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf8');
        console.log(`[ModelManager] repairModelJson complete for ${modelName}`);

        // Also rename the .moc3, .physics3.json etc. if they don't match
        fs.readdirSync(modelDir).forEach(file => {
            if (file.includes('椿') || (originalStem && file.includes(originalStem))) {
                const newName = file.replace(/椿/g, modelName).replace(new RegExp(originalStem || '', 'g'), modelName);
                if (newName !== file) {
                    fs.renameSync(path.join(modelDir, file), path.join(modelDir, newName));
                    console.log(`[ModelManager] Renamed asset: ${file} -> ${newName}`);
                }
            }
        });

    } catch (err) {
        console.error(`[ModelManager] repairModelJson error:`, err);
    }
};

export const downloadAndExtractModel = async (modelName: string, modelUrl: string, onProgress?: (progress: number) => void) => {
    if (currentDownloadPromise) {
        console.log('[ModelManager] Download already in progress, waiting for existing promise...');
        return currentDownloadPromise;
    }

    // Force check for repair even if it exists
    if (checkModelExists(modelName)) {
        console.log(`[ModelManager] Model ${modelName} exists, performing health check/repair`);
        repairModelJson(getModelDirectory(modelName), modelName);
        return { success: true };
    }

    currentDownloadPromise = (async () => {
        const live2dBaseDir = path.join(app.getPath('userData'), 'live2d');
        const tempExtractDir = path.join(app.getPath('temp'), `extract_${modelName}_${Date.now()}`);

        if (!fs.existsSync(live2dBaseDir)) fs.mkdirSync(live2dBaseDir, { recursive: true });
        if (!fs.existsSync(tempExtractDir)) fs.mkdirSync(tempExtractDir, { recursive: true });

        const zipPath = path.join(app.getPath('temp'), `${modelName}.zip`);

        try {
            console.log(`[ModelManager] Starting download from ${modelUrl}`);
            const response = await axios({ url: modelUrl, method: 'GET', responseType: 'stream' });

            const totalLength = parseInt(response.headers['content-length'] || '0', 10);
            let downloadedLength = 0;

            const writer = fs.createWriteStream(zipPath);
            response.data.pipe(writer);

            response.data.on('data', (chunk: Buffer) => {
                downloadedLength += chunk.length;
                if (onProgress && totalLength > 0) {
                    onProgress(Math.round((downloadedLength / totalLength) * 100));
                }
            });

            const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
                writer.on('finish', () => {
                    try {
                        console.log(`[ModelManager] Extracting to ${tempExtractDir}`);
                        const zip = new AdmZip(zipPath);
                        zip.extractAllTo(tempExtractDir, true);

                        // Find the model folder (could be top-level or inside another folder)
                        let sourceDir = tempExtractDir;
                        const findModelDir = (dir: string): string | null => {
                            const files = fs.readdirSync(dir);
                            if (files.some(f => f.endsWith('.model3.json'))) return dir;
                            for (const f of files) {
                                const fullPath = path.join(dir, f);
                                if (fs.statSync(fullPath).isDirectory()) {
                                    const found = findModelDir(fullPath);
                                    if (found) return found;
                                }
                            }
                            return null;
                        };

                        const actualModelDir = findModelDir(tempExtractDir);
                        if (!actualModelDir) throw new Error('Could not find model files in zip');

                        const targetDir = getModelDirectory(modelName);
                        if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });

                        // Move the correct folder to the target location
                        fs.renameSync(actualModelDir, targetDir);
                        console.log(`[ModelManager] Moved ${actualModelDir} -> ${targetDir}`);

                        repairModelJson(targetDir, modelName);

                        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
                        if (fs.existsSync(tempExtractDir)) fs.rmSync(tempExtractDir, { recursive: true, force: true });

                        resolve({ success: true });
                    } catch (err: any) {
                        console.error(`[ModelManager] Extraction/Post-process error:`, err);
                        resolve({ success: false, error: err.message });
                    }
                });
                writer.on('error', (err) => resolve({ success: false, error: err.message }));
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

