import type { Material } from '#/components';

export interface MessageAttachment {
  id?: string;
  type: 'image' | 'video' | 'file' | 'link';
  materialId?: number;
  mediaId?: number;
  url?: string;
  name?: string;
}

export function generateAttachmentId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function materialToMessageAttachment(
  material: Material,
): MessageAttachment {
  const attachment: MessageAttachment = {
    id: generateAttachmentId(),
    type: material.type.toLowerCase() as MessageAttachment['type'],
    materialId: material.id,
    name: material.name,
  };

  if (
    material.type === 'IMAGE' ||
    material.type === 'VIDEO' ||
    material.type === 'FILE'
  ) {
    if (material.mediaIds && material.mediaIds.length > 0) {
      attachment.mediaId = material.mediaIds[0];
    }
  } else if (material.type === 'LINK' && material.linkUrl) {
    attachment.url = material.linkUrl;
  }

  return attachment;
}

export function materialsToMessageAttachments(
  materials: Material[],
): MessageAttachment[] {
  return materials.map(materialToMessageAttachment);
}
