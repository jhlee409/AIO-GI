/**
 * Image Converter Utilities
 * Convert BMP images to JPG format to reduce file size
 */

/**
 * Convert BMP file to JPG format using Canvas API
 * @param file - BMP file to convert
 * @returns Promise<File> - Converted JPG file
 */
export async function convertBmpToJpg(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context를 가져올 수 없습니다.'));
                    return;
                }
                
                // Fill white background (JPG doesn't support transparency)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw image to canvas
                ctx.drawImage(img, 0, 0);
                
                // Convert to JPG blob with quality 0.85 for maximum compression
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('JPG 변환에 실패했습니다.'));
                            return;
                        }
                        
                        // Create new File object with JPG extension
                        const fileName = file.name.replace(/\.(bmp|BMP)$/i, '.jpg');
                        const jpgFile = new File([blob], fileName, {
                            type: 'image/jpeg',
                            lastModified: file.lastModified,
                        });
                        
                        const originalSize = (file.size / 1024).toFixed(2);
                        const convertedSize = (blob.size / 1024).toFixed(2);
                        const reduction = ((1 - blob.size / file.size) * 100).toFixed(1);
                        console.log(`BMP 변환 완료: ${file.name} (${originalSize}KB) -> ${fileName} (${convertedSize}KB, ${reduction}% 감소)`);
                        resolve(jpgFile);
                    },
                    'image/jpeg',
                    0.85 // Quality (0.85 = 85% quality for JPG - good balance between size and quality)
                );
            };
            
            img.onerror = () => {
                reject(new Error('이미지를 로드할 수 없습니다.'));
            };
            
            // Load image from file data
            if (e.target?.result) {
                img.src = e.target.result as string;
            } else {
                reject(new Error('파일을 읽을 수 없습니다.'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('파일 읽기 오류가 발생했습니다.'));
        };
        
        // Read file as data URL
        reader.readAsDataURL(file);
    });
}

/**
 * Check if file is a BMP image
 * @param file - File to check
 * @returns boolean - True if file is BMP
 */
export function isBmpFile(file: File): boolean {
    return file.type === 'image/bmp' || 
           file.type === 'image/x-ms-bmp' ||
           /\.bmp$/i.test(file.name);
}

/**
 * Check if file is an image (BMP, PNG, JPG/JPEG)
 * @param file - File to check
 * @returns boolean - True if file is a supported image format
 */
export function isImageFile(file: File): boolean {
    const imageTypes = [
        'image/bmp',
        'image/x-ms-bmp',
        'image/png',
        'image/jpeg',
        'image/jpg',
    ];
    
    return imageTypes.includes(file.type) ||
           /\.(bmp|BMP|png|PNG|jpg|JPG|jpeg|JPEG)$/i.test(file.name);
}

