const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const validateImageFile = (file: File | null) => {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: "Archivo no valido." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "La imagen es muy pesada (max. 5 MB)." };
  }
  const type = (file.type || "").toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(type)) {
    return { valid: false, error: "Solo se permiten imagenes JPG, PNG o WebP." };
  }
  return { valid: true };
};

export const uploadImage = async (file: File, folder = "tenant") => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary configuration is missing in .env");
  }

  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Archivo no valido.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    const msg = errorData.error?.message || "Error uploading to Cloudinary";
    if (
      msg.toLowerCase().includes("preset") &&
      msg.toLowerCase().includes("not found")
    ) {
      throw new Error(
        "Configuracion de Cloudinary: el Upload Preset no existe. Revisa .env y crea un preset sin firmar."
      );
    }
    throw new Error(msg);
  }

  const data = await response.json();
  return data.secure_url as string;
};

const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";
const TRANSFORM_HINT = /(?:^|,)(w_|h_|c_|q_|f_|g_)/;

export const getCloudinaryOptimizedUrl = (
  url: string | null,
  options?: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
    crop?: string;
    gravity?: string;
  }
) => {
  if (!url || !url.includes("res.cloudinary.com")) return url;

  const [base, query] = url.split("?");
  const markerIndex = base.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (markerIndex === -1) return url;

  const prefix = base.slice(0, markerIndex + CLOUDINARY_UPLOAD_SEGMENT.length);
  const rest = base.slice(markerIndex + CLOUDINARY_UPLOAD_SEGMENT.length);
  const firstSegment = rest.split("/")[0] ?? "";
  if (TRANSFORM_HINT.test(firstSegment) || firstSegment.includes(",")) {
    return url;
  }

  const width = options?.width ?? 600;
  const height = options?.height;
  const crop = options?.crop ?? "fill";
  const quality = options?.quality ?? "auto";
  const format = options?.format ?? "auto";
  const gravity = options?.gravity;

  const transformParts = [`f_${format}`, `q_${quality}`];
  if (width) transformParts.push(`w_${width}`);
  if (height) transformParts.push(`h_${height}`);
  if (crop) transformParts.push(`c_${crop}`);
  if (gravity) transformParts.push(`g_${gravity}`);

  const transform = transformParts.join(",");
  const finalUrl = `${prefix}${transform}/${rest}`;
  return query ? `${finalUrl}?${query}` : finalUrl;
};
