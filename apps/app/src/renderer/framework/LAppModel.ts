import { CubismUserModel } from './model/cubismusermodel';
import { CubismModelSettingJson } from './cubismmodelsettingjson';
import { LAppTextureManager } from './LAppTextureManager';
import { CubismDefaultParameterId } from './cubismdefaultparameterid';
import { CubismFramework } from './live2dcubismframework';
import { CubismMatrix44 } from './math/cubismmatrix44';
import { CubismId } from './id/cubismid';

// ==================== Constants ====================
const HEAD_ANGLE_MULTIPLIER = 30;      // ParamAngleX/Y range: -30 to 30
const BODY_ANGLE_MULTIPLIER = 10;      // ParamBodyAngleX range: -10 to 10
const MOUSE_VELOCITY_SCALE = 10;       // Scale factor for mouse velocity
const HAIR_DAMPING_FACTOR = 0.95;      // Damping for smooth hair motion decay
const HAIR_SWAY_STRENGTH = 0.5;        // Strength of hair sway response
const HAIR_SIDE_RATIO = 0.7;           // Hair side sway ratio relative to front
const HAIR_BACK_RATIO = 0.5;           // Hair back sway ratio relative to front
const MODEL_DEFAULT_HEIGHT = 2.0;      // Default model height scale

// ==================== Utility Functions ====================
const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

export class LAppModel extends CubismUserModel {
    private _modelSetting: CubismModelSettingJson | null = null;
    private _modelHomeDir: string = '';
    private _isLoaded: boolean = false;

    // Hair movement tracking
    private _lastMouseX: number = 0;
    private _lastMouseY: number = 0;
    private _hairSwayX: number = 0;
    private _hairSwayY: number = 0;

    // Cached parameter IDs (initialized on first update)
    private _paramIds: {
        angleX: CubismId | null;
        angleY: CubismId | null;
        eyeBallX: CubismId | null;
        eyeBallY: CubismId | null;
        bodyAngleX: CubismId | null;
        hairFront: CubismId | null;
        hairSide: CubismId | null;
        hairBack: CubismId | null;
    } = {
            angleX: null,
            angleY: null,
            eyeBallX: null,
            eyeBallY: null,
            bodyAngleX: null,
            hairFront: null,
            hairSide: null,
            hairBack: null,
        };

    constructor() {
        super();
        this._modelSetting = null;
        this._isLoaded = false;
    }

    /**
     * Cache parameter IDs to avoid repeated lookups every frame
     */
    private _cacheParameterIds(): void {
        if (this._paramIds.angleX !== null) return; // Already cached

        const idManager = CubismFramework.getIdManager();
        this._paramIds = {
            angleX: idManager.getId(CubismDefaultParameterId.ParamAngleX),
            angleY: idManager.getId(CubismDefaultParameterId.ParamAngleY),
            eyeBallX: idManager.getId(CubismDefaultParameterId.ParamEyeBallX),
            eyeBallY: idManager.getId(CubismDefaultParameterId.ParamEyeBallY),
            bodyAngleX: idManager.getId(CubismDefaultParameterId.ParamBodyAngleX),
            hairFront: idManager.getId(CubismDefaultParameterId.ParamHairFront),
            hairSide: idManager.getId(CubismDefaultParameterId.ParamHairSide),
            hairBack: idManager.getId(CubismDefaultParameterId.ParamHairBack),
        };
    }

    public async loadAssets(dir: string, fileName: string, textureManager: LAppTextureManager, gl: WebGLRenderingContext): Promise<void> {
        try {
            this._modelHomeDir = dir;
            window.electronAPI.log(`LAppModel.loadAssets: Starting load from ${dir}${fileName}`);

            const path = `${dir}${fileName}`;
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Model request failed: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();

            this._modelSetting = new CubismModelSettingJson(arrayBuffer, arrayBuffer.byteLength);

            // Load moc3
            const mocFileName = this._modelSetting.getModelFileName();
            if (mocFileName != '') {
                const mocPath = `${this._modelHomeDir}${mocFileName}`;
                window.electronAPI.log(`LAppModel.loadAssets: Loading moc3 from ${mocPath}`);
                const mocResp = await fetch(mocPath);
                if (!mocResp.ok) throw new Error(`Moc request failed: ${mocResp.status}`);
                const mocBuffer = await mocResp.arrayBuffer();
                this.loadModel(mocBuffer);
            }

            // Create Renderer
            window.electronAPI.log('LAppModel.loadAssets: Creating renderer');
            this.createRenderer();
            this.getRenderer().startUp(gl);
            this.getRenderer().setIsPremultipliedAlpha(true);

            // Load Textures
            const textureCount = this._modelSetting.getTextureCount();
            window.electronAPI.log(`LAppModel.loadAssets: Loading ${textureCount} textures`);
            for (let i = 0; i < textureCount; i++) {
                const textureFileName = this._modelSetting.getTextureFileName(i);
                const texturePath = `${this._modelHomeDir}${textureFileName}`;
                window.electronAPI.log(`LAppModel.loadAssets: Loading texture[${i}] from ${texturePath}`);

                const textureInfo = await textureManager.createTextureFromPngFile(gl, texturePath, true);
                if (!textureInfo) throw new Error(`Texture load failed: ${texturePath}`);
                this.getRenderer().bindTexture(i, textureInfo.id);
            }

            // Load Physics
            const physicsFileName = this._modelSetting.getPhysicsFileName();
            if (physicsFileName != '') {
                const physicsPath = `${this._modelHomeDir}${physicsFileName}`;
                window.electronAPI.log(`LAppModel.loadAssets: Loading physics from ${physicsPath}`);
                const physicsResp = await fetch(physicsPath);
                if (physicsResp.ok) {
                    const physicsBuffer = await physicsResp.arrayBuffer();
                    this.loadPhysics(physicsBuffer, physicsBuffer.byteLength);
                }
            }

            // Load Pose (controls which parts are visible, e.g., arm variations)
            const poseFileName = this._modelSetting.getPoseFileName();
            if (poseFileName != '') {
                const posePath = `${this._modelHomeDir}${poseFileName}`;
                window.electronAPI.log(`LAppModel.loadAssets: Loading pose from ${posePath}`);
                const poseResp = await fetch(posePath);
                if (poseResp.ok) {
                    const poseBuffer = await poseResp.arrayBuffer();
                    this.loadPose(poseBuffer, poseBuffer.byteLength);
                }
            }

            // Adjust model's size and position - center in viewport
            // The viewport range is -1 to 1, so we need to scale appropriately
            this._modelMatrix.setHeight(MODEL_DEFAULT_HEIGHT);
            // Center the model (don't offset to bottom)
            this._modelMatrix.setY(0);

            this._isLoaded = true;
            window.electronAPI.log(`LAppModel.loadAssets: Live2D Model Loaded Successfully: ${fileName}`);
        } catch (e: any) {
            window.electronAPI.log(`LAppModel.loadAssets error: ${e.message || e}`);
            console.error('LAppModel.loadAssets error:', e);
            this._isLoaded = false;
        }
    }

    public update(deltaTimeSeconds: number, mouseX: number = 0, mouseY: number = 0): void {
        if (!this._isLoaded || !this.getModel()) return;

        // Cache parameter IDs on first update for better performance
        this._cacheParameterIds();

        const model = this.getModel();
        model.loadParameters();

        // Calculate head and eye movement based on mouse position
        // mouseX, mouseY are in range -1 to 1
        const headAngleX = mouseX * HEAD_ANGLE_MULTIPLIER;
        const headAngleY = mouseY * HEAD_ANGLE_MULTIPLIER;
        const bodyAngleX = mouseX * BODY_ANGLE_MULTIPLIER;

        // Calculate hair sway based on mouse movement velocity
        const mouseVelocityX = (mouseX - this._lastMouseX) * MOUSE_VELOCITY_SCALE;
        const mouseVelocityY = (mouseY - this._lastMouseY) * MOUSE_VELOCITY_SCALE;
        this._lastMouseX = mouseX;
        this._lastMouseY = mouseY;

        // Apply velocity to hair sway with damping for smooth motion
        this._hairSwayX = this._hairSwayX * HAIR_DAMPING_FACTOR + mouseVelocityX * HAIR_SWAY_STRENGTH;
        this._hairSwayY = this._hairSwayY * HAIR_DAMPING_FACTOR + mouseVelocityY * HAIR_SWAY_STRENGTH;

        // Clamp hair sway values to valid range (-1 to 1)
        this._hairSwayX = clamp(this._hairSwayX, -1, 1);
        this._hairSwayY = clamp(this._hairSwayY, -1, 1);

        // Apply parameters using cached IDs (much faster than looking up every frame)
        model.setParameterValueById(this._paramIds.angleX!, headAngleX);
        model.setParameterValueById(this._paramIds.angleY!, headAngleY);
        model.setParameterValueById(this._paramIds.eyeBallX!, mouseX);
        model.setParameterValueById(this._paramIds.eyeBallY!, mouseY);
        model.setParameterValueById(this._paramIds.bodyAngleX!, bodyAngleX);

        // Apply hair sway with proportional values
        model.setParameterValueById(this._paramIds.hairFront!, this._hairSwayX);
        model.setParameterValueById(this._paramIds.hairSide!, this._hairSwayX * HAIR_SIDE_RATIO);
        model.setParameterValueById(this._paramIds.hairBack!, this._hairSwayX * HAIR_BACK_RATIO);

        // Apply pose to control which parts are visible
        if (this._pose != null) {
            this._pose.updateParameters(model, deltaTimeSeconds);
        }

        model.saveParameters();
        model.update();
    }

    public draw(matrix: CubismMatrix44): void {
        if (!this._isLoaded || this._model == null || this.getRenderer() == null) {
            return;
        }

        // matrix.multiplyByMatrix(m) computes: m * matrix (and stores in matrix)
        // So this gives: modelMatrix * projection, which for column-major is the correct MVP order
        matrix.multiplyByMatrix(this._modelMatrix);

        this.getRenderer().setMvpMatrix(matrix);
        this.getRenderer().drawModel();
    }

    /**
     * Set the model's scale and Y position
     * @param scale Model height scale (2.0 = full body, 4.0 = upper body zoom)
     * @param offsetY Y offset (-0.5 = shift down to show upper body)
     */
    public setModelTransform(scale: number, offsetY: number): void {
        this._modelMatrix.setHeight(scale);
        this._modelMatrix.setY(offsetY);
    }
}
