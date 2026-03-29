import {
	uploadImage as uploadImageShared,
	validateImageFile as validateImageFileShared,
} from "../../../../utils/cloudinary-upload";

/**
 * Wrapper para mantener compatibilidad con el kit legacy.
 * Toda la logica vive en components/tenant/utils/cloudinary-upload.ts
 */
export const validateImageFile = (file) => validateImageFileShared(file);

/**
 * Wrapper para mantener compatibilidad con el kit legacy.
 */
export const uploadImage = (file, folder = "tenant") =>
	uploadImageShared(file, folder);
