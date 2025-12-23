
export class TextureInfo {
    id: WebGLTexture | null = null;
    width: number = 0;
    height: number = 0;
    useCount: number = 0;
    imgpath: string = '';
}

export class LAppTextureManager {
    _textures: TextureInfo[] = [];

    /**
     * Release all textures.
     */
    public release(): void {
        for (let i = 0; i < this._textures.length; i++) {
            this._textures[i].id = null; // In real app, deleteTexture via gl context
        }
        this._textures = [];
    }

    /**
     * Load texture from path.
     * @param gl WebGL context
     * @param fileName File path
     * @param usePremultiply Pre-multiply alpha?
     * @return TextureInfo
     */
    public async createTextureFromPngFile(
        gl: WebGLRenderingContext,
        fileName: string,
        usePremultiply: boolean
    ): Promise<TextureInfo> {
        // Check cache
        for (const info of this._textures) {
            if (info.imgpath === fileName) {
                info.useCount++;
                return info;
            }
        }

        const texture = gl.createTexture();
        const textureInfo = new TextureInfo();
        textureInfo.id = texture;
        textureInfo.imgpath = fileName;
        textureInfo.useCount = 1;

        // Placeholder until load
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                window.electronAPI.log(`LAppTextureManager: Texture loaded successfully: ${fileName} (${img.width}x${img.height})`);
                textureInfo.width = img.width;
                textureInfo.height = img.height;

                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, usePremultiply ? 1 : 0);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, null);

                this._textures.push(textureInfo);
                resolve(textureInfo);
            };
            img.onerror = () => {
                window.electronAPI.log(`LAppTextureManager: Failed to load texture from ${fileName}`);
                resolve(null as any); // Or reject, but LAppModel expects null check
            };
            img.src = fileName;
        });
    }
}
