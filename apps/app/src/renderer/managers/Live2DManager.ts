import { CubismFramework, Option } from '../framework/live2dcubismframework';
import { LAppAllocator } from '../framework/LAppAllocator';
import { LAppModel } from '../framework/LAppModel';
import { LAppTextureManager } from '../framework/LAppTextureManager';
import { CubismMatrix44 } from '../framework/math/cubismmatrix44';

export class Live2DManager {
    private static _instance: Live2DManager | null = null;
    private static _isInitialized: boolean = false; // Static to persist across StrictMode remounts
    private static _initializingCanvas: string | null = null; // Track which canvas is being initialized

    private _allocator: LAppAllocator | null = null;
    private _isModelLoading: boolean = false;

    // @ts-ignore
    private _canvas: HTMLCanvasElement | null = null;
    private _gl: WebGLRenderingContext | null = null;
    private _model: LAppModel | null = null;
    private _textureManager: LAppTextureManager | null = null;

    private _viewMatrix: CubismMatrix44 | null = null;
    private _projection: CubismMatrix44 | null = null;
    private _deviceToScreen: CubismMatrix44 | null = null;

    private _requestId: number = 0;
    private _lastFrameTime: number = 0;

    // Mouse interaction
    private _mouseX: number = 0;
    private _mouseY: number = 0;
    private _syncEnabled: boolean = false;
    private _cleanupSync: (() => void) | null = null;

    public static getInstance(): Live2DManager {
        if (this._instance === null) {
            this._instance = new Live2DManager();
        }
        return this._instance;
    }

    public static releaseInstance(): void {
        if (this._instance !== null) {
            this._instance.release();
            this._instance = null;
            // Don't reset _isInitialized here - let it persist across StrictMode remounts
        }
    }

    public initialize(canvas: HTMLCanvasElement): boolean {
        window.electronAPI.log(`Live2DManager.initialize called (id=${canvas.id})`);

        // Early return if already initialized with the same canvas
        if (Live2DManager._isInitialized) {
            if (this._canvas === canvas) {
                window.electronAPI.log('Already initialized with same canvas');
                return true;
            }
            // Clean up before re-initializing with different canvas
            window.electronAPI.log('Canvas changed, cleaning up and re-initializing');
            this.cleanupModel();
            this._canvas = canvas;
            this._gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
            if (this._gl) {
                this._gl.enable(this._gl.BLEND);
                this._gl.blendFunc(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
            }
            this.loadModel();
            this.resizeCanvas();
            return true;
        }

        // Set initialized flag immediately to prevent duplicate initialization from StrictMode
        Live2DManager._isInitialized = true;
        this._canvas = canvas;

        this._gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
        if (this._gl) {
            window.electronAPI.log(`WebGL context created successfully for canvas: ${canvas.id}`);
        } else {
            window.electronAPI.log(`Failed to get WebGL context for canvas: ${canvas.id}`);
            Live2DManager._isInitialized = false;
            return false;
        }

        this._gl.enable(this._gl.BLEND);
        this._gl.blendFunc(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);

        this._allocator = new LAppAllocator();
        this._textureManager = new LAppTextureManager();

        const option: Option = {
            logFunction: (message: string) => console.log(message),
            loggingLevel: 4, // Verbose
        };

        CubismFramework.startUp(option);
        CubismFramework.initialize();

        this._viewMatrix = new CubismMatrix44();
        this._projection = new CubismMatrix44();
        this._deviceToScreen = new CubismMatrix44();

        this.resizeCanvas();

        this.loadModel();
        this.run();

        return true;
    }

    public async loadModel(): Promise<void> {
        // Check guards first
        if (!this._gl || !this._textureManager) {
            window.electronAPI.log('loadModel: Missing gl or textureManager, skipping');
            return;
        }
        if (this._isModelLoading) {
            window.electronAPI.log('loadModel: Already loading, skipping');
            return;
        }
        if (this._model) {
            window.electronAPI.log('loadModel: Model already exists, skipping');
            return;
        }

        // Set loading flag immediately (synchronously)
        this._isModelLoading = true;
        window.electronAPI.log('loadModel: Starting model load');

        try {
            this._model = new LAppModel();
            await this._model.loadAssets('/live2d/Hiyori/', 'Hiyori.model3.json', this._textureManager, this._gl);
        } catch (e) {
            window.electronAPI.log(`loadModel error: ${e}`);
            this._model = null;
        } finally {
            this._isModelLoading = false;
        }
    }

    /**
     * Set the model's scale and Y position
     * @param scale Model height scale (2.0 = full body, 4.0 = upper body zoom)
     * @param offsetY Y offset (-0.5 = shift down to show upper body)
     */
    public setModelTransform(scale: number, offsetY: number): void {
        if (this._model) {
            this._model.setModelTransform(scale, offsetY);
        }
    }

    public run(): void {
        this._lastFrameTime = performance.now();

        const loop = (time: number) => {
            if (!this._gl || !Live2DManager._isInitialized) return;

            const deltaTime = (time - this._lastFrameTime) / 1000;
            this._lastFrameTime = time;

            // Use transparent background for production
            this._gl.clearColor(0.0, 0.0, 0.0, 0.0);
            this._gl.clear(this._gl.COLOR_BUFFER_BIT);


            try {
                if (this._model && this._model.getRenderer()) {
                    this.resizeCanvas();

                    if (this._canvas.width > 0 && this._canvas.height > 0) {
                        const viewport = [0, 0, this._canvas.width, this._canvas.height];
                        this._model.getRenderer().setRenderState(null, viewport);

                        this._model.update(deltaTime, this._mouseX, this._mouseY);

                        // Match official SDK scaling: LAppLive2DManager.onUpdate()
                        this._projection.loadIdentity();
                        const canvasWidth = this._canvas.width;
                        const canvasHeight = this._canvas.height;

                        // Official SDK: projection.scale(height / width, 1.0)
                        this._projection.scale(canvasHeight / canvasWidth, 1.0);



                        // Create a copy of projection for drawing (model.draw modifies the matrix)
                        const projectionCopy = this._projection.clone();
                        this._model.draw(projectionCopy);

                    }
                }
            } catch (e) {
                console.error('Live2D Render Error:', e);
                window.electronAPI.log(`Live2D Render Error: ${e}`);
            }

            this._requestId = requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    public resizeCanvas(): void {
        const canvas = this._canvas;
        if (!canvas || !this._gl) return;

        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(canvas.clientWidth * dpr);
        const displayHeight = Math.floor(canvas.clientHeight * dpr);

        if (displayWidth === 0 || displayHeight === 0) return;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            this._gl.viewport(0, 0, displayWidth, displayHeight);
        }
    }

    /**
     * Handle mouse move event - converts screen coords to model space
     * @param x Mouse X position relative to canvas
     * @param y Mouse Y position relative to canvas
     * @param broadcast Whether to broadcast this movement to other windows (default: true)
     */
    public onMouseMove(x: number, y: number, broadcast: boolean = true): void {
        if (!this._canvas) return;

        // Convert to normalized coordinates (-1 to 1)
        // X: left=-1, right=1
        // Y: top=1, bottom=-1 (inverted because screen Y is top-to-bottom)
        this._mouseX = (x / this._canvas.clientWidth) * 2 - 1;
        this._mouseY = -((y / this._canvas.clientHeight) * 2 - 1);

        // Broadcast to other windows if sync is enabled
        if (broadcast && this._syncEnabled && window.electronAPI?.syncAvatarMovement) {
            window.electronAPI.syncAvatarMovement(this._mouseX, this._mouseY);
        }
    }

    /**
     * Set mouse position directly in model space (used for sync from other windows)
     * @param mouseX X position in model space (-1 to 1)
     * @param mouseY Y position in model space (-1 to 1)
     */
    public setMousePosition(mouseX: number, mouseY: number): void {
        this._mouseX = mouseX;
        this._mouseY = mouseY;
    }

    /**
     * Enable sync between windows
     * When enabled, mouse movements will be broadcast to other windows
     * and this instance will listen for movements from other windows
     */
    public enableSync(): void {
        if (this._syncEnabled) return;
        this._syncEnabled = true;

        // Listen for movement updates from other windows
        if (window.electronAPI?.onAvatarMovementUpdate) {
            this._cleanupSync = window.electronAPI.onAvatarMovementUpdate((mouseX, mouseY) => {
                this.setMousePosition(mouseX, mouseY);
            });
        }
    }

    /**
     * Disable sync between windows
     */
    public disableSync(): void {
        this._syncEnabled = false;
        if (this._cleanupSync) {
            this._cleanupSync();
            this._cleanupSync = null;
        }
    }

    /**
     * Get current mouse X in model space (-1 to 1)
     */
    public getMouseX(): number {
        return this._mouseX;
    }

    /**
     * Get current mouse Y in model space (-1 to 1)
     */
    public getMouseY(): number {
        return this._mouseY;
    }

    private cleanupModel(): void {
        if (this._model) {
            this._model.release();
            this._model = null;
        }
        this._isModelLoading = false;
    }

    public release(): void {
        cancelAnimationFrame(this._requestId);
        this.disableSync();
        this.cleanupModel();

        if (this._textureManager) {
            this._textureManager.release();
            this._textureManager = null;
        }

        CubismFramework.dispose();
        Live2DManager._isInitialized = false;
        this._allocator = null;
        this._gl = null;
        this._canvas = null;
    }
}
