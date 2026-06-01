import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  resolveStoredFileAccessUrl,
} from './upload-access-token.util';

describe('upload access tokens', () => {
  it("laisse l'url locale inchangée pour un fichier sensible", () => {
    const url = 'http://localhost:5000/uploads/identity-documents/a.pdf';
    assert.equal(resolveStoredFileAccessUrl(url), url);
  });

  it('proxifie le blob sensible vers /uploads', () => {
    const blob = 'https://abc.public.blob.vercel-storage.com/identity-documents/a.pdf';
    const proxied = resolveStoredFileAccessUrl(blob);
    assert.match(proxied, /\/uploads\/identity-documents\/a\.pdf$/);
  });

  it("laisse inchangé un fichier non sensible", () => {
    const avatarUrl = 'http://localhost:5000/uploads/avatars/a.png';
    assert.equal(resolveStoredFileAccessUrl(avatarUrl), avatarUrl);
  });
});
