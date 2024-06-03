import { v4 as uuidV4 } from 'uuid';
import Cookies from 'js-cookie';

export async function saveImage({ baseUrl, imageUrl, messageId }: { baseUrl: string; imageUrl: string; messageId: string }) {
  try {
    const authToken = Cookies.get('jwt');

    const urlStream = await fetch(imageUrl);
    const url = await urlStream.arrayBuffer();
    const blob = new Blob([url]);
    const file = new File([blob], uuidV4());
    const data = new FormData();
    data.append('file', file);
    data.append('messageId', messageId);

    const response = await fetch(`${baseUrl}api/v1/files?saveAlsoAsJSON=true`, {
      method: 'POST',
      body: data,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      cache: 'no-store',
    });

    return await response.json();
  } catch (error) {
    console.error('error', error);
    return null;
  }
}

export async function deleteImageByMessageId({ baseUrl, conversationId, messageId }: { baseUrl: string; conversationId: string; messageId: string }) {
  const authToken = Cookies.get('jwt');
  try {
    const response = await fetch(`${baseUrl}api/v1/conversations/${conversationId}/messages/${messageId}/images`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete image by message id');
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}
