/**
 * Tool Integration Service
 * Handles duplication of templates for Miro boards and Google Drive files
 */

interface DuplicationResult {
  success: boolean;
  url?: string;
  externalId?: string;
  error?: string;
}

// ── Miro Integration ──────────────────────────────────────────

function extractMiroBoardId(url: string): string | null {
  const match = url.match(/board\/([a-zA-Z0-9_=-]+)/);
  return match ? match[1] : null;
}

export async function duplicateMiroBoard(
  templateUrl: string,
  apiToken: string,
  boardName: string
): Promise<DuplicationResult> {
  const boardId = extractMiroBoardId(templateUrl);
  if (!boardId) {
    return { success: false, error: "Could not extract Miro board ID from URL" };
  }

  try {
    const res = await fetch(`https://api.miro.com/v2/boards?copy_from=${boardId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: boardName,
        sharingPolicy: {
          access: "edit",
          teamAccess: "edit",
        },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: `Miro API error ${res.status}: ${errorData.message || res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      url: data.viewLink || `https://miro.com/app/board/${data.id}/`,
      externalId: data.id,
    };
  } catch (err: any) {
    return { success: false, error: `Miro request failed: ${err.message}` };
  }
}

// ── Google Drive Integration ──────────────────────────────────

function extractGoogleFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function duplicateGoogleFile(
  templateUrl: string,
  apiToken: string,
  fileName: string
): Promise<DuplicationResult> {
  const fileId = extractGoogleFileId(templateUrl);
  if (!fileId) {
    return { success: false, error: "Could not extract Google file ID from URL" };
  }

  try {
    // Copy the file
    const copyRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/copy`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: fileName }),
      }
    );

    if (!copyRes.ok) {
      const errorData = await copyRes.json().catch(() => ({}));
      return {
        success: false,
        error: `Google Drive copy error ${copyRes.status}: ${errorData.error?.message || copyRes.statusText}`,
      };
    }

    const copyData = await copyRes.json();
    const newFileId = copyData.id;

    // Set permissions to anyone with link can edit
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${newFileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "writer", type: "anyone" }),
      }
    );

    // Get the web view link
    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${newFileId}?fields=webViewLink`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
      }
    );

    let viewLink = `https://docs.google.com/file/d/${newFileId}/edit`;
    if (fileRes.ok) {
      const fileData = await fileRes.json();
      if (fileData.webViewLink) viewLink = fileData.webViewLink;
    }

    return {
      success: true,
      url: viewLink,
      externalId: newFileId,
    };
  } catch (err: any) {
    return { success: false, error: `Google Drive request failed: ${err.message}` };
  }
}

// ── Dispatcher ────────────────────────────────────────────────

export async function duplicateTemplate(
  provider: string,
  templateUrl: string,
  apiToken: string,
  entryName: string
): Promise<DuplicationResult> {
  switch (provider) {
    case "MIRO":
      return duplicateMiroBoard(templateUrl, apiToken, entryName);
    case "GOOGLE_SLIDES":
    case "GOOGLE_DOCS":
      return duplicateGoogleFile(templateUrl, apiToken, entryName);
    default:
      return { success: false, error: `Unsupported provider for template duplication: ${provider}` };
  }
}
