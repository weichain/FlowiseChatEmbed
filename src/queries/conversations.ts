import Cookies from 'js-cookie';

export async function getChatById({ conversationId, walletAddress, baseUrl }: { conversationId: string; walletAddress: string; baseUrl: string }) {
  try {
    const authToken = Cookies.get('jwt');

    const response = await fetch(`${baseUrl}api/v1/wallets/${walletAddress}/conversations/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }

    return await response.json();
  } catch (error) {
    return [];
  }
}

export async function updateConversationById({
  conversationId,
  saveImage,
  messageId,
  walletAddress,
  baseUrl,
}: {
  conversationId: string;
  saveImage: boolean;
  messageId: string;
  walletAddress: string;
  baseUrl: string;
}) {
  try {
    const authToken = Cookies.get('jwt');
    const body = JSON.stringify({ imageSaved: saveImage });

    const response = await fetch(`${baseUrl}api/v1/wallets/${walletAddress}/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PATCH',
      body,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}
