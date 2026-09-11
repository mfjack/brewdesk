export function resizeImage(file: File, maxDimension = 512, mimeType = "image/jpeg", quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));

    reader.onload = () => {
      const img = new window.Image();

      img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));

      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(mimeType, quality));
      };

      img.src = typeof reader.result === "string" ? reader.result : "";
    };

    reader.readAsDataURL(file);
  });
}
