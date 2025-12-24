import { CubismFramework } from './live2dcubismframework';
import { ICubismAllocator } from './icubismallcator';

export class LAppAllocator implements ICubismAllocator {
    /**
     * Allocate memory.
     * @param size Size to allocate.
     * @return Allocated memory address.
     */
    public allocate(size: number): any {
        // In the standard sample LAppAllocator.ts:
        return new ArrayBuffer(size);
    }

    /**
     * Deallocate memory.
     * @param memory Address to deallocate.
     */
    public deallocate(memory: any): void {
        // In JS/TS, garbage collection handles this, usually no-op or setting to undefined.
        // Standard sample often leaves this empty or just nulls reference.
    }

    /**
     * Allocate aligned memory.
     * @param size Size to allocate.
     * @param alignment Alignment.
     * @return Allocated memory address.
     */
    public allocateAligned(size: number, alignment: number): any {
        // JS doesn't support manual alignment easily, but mostly needed for WebAssembly or specific TypeArray views.
        // Standard implementation:
        return this.allocate(size);
    }

    /**
     * Deallocate aligned memory.
     * @param alignedMemory Address to deallocate.
     */
    public deallocateAligned(alignedMemory: any): void {
        this.deallocate(alignedMemory);
    }
}
