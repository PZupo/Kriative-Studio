/**
 * Compresses a base64 image string by converting it to a lower-quality JPEG.
 * This is crucial for storing image data in localStorage without exceeding quotas.
 * @param base64Str The original base64 data URL (e.g., from PNG).
 * @param quality A number between 0 and 1 representing the JPEG quality. Defaults to 0.75.
 * @returns A promise that resolves to the compressed base64 data URL in JPEG format.
 */
export const compressImage = (base64Str: string, quality: number = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
        // If the input isn't a valid data URL, return it as is (e.g., placeholder URLs).
        if (!base64Str || !base64Str.startsWith('data:image')) {
            return resolve(base64Str);
        }

        const img = new Image();
        img.src = base64Str;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Não foi possível obter o contexto do canvas para compressão de imagem.'));
            }

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Draw the image onto the canvas
            ctx.drawImage(img, 0, 0);

            // Get the data URL for the image in JPEG format with the specified quality
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };

        img.onerror = (error) => {
            console.error("Erro ao carregar a imagem para compressão:", error);
            reject(new Error('Falha ao carregar a imagem para compressão.'));
        };
    });
};
